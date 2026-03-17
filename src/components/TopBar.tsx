import { Bell, Coins, Flame, Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { AvatarPreview } from './profile/AvatarPreview.tsx';
import type { AvatarSlot, BaseAvatarId } from '../data/avatarCatalog.ts';

export function TopBar({
  currentScreen,
  setScreen,
  navigationLocked = false,
  onNewTask,
  onVisualMapClick,
  onProfileClick,
  coins = 0,
  level = 1,
  xpIntoLevel = 0,
  xpToNextLevel = 100,
  streakDays = 0,
  username = 'Katja P.',
  selectedBaseAvatarId,
  selectedRpmAvatarUrl = null,
  equippedBySlot,
}: {
  currentScreen?: string;
  setScreen?: (screen: string) => void;
  navigationLocked?: boolean;
  onNewTask?: () => void;
  onVisualMapClick?: () => void;
  onProfileClick?: () => void;
  coins?: number;
  level?: number;
  xpIntoLevel?: number;
  xpToNextLevel?: number;
  streakDays?: number;
  username?: string;
  selectedBaseAvatarId: BaseAvatarId;
  selectedRpmAvatarUrl?: string | null;
  equippedBySlot: Record<AvatarSlot, string>;
}) {
  const navigate = (screen: string) => {
    if (navigationLocked) return;
    setScreen?.(screen);
  };

  const xpPercent = Math.max(0, Math.min(100, Math.round((xpIntoLevel / Math.max(1, xpToNextLevel)) * 100)));

  return (
    <header className="h-20 bg-gradient-to-r from-accent via-primary to-secondary flex items-center justify-between px-8 shrink-0 z-20 relative overflow-hidden shadow-lg">
      <div className="absolute top-[-20px] left-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20px] right-[20%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />

      <div className="flex items-center gap-4 relative z-10">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
        >
          <img
            src="/logo.png"
            alt="Unstuck Logo"
            className="w-full h-full object-contain mix-blend-multiply brightness-125 contrast-125"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <span className="font-display font-bold text-2xl text-white tracking-tight">Unstuck</span>
      </div>

      <div className="flex items-center gap-8 relative z-10">
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/80">
          <button
            onClick={() => navigate('home')}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'home' ? 'text-white' : 'hover:text-white'} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            Home
            {currentScreen === 'home' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />}
          </button>
          <button
            onClick={() => {
              if (navigationLocked) return;
              onVisualMapClick?.();
            }}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'dashboard' ? 'text-white' : 'hover:text-white'} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            My Path
            {currentScreen === 'dashboard' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />}
          </button>
          <button
            onClick={() => navigate('start')}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'start' ? 'text-white' : 'hover:text-white'} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            Focus
            {currentScreen === 'start' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />}
          </button>
          <button
            onClick={() => navigate('progress')}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'progress' ? 'text-white' : 'hover:text-white'} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            Progress
            {currentScreen === 'progress' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />}
          </button>
          <button
            onClick={() => navigate('history')}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'history' ? 'text-white' : 'hover:text-white'} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            History
            {currentScreen === 'history' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border border-white/35 text-white text-xs font-black">
              <Coins className="w-3.5 h-3.5" /> {coins}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border border-white/35 text-white text-xs font-black">
              <Flame className="w-3.5 h-3.5" /> {streakDays}d
            </span>
          </div>

          <button
            onClick={() => {
              if (navigationLocked) return;
              onNewTask?.();
            }}
            disabled={navigationLocked}
            className="hidden md:inline-flex items-center gap-1.5 bg-white text-primary font-bold px-4 py-2 rounded-full shadow-sm hover:bg-white/95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            title="Create New Task"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>

          <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/30">
            <button
              onClick={() => navigate('home')}
              disabled={navigationLocked}
              className="p-1.5 text-white hover:bg-white/20 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('progress')}
              disabled={navigationLocked}
              className="p-1.5 text-white hover:bg-white/20 rounded-full transition-all relative disabled:opacity-60 disabled:cursor-not-allowed"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full border border-primary" />
            </button>
          </div>

          <div className="flex items-center gap-3 ml-1">
            <div className="text-right hidden sm:block min-w-[130px]">
              <div className="text-xs font-bold text-white leading-none">{username}</div>
              <div className="text-[10px] text-white/80 mt-0.5">Level {level}</div>
              <div className="mt-1.5 w-full h-1.5 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
            <button
              onClick={() => {
                if (navigationLocked) return;
                onProfileClick?.();
              }}
              disabled={navigationLocked}
              className="rounded-2xl p-0.5 bg-white border border-white/50 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              title="Open Profile Hub"
            >
              <AvatarPreview
                equippedBySlot={equippedBySlot}
                selectedBaseAvatarId={selectedBaseAvatarId}
                rpmAvatarUrl={selectedRpmAvatarUrl}
                size="sm"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
