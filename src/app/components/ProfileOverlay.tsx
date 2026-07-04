import { useState, useEffect } from 'react';
import { User, X, LogOut, Trash2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const STOCK_AVATARS = [
  '🐸', '🦊', '🐼', '🐙', '🦄',
  '🐯', '🦩', '🐳', '🐨', '🦋', '🐔',
];

interface ProfileOverlayProps {
  show: boolean;
  onClose: () => void;
}

export function ProfileButton({ onClick, profileImage }: { onClick: () => void; profileImage: string }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full overflow-hidden transition-all active:scale-95 z-20 border-2 border-gray-300 hover:border-blue-400 bg-gray-50"
      aria-label="Profile"
    >
      {profileImage ? (
        <span className="text-xl leading-none">{profileImage}</span>
      ) : (
        <User className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );
}

export function ProfileOverlay({ show, onClose }: ProfileOverlayProps) {
  const { user, logout, login, register, isAuthenticated } = useAuth();
  const [profileImage, setProfileImage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileImage(localStorage.getItem(`profile_image_${user.id}`) || '');
    } else {
      setProfileImage('');
    }
  }, [user]);

  // Reset login form when overlay opens
  useEffect(() => {
    if (show && !isAuthenticated) {
      setUsername('');
      setPassword('');
      setError('');
      setIsRegister(false);
    }
  }, [show, isAuthenticated]);

  if (!show) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Not authenticated — show login prompt
  if (!isAuthenticated) {
    return (
      <>
        <div className="absolute inset-0 z-[55]" onClick={onClose} />
        <div className="absolute top-[60px] right-0 w-72 bg-white shadow-lg z-[60] rounded-bl-2xl border-l border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <LogIn className="w-5 h-5 text-blue-500" />
              <p className="font-semibold text-gray-800">
                {isRegister ? 'Create Account' : 'Log In'}
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
                minLength={3}
                autoComplete="username"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
                minLength={4}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              {error && (
                <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Please wait...' : isRegister ? 'Sign Up' : 'Log In'}
              </button>
            </form>
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="w-full mt-2 text-xs text-blue-500 hover:text-blue-600 text-center"
            >
              {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-[55]" onClick={onClose} />

      {/* Panel */}
      <div className="absolute top-[60px] right-0 w-72 bg-white shadow-lg z-[60] rounded-bl-2xl border-l border-b border-gray-200">
        <div className="p-4">
          {/* Current avatar + username */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400 flex items-center justify-center bg-gray-100 shrink-0">
              {profileImage ? (
                <span className="text-2xl leading-none">{profileImage}</span>
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500">Choose an avatar below</p>
            </div>
          </div>

          {/* Stock avatar grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {/* No avatar option */}
            <button
              onClick={() => {
                setProfileImage('');
                if (user) localStorage.removeItem(`profile_image_${user.id}`);
              }}
              className={`w-14 h-14 rounded-full border-2 transition-all active:scale-95 flex items-center justify-center bg-gray-100 ${
                profileImage === ''
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            {STOCK_AVATARS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => {
                  setProfileImage(emoji);
                  if (user) localStorage.setItem(`profile_image_${user.id}`, emoji);
                }}
                className={`w-14 h-14 rounded-full border-2 transition-all active:scale-95 flex items-center justify-center bg-gray-50 text-2xl ${
                  profileImage === emoji
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>

          {/* Delete Account */}
          <button
            onClick={async () => {
              if (window.confirm('Are you sure? This will permanently delete your account and all your scribbles.')) {
                try {
                  await api.deleteAccount();
                  if (user) localStorage.removeItem(`profile_image_${user.id}`);
                  logout();
                  onClose();
                } catch (err) {
                  console.error('Failed to delete account', err);
                }
              }
            }}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-red-400 hover:bg-red-50 transition-all text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>
    </>
  );
}

export function useProfileImage() {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileImage(localStorage.getItem(`profile_image_${user.id}`) || '');
    } else {
      setProfileImage('');
    }
  }, [user]);

  // Listen for storage changes so the button updates when avatar changes in the overlay
  useEffect(() => {
    const handler = () => {
      if (user) {
        setProfileImage(localStorage.getItem(`profile_image_${user.id}`) || '');
      }
    };
    window.addEventListener('storage', handler);
    // Also poll briefly since same-tab localStorage changes don't fire storage events
    const interval = setInterval(handler, 500);
    return () => {
      window.removeEventListener('storage', handler);
      clearInterval(interval);
    };
  }, [user]);

  return profileImage;
}
