import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DrawingTools } from '../components/DrawingTools';
import { ArchedTitle } from '../components/ArchedTitle';
import { SaveDialog } from '../components/SaveDialog';
import { ProfileButton, ProfileOverlay, useProfileImage } from '../components/ProfileOverlay';
import { Pen, Home, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { saveToAlbum, hasAlbumFolder } from '../albumStorage';

interface DrawingState {
  color: string;
  brushSize: number;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  brushSize: number;
}

export default function DrawingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const profileImage = useProfileImage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    color: '#000000',
    brushSize: 3,
  });
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // Initialize canvas with dotted background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        drawDottedBackground(ctx, rect.width, rect.height);
        redrawAllStrokes();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [strokes]);

  const drawDottedBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    const dotSpacing = 20;
    const dotRadius = 1.5;
    ctx.fillStyle = '#cbd5e0';
    
    for (let x = dotSpacing; x < width; x += dotSpacing) {
      for (let y = dotSpacing; y < height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const redrawAllStrokes = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    drawDottedBackground(ctx, rect.width, rect.height);

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const point = getCoordinates(e);
    setCurrentStroke([point]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const point = getCoordinates(e);
    const newStroke = [...currentStroke, point];
    setCurrentStroke(newStroke);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawingState.color;
    ctx.lineWidth = drawingState.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      setStrokes([
        ...strokes,
        {
          points: currentStroke,
          color: drawingState.color,
          brushSize: drawingState.brushSize,
        },
      ]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const clearCanvas = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      drawDottedBackground(ctx, rect.width, rect.height);
    }
  };

  const undo = () => {
    if (strokes.length > 0) {
      setStrokes(strokes.slice(0, -1));
    }
  };

  const handleSave = async (emojis: string[], tags: string[], description: string) => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;

    // Find the bounding box of all strokes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    strokes.forEach(stroke => {
      stroke.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    // Add padding around the scribble
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);

    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;

    // Create a temporary canvas for the cropped image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = croppedWidth;
    tempCanvas.height = croppedHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;

    // Draw dotted background
    tempCtx.fillStyle = '#f8f9fa';
    tempCtx.fillRect(0, 0, croppedWidth, croppedHeight);
    
    const dotSpacing = 20;
    const dotRadius = 1.5;
    tempCtx.fillStyle = '#cbd5e0';
    
    for (let x = dotSpacing; x < croppedWidth; x += dotSpacing) {
      for (let y = dotSpacing; y < croppedHeight; y += dotSpacing) {
        tempCtx.beginPath();
        tempCtx.arc(x, y, dotRadius, 0, Math.PI * 2);
        tempCtx.fill();
      }
    }

    // Draw the strokes onto the temp canvas, offset by the bounding box
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      tempCtx.strokeStyle = stroke.color;
      tempCtx.lineWidth = stroke.brushSize;
      tempCtx.lineCap = 'round';
      tempCtx.lineJoin = 'round';
      
      tempCtx.beginPath();
      tempCtx.moveTo(stroke.points[0].x - minX, stroke.points[0].y - minY);
      
      for (let i = 1; i < stroke.points.length; i++) {
        tempCtx.lineTo(stroke.points[i].x - minX, stroke.points[i].y - minY);
      }
      
      tempCtx.stroke();
    });

    // Convert the cropped canvas to data URL
    const imageData = tempCanvas.toDataURL('image/png');
    
    // Create scribble object with timestamp
    const scribble = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      imageData,
      strokes,
      emoji: emojis,
      tags,
      description,
    };

    if (isAuthenticated) {
      // Save directly to backend
      try {
        await api.saveScribble(scribble);
      } catch (err) {
        console.error('Failed to save to server, saving locally', err);
        const existingScribbles = JSON.parse(localStorage.getItem('scribbles') || '[]');
        localStorage.setItem('scribbles', JSON.stringify([scribble, ...existingScribbles]));
      }
    } else {
      // Save to localStorage — will be synced after login on home page
      const existingScribbles = JSON.parse(localStorage.getItem('scribbles') || '[]');
      localStorage.setItem('scribbles', JSON.stringify([scribble, ...existingScribbles]));
    }
    
    // Clear the canvas
    clearCanvas();

    // Save to device album if configured
    const albumConfigured = await hasAlbumFolder();
    if (albumConfigured) {
      await saveToAlbum(imageData, description || undefined, scribble.timestamp);
    }

    // Schedule notification for this scribble
    const settingsRaw = localStorage.getItem('appSettings');
    const appSettings = settingsRaw ? JSON.parse(settingsRaw) : { notificationHours: 0, notificationMinutes: 30 };
    const delayMs = (appSettings.notificationHours * 3600 + appSettings.notificationMinutes * 60) * 1000;
    if (delayMs > 0) {
      const pending = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
      pending.push({
        scribbleId: scribble.id,
        scribbleName: scribble.description ? undefined : scribble.id, // flag that description is missing
        triggerAt: Date.now() + delayMs,
      });
      localStorage.setItem('pendingNotifications', JSON.stringify(pending));
    }

    // Navigate to home page
    navigate('/home');
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
      <div className="w-[390px] h-[844px] flex flex-col bg-gray-50 overflow-hidden touch-none shadow-2xl rounded-[3rem] border-8 border-gray-800 relative">
        {/* Header */}
        <div className="relative bg-white border-b border-gray-200 py-2 px-4">
          <button
            onClick={() => navigate('/home')}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-all active:scale-95 z-20"
            aria-label="Home"
          >
            <Home className="w-6 h-6" />
          </button>
          <ArchedTitle text="The Little Things" />
          <ProfileButton onClick={() => setShowProfile(!showProfile)} profileImage={profileImage} />
        </div>

        <ProfileOverlay show={showProfile} onClose={() => setShowProfile(false)} />

        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {/* Floating Action Buttons */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-3">
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={strokes.length === 0}
              className="w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save scribble"
            >
              <Save className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowTools(!showTools)}
              className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-blue-600"
              aria-label="Toggle drawing tools"
            >
              <Pen className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {showTools && (
          <DrawingTools
            color={drawingState.color}
            brushSize={drawingState.brushSize}
            onColorChange={(color) => setDrawingState({ ...drawingState, color })}
            onBrushSizeChange={(brushSize) => setDrawingState({ ...drawingState, brushSize })}
            onClear={clearCanvas}
            onUndo={undo}
            canUndo={strokes.length > 0}
          />
        )}

        {showSaveDialog && (
          <SaveDialog
            onSave={handleSave}
            onCancel={() => setShowSaveDialog(false)}
          />
        )}
      </div>
    </div>
  );
}