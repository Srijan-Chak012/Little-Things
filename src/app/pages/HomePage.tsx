import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArchedTitle } from '../components/ArchedTitle';
import { EditScribbleDialog } from '../components/EditScribbleDialog';
import { ProfileButton, ProfileOverlay, useProfileImage } from '../components/ProfileOverlay';
import { Plus, Trash2, Menu, X, Settings, ChevronLeft, ChevronRight, Pencil, Clock, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { isAlbumSupported, setupAlbumFolder, hasAlbumFolder } from '../albumStorage';
import LoginPage from './LoginPage';

interface Scribble {
  id: string;
  timestamp: string;
  imageData: string;
  emoji: string[];
  tags: string[];
  description: string;
  name?: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const profileImage = useProfileImage();
  const [scribbles, setScribbles] = useState<Scribble[]>([]);
  const [editingScribble, setEditingScribble] = useState<Scribble | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'vibe' | 'threads'>('timeline');
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [storyEmoji, setStoryEmoji] = useState<string | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyTag, setStoryTag] = useState<string | null>(null);
  const [storyTagIndex, setStoryTagIndex] = useState(0);
  const [notificationScribble, setNotificationScribble] = useState<Scribble | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const notificationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Schedule pending notifications
  const scheduleNotifications = useCallback((scribbleList: Scribble[]) => {
    // Clear existing timers
    notificationTimers.current.forEach(t => clearTimeout(t));
    notificationTimers.current = [];

    const pendingRaw = localStorage.getItem('pendingNotifications');
    if (!pendingRaw) return;
    const pending: { scribbleId: string; triggerAt: number }[] = JSON.parse(pendingRaw);
    const now = Date.now();
    const remaining: typeof pending = [];

    pending.forEach(n => {
      const scribble = scribbleList.find(s => s.id === n.scribbleId);
      if (!scribble) return; // scribble deleted
      const delay = n.triggerAt - now;
      if (delay <= 0) {
        // Fire immediately
        setNotificationScribble(scribble);
        setNotificationVisible(true);
      } else {
        remaining.push(n);
        const timer = setTimeout(() => {
          setNotificationScribble(scribble);
          setNotificationVisible(true);
          // Remove from pending
          const updated = JSON.parse(localStorage.getItem('pendingNotifications') || '[]').filter((p: any) => p.scribbleId !== n.scribbleId);
          localStorage.setItem('pendingNotifications', JSON.stringify(updated));
        }, delay);
        notificationTimers.current.push(timer);
      }
    });

    // Keep only future notifications
    localStorage.setItem('pendingNotifications', JSON.stringify(remaining));
  }, []);

  useEffect(() => {
    return () => notificationTimers.current.forEach(t => clearTimeout(t));
  }, []);

  // When scribbles load, schedule any pending notifications
  useEffect(() => {
    if (scribbles.length > 0) {
      scheduleNotifications(scribbles);
    }
  }, [scribbles, scheduleNotifications]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Not logged in — show login prompt
      setShowLogin(true);
      // Still load from localStorage so they can see their local scribbles
      const saved = localStorage.getItem('scribbles');
      if (saved) {
        setScribbles(JSON.parse(saved));
      }
    } else {
      // Logged in — sync localStorage then load from server
      syncAndLoad();
    }
  }, [isAuthenticated, isLoading]);

  const syncAndLoad = async () => {
    setSyncing(true);
    try {
      // Check if there are unsynced local scribbles
      const localData = localStorage.getItem('scribbles');
      if (localData) {
        const localScribbles = JSON.parse(localData);
        if (localScribbles.length > 0) {
          await api.syncScribbles(localScribbles);
          // Clear localStorage after successful sync
          localStorage.removeItem('scribbles');
        }
      }

      // Load all scribbles from server
      const data = await api.getScribbles();
      setScribbles(data.scribbles);
    } catch (err) {
      console.error('Failed to sync/load scribbles:', err);
      // Fallback to localStorage
      const saved = localStorage.getItem('scribbles');
      if (saved) {
        setScribbles(JSON.parse(saved));
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    // After login, sync will happen via the useEffect
  };

  // Show login page if not authenticated
  if (showLogin && !isAuthenticated) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  const deleteScribble = async (id: string) => {
    const updated = scribbles.filter(s => s.id !== id);
    setScribbles(updated);
    if (isAuthenticated) {
      // Clear localStorage to prevent deleted scribbles from being re-synced
      localStorage.removeItem('scribbles');
      try {
        await api.deleteScribble(id);
      } catch (err) {
        console.error('Failed to delete from server:', err);
      }
    } else {
      localStorage.setItem('scribbles', JSON.stringify(updated));
    }
  };

  const updateScribble = async (updatedScribble: Scribble) => {
    const updated = scribbles.map(s => 
      s.id === updatedScribble.id ? updatedScribble : s
    );
    setScribbles(updated);
    if (isAuthenticated) {
      try {
        await api.updateScribble(updatedScribble.id, {
          emoji: updatedScribble.emoji,
          tags: updatedScribble.tags,
          description: updatedScribble.description,
          name: updatedScribble.name,
        });
      } catch {}
    } else {
      localStorage.setItem('scribbles', JSON.stringify(updated));
    }
    setEditingScribble(null);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group scribbles by emoji for Vibe view
  const groupByEmoji = () => {
    const grouped: { [key: string]: Scribble[] } = {};
    scribbles.forEach(scribble => {
      const emojis = Array.isArray(scribble.emoji) ? scribble.emoji : scribble.emoji ? [scribble.emoji] : [];
      if (emojis.length === 0) {
        const key = 'No Emoji';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(scribble);
      } else {
        emojis.forEach(e => {
          if (!grouped[e]) grouped[e] = [];
          grouped[e].push(scribble);
        });
      }
    });
    return grouped;
  };

  // Group scribbles by tags for Threads view
  const groupByTags = () => {
    const grouped: { [key: string]: Scribble[] } = {};
    scribbles.forEach(scribble => {
      if (scribble.tags.length === 0) {
        const key = 'Untagged';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(scribble);
      } else {
        scribble.tags.forEach(tag => {
          if (!grouped[tag]) {
            grouped[tag] = [];
          }
          grouped[tag].push(scribble);
        });
      }
    });
    return grouped;
  };

  const renderScribbleCard = (scribble: Scribble) => (
    <div
      key={scribble.id}
      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 relative group"
    >
      <div 
        className="aspect-square relative cursor-pointer p-3 bg-gray-50"
        onClick={() => setEditingScribble(scribble)}
      >
        <img
          src={scribble.imageData}
          alt="Scribble"
          className="w-full h-full object-contain"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteScribble(scribble.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity shadow-lg active:scale-95"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2">
        <div className="flex items-center gap-2 mb-1">
          {Array.isArray(scribble.emoji) && scribble.emoji.length > 0 && (
            <span className="text-xl">{scribble.emoji.join('')}</span>
          )}
          <span className="text-xs text-gray-500 truncate flex-1">
            {formatDate(scribble.timestamp)}
          </span>
        </div>
        {scribble.name && (
          <p className="text-sm font-medium text-gray-800 mb-1 truncate">
            {scribble.name}
          </p>
        )}
        {scribble.description && (
          <p className="text-xs text-gray-700 line-clamp-2 mb-1">
            {scribble.description}
          </p>
        )}
        {scribble.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scribble.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {scribble.tags.length > 2 && (
              <span className="text-xs text-gray-500">
                +{scribble.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'timeline':
        return (
          <div className="grid grid-cols-2 gap-3">
            {scribbles.map(renderScribbleCard)}
          </div>
        );
      case 'vibe':
        const groupedByEmoji = groupByEmoji();
        const availableEmojis = Object.keys(groupedByEmoji).filter(k => k !== 'No Emoji');
        const emojiPhrases: Record<string, string> = {
          '😊': 'A smile that just burst through',
          '🤩': 'Something that lit a spark',
          '😎': 'Felt effortlessly awesome',
          '😤': 'That quiet "I did it" moment',
          '🥹': 'A little thing worth holding onto',
          '🤔': 'Lost in a good thought',
          '😢': 'Needed to let it out',
          '😡': 'The fire that wouldn\'t settle',
          '🤢': 'Something that just didn\'t sit right',
          '😰': 'The weight that crept in',
        };
        return (
          <div className="flex flex-col gap-3 py-2">
            {availableEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => { setStoryEmoji(emoji); setStoryIndex(0); }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-200 hover:shadow-md hover:translate-x-1 transition-all active:scale-[0.98] text-left"
              >
                <span className="text-4xl flex-shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium italic">
                    "{emojiPhrases[emoji] || 'a moment captured'}"
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {groupedByEmoji[emoji].length} {groupedByEmoji[emoji].length === 1 ? 'story' : 'stories'}
                  </p>
                </div>
              </button>
            ))}
            {availableEmojis.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <p className="text-gray-400">No emojis tagged yet</p>
              </div>
            )}
          </div>
        );
      case 'threads':
        const groupedByTags = groupByTags();
        const tagKeys = Object.keys(groupedByTags);
        return (
          <div className="relative py-2">
            {/* Decorative looping threads behind the boxes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 0 }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="threadGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="threadGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fdba74" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="threadGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#86efac" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              {/* Thread 1 - flowing left to right with loops */}
              <path
                d="M -10,60 C 40,20 60,100 100,50 C 140,0 120,120 170,70 C 220,20 200,130 260,80 C 310,30 290,140 350,90 C 400,40 380,150 440,100"
                fill="none"
                stroke="url(#threadGrad1)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Thread 2 - flowing with bigger loops */}
              <path
                d="M -20,160 Q 30,100 80,160 Q 130,220 180,140 Q 230,60 280,160 Q 330,260 380,140 Q 420,60 460,160"
                fill="none"
                stroke="url(#threadGrad2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Thread 3 - gentle wave with loop curls */}
              <path
                d="M -10,280 C 20,250 40,310 70,270 C 100,230 80,330 130,290 C 160,260 190,340 220,280 C 250,220 240,350 290,300 C 340,250 320,370 380,310 C 420,270 440,350 460,300"
                fill="none"
                stroke="url(#threadGrad3)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Loop accents - small decorative circles along threads */}
              <circle cx="100" cy="50" r="12" fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity="0.3" />
              <circle cx="260" cy="80" r="10" fill="none" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.3" />
              <circle cx="180" cy="140" r="14" fill="none" stroke="#fca5a5" strokeWidth="1.5" opacity="0.3" />
              <circle cx="70" cy="270" r="11" fill="none" stroke="#86efac" strokeWidth="1.5" opacity="0.3" />
              <circle cx="290" cy="300" r="13" fill="none" stroke="#67e8f9" strokeWidth="1.5" opacity="0.3" />
              {/* Spiral accents */}
              <path
                d="M 350,90 C 355,82 365,82 365,90 C 365,98 355,100 350,95"
                fill="none" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.35"
              />
              <path
                d="M 80,160 C 85,150 95,150 95,160 C 95,170 85,172 80,165"
                fill="none" stroke="#fdba74" strokeWidth="1.5" opacity="0.35"
              />
              <path
                d="M 220,280 C 225,270 235,270 235,280 C 235,290 225,292 220,285"
                fill="none" stroke="#86efac" strokeWidth="1.5" opacity="0.35"
              />
            </svg>

            <div className="grid grid-cols-2 gap-3 relative" style={{ zIndex: 1 }}>
              {tagKeys.map((tag, idx) => {
                const colors = [
                  'border-l-blue-300',
                  'border-l-purple-300',
                  'border-l-rose-300',
                  'border-l-amber-300',
                  'border-l-emerald-300',
                  'border-l-cyan-300',
                ];
                const accent = colors[idx % colors.length];
                return (
                  <button
                    key={tag}
                    onClick={() => { setStoryTag(tag); setStoryTagIndex(0); }}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all active:scale-[0.97] border border-gray-100 border-l-4 ${accent} text-center`}
                  >
                    <span className="text-sm font-semibold text-gray-800 mb-1">{tag}</span>
                    <span className="text-xs text-gray-400">
                      {groupedByTags[tag].length} {groupedByTags[tag].length === 1 ? 'drawing' : 'drawings'}
                    </span>
                  </button>
                );
              })}
              {tagKeys.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center h-full text-center py-12">
                  <p className="text-gray-400">No tags yet</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
      <div className="w-full h-full md:w-[390px] md:h-[844px] flex flex-col bg-gray-50 overflow-hidden md:shadow-2xl md:rounded-[3rem] md:border-8 md:border-gray-800 relative">
        {/* Header */}
        <div className="relative bg-white border-b border-gray-200 py-2 px-4 z-10">
          <button
            onClick={() => { setShowMenu(!showMenu); setShowProfile(false); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-all active:scale-95 z-20"
            aria-label="Menu"
          >
            {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <ArchedTitle text="The Little Things" />
          <ProfileButton onClick={() => { setShowProfile(!showProfile); setShowMenu(false); }} profileImage={profileImage} />
        </div>

        {/* Backdrop to close panels */}
        {(showMenu || showSettings) && (
          <div
            className="absolute inset-0 z-[55]"
            onClick={() => { setShowMenu(false); setShowSettings(false); }}
          />
        )}

        <ProfileOverlay show={showProfile} onClose={() => setShowProfile(false)} />

        {/* Slide-in Menu (views only) */}
        {showMenu && (
          <div className="absolute top-[60px] left-0 w-64 bg-white shadow-lg z-[60] rounded-br-2xl border-r border-b border-gray-200">
            <div className="p-2">
              <button
                onClick={() => {
                  setViewMode('timeline');
                  setShowMenu(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-blue-500 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => {
                  setViewMode('vibe');
                  setShowMenu(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  viewMode === 'vibe'
                    ? 'bg-blue-500 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Vibe (Emojis)
              </button>
              <button
                onClick={() => {
                  setViewMode('threads');
                  setShowMenu(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  viewMode === 'threads'
                    ? 'bg-blue-500 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Threads (Tags)
              </button>
            </div>
          </div>
        )}

        {/* Settings Overlay */}
        {showSettings && (
          <SettingsOverlay
            onClose={() => setShowSettings(false)}
            onTestNotification={() => {
              if (scribbles.length > 0) {
                setNotificationScribble(scribbles[0]);
                setNotificationVisible(true);
                setShowSettings(false);
              }
            }}
          />
        )}

        {/* Scribbles Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {syncing ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="text-4xl mb-4 animate-spin">🔄</div>
              <p className="text-gray-600">Syncing your scribbles...</p>
            </div>
          ) : scribbles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Scribbles Yet</h3>
              <p className="text-gray-600 mb-6">Start creating your little moments!</p>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Floating Settings Button (bottom-left) */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute bottom-6 left-6 w-16 h-16 bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-gray-800 z-10"
          aria-label="Settings"
        >
          <Settings className="w-7 h-7" />
        </button>

        {/* Floating Add Button (bottom-right) */}
        <button
          onClick={() => navigate('/')}
          className="absolute bottom-6 right-6 w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-blue-600 z-10"
          aria-label="Create new scribble"
        >
          <Plus className="w-8 h-8" />
        </button>

        {/* Story Overlay */}
        {storyEmoji && (() => {
          const grouped = groupByEmoji();
          const stories = grouped[storyEmoji] || [];
          const current = stories[storyIndex];
          if (!current) { setStoryEmoji(null); return null; }
          return (
            <div className="absolute inset-0 bg-black z-[200] flex flex-col">
              {/* Progress bar */}
              <div className="flex gap-1 p-3 pt-4">
                {stories.map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/30">
                    <div className={`h-full rounded-full transition-all duration-300 ${i <= storyIndex ? 'bg-white' : 'bg-transparent'}`} style={{ width: i <= storyIndex ? '100%' : '0%' }} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-2xl">{storyEmoji}</span>
                <button
                  onClick={() => setStoryEmoji(null)}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <div
                  className="w-full max-w-[280px] bg-white rounded-2xl overflow-hidden shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  onClick={() => { setEditingScribble(current); setStoryEmoji(null); }}
                >
                  <div className="p-4 bg-gray-50 relative">
                    <img
                      src={current.imageData}
                      alt="Scribble"
                      className="w-full aspect-square object-contain"
                    />
                    <div className="absolute top-2 right-2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    {current.name && (
                      <p className="font-semibold text-gray-800 mb-1">{current.name}</p>
                    )}
                    {current.description && (
                      <p className="text-sm text-gray-600 mb-3">{current.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(current.timestamp).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setViewMode('timeline'); setStoryEmoji(null); }}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all active:scale-95"
                >
                  <Clock className="w-4 h-4" />
                  View in Timeline
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-6 py-6">
                <button
                  onClick={() => setStoryIndex(Math.max(0, storyIndex - 1))}
                  disabled={storyIndex === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white/60 text-sm">{storyIndex + 1} / {stories.length}</span>
                <button
                  onClick={() => {
                    if (storyIndex < stories.length - 1) {
                      setStoryIndex(storyIndex + 1);
                    } else {
                      setStoryEmoji(null);
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-95 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Tag Story Overlay */}
        {storyTag && (() => {
          const grouped = groupByTags();
          const stories = grouped[storyTag] || [];
          const current = stories[storyTagIndex];
          if (!current) { setStoryTag(null); return null; }
          return (
            <div className="absolute inset-0 bg-black z-[200] flex flex-col">
              {/* Progress bar */}
              <div className="flex gap-1 p-3 pt-4">
                {stories.map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/30">
                    <div className={`h-full rounded-full transition-all duration-300 ${i <= storyTagIndex ? 'bg-white' : 'bg-transparent'}`} style={{ width: i <= storyTagIndex ? '100%' : '0%' }} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full">#{storyTag}</span>
                <button
                  onClick={() => setStoryTag(null)}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <div
                  className="w-full max-w-[280px] bg-white rounded-2xl overflow-hidden shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  onClick={() => { setEditingScribble(current); setStoryTag(null); }}
                >
                  <div className="p-4 bg-gray-50 relative">
                    <img
                      src={current.imageData}
                      alt="Scribble"
                      className="w-full aspect-square object-contain"
                    />
                    <div className="absolute top-2 right-2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    {current.name && (
                      <p className="font-semibold text-gray-800 mb-1">{current.name}</p>
                    )}
                    {current.description && (
                      <p className="text-sm text-gray-600 mb-3">{current.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(current.timestamp).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setViewMode('timeline'); setStoryTag(null); }}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-all active:scale-95"
                >
                  <Clock className="w-4 h-4" />
                  View in Timeline
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-6 py-6">
                <button
                  onClick={() => setStoryTagIndex(Math.max(0, storyTagIndex - 1))}
                  disabled={storyTagIndex === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white/60 text-sm">{storyTagIndex + 1} / {stories.length}</span>
                <button
                  onClick={() => {
                    if (storyTagIndex < stories.length - 1) {
                      setStoryTagIndex(storyTagIndex + 1);
                    } else {
                      setStoryTag(null);
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-95 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Notification Overlay */}
        {notificationVisible && notificationScribble && (
          <div className="absolute inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setNotificationVisible(false)}
            />
            {/* Card */}
            <div className="relative w-[320px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              {/* Decorative gradient header */}
              <div className="relative h-20 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 320 80">
                    <circle cx="40" cy="20" r="30" fill="white" opacity="0.3" />
                    <circle cx="280" cy="60" r="25" fill="white" opacity="0.2" />
                    <circle cx="160" cy="10" r="15" fill="white" opacity="0.25" />
                  </svg>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <Bell className="w-7 h-7 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pt-5 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 text-center mb-1">
                  Remember this?
                </h3>
                <p className="text-xs text-gray-400 text-center mb-4">
                  You drew something beautiful — let's make it complete ✨
                </p>

                {/* Scribble preview */}
                <div className="bg-gray-50 rounded-2xl p-3 mb-4 border border-gray-100">
                  <img
                    src={notificationScribble.imageData}
                    alt="Your scribble"
                    className="w-full aspect-square object-contain rounded-xl"
                  />
                </div>

                {/* Scribble name */}
                {notificationScribble.name && (
                  <p className="text-sm font-medium text-gray-700 text-center mb-1">
                    "{notificationScribble.name}"
                  </p>
                )}

                {/* Prompt */}
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-5">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    {!notificationScribble.description
                      ? 'Add a description to capture the story behind this moment.'
                      : 'Revisit and refine your scribble — add more details or edit it.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setNotificationVisible(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    Later
                  </button>
                  <button
                    onClick={() => {
                      setNotificationVisible(false);
                      setEditingScribble(notificationScribble);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit & Describe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        {editingScribble && (
          <EditScribbleDialog
            scribble={editingScribble}
            onSave={updateScribble}
            onCancel={() => setEditingScribble(null)}
          />
        )}

      </div>
    </div>
  );
}

function SettingsOverlay({ onClose, onTestNotification }: { onClose: () => void; onTestNotification?: () => void }) {
  const [settings, setSettings] = useState({
    notificationHours: 0,
    notificationMinutes: 30,
    showEmoji: true,
    showTags: true,
  });
  const [albumStatus, setAlbumStatus] = useState<'checking' | 'not-set' | 'ready'>('checking');

  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    // Check album status
    hasAlbumFolder().then(has => setAlbumStatus(has ? 'ready' : 'not-set'));
  }, []);

  const saveSettings = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    onClose();
  };

  return (
    <div className="absolute bottom-24 left-6 w-72 bg-white shadow-lg z-[60] rounded-2xl border border-gray-200">
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Settings</h3>

        {/* Notification Time */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Notification Time (after scribble)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Hrs</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.notificationHours}
                onChange={(e) => setSettings({
                  ...settings,
                  notificationHours: Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <span className="text-gray-400 mt-5">:</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Min</label>
              <input
                type="number"
                min="0"
                max="59"
                value={settings.notificationMinutes}
                onChange={(e) => setSettings({
                  ...settings,
                  notificationMinutes: Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Show Emoji Toggle */}
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-gray-700">Show Emoji</label>
          <button
            onClick={() => setSettings({ ...settings, showEmoji: !settings.showEmoji })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.showEmoji ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
              settings.showEmoji ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Show Tags Toggle */}
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm text-gray-700">Show Tags</label>
          <button
            onClick={() => setSettings({ ...settings, showTags: !settings.showTags })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.showTags ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
              settings.showTags ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Album Folder */}
        {isAlbumSupported() && (
          <div className="mb-4 pt-3 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Device Album
            </label>
            {albumStatus === 'ready' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600 flex-1">✓ Album folder linked</span>
                <button
                  onClick={async () => {
                    const ok = await setupAlbumFolder();
                    if (ok) setAlbumStatus('ready');
                  }}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  const ok = await setupAlbumFolder();
                  if (ok) setAlbumStatus('ready');
                }}
                className="w-full py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 active:scale-95 transition-all"
              >
                📁 Choose Album Folder
              </button>
            )}
            <p className="text-[10px] text-gray-400 mt-1">
              Scribbles will be saved as images in this folder
            </p>
          </div>
        )}

        {/* Test Notification */}
        {onTestNotification && (
          <button
            onClick={onTestNotification}
            className="w-full mb-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 active:scale-95 transition-all"
          >
            🔔 Test Notification
          </button>
        )}

        {/* Save */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 active:scale-95 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}