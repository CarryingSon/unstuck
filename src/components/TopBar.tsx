import { Bell, Search, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export function TopBar({
  currentScreen,
  setScreen,
  navigationLocked = false,
  onNewTask,
}: {
  currentScreen?: string;
  setScreen?: (screen: string) => void;
  navigationLocked?: boolean;
  onNewTask?: () => void;
}) {
  const navigate = (screen: string) => {
    if (navigationLocked) return;
    setScreen?.(screen);
  };

  return (
    <header className="h-20 bg-gradient-to-r from-accent via-primary to-secondary flex items-center justify-between px-8 shrink-0 z-20 relative overflow-hidden shadow-lg">
      {/* Floating background shapes */}
      <div className="absolute top-[-20px] left-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20px] right-[20%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      
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
            className={`relative py-2 transition-all ${currentScreen === 'home' ? "text-white" : "hover:text-white"} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            Home
            {currentScreen === 'home' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />
            )}
          </button>
          <button 
            onClick={() => navigate('dashboard')}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'dashboard' ? "text-white" : "hover:text-white"} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            My Path
            {currentScreen === 'dashboard' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />
            )}
          </button>
          <button 
            onClick={() => navigate('start')}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'start' ? "text-white" : "hover:text-white"} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            Focus
            {currentScreen === 'start' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />
            )}
          </button>
          <button 
            onClick={() => navigate('progress')}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'progress' ? "text-white" : "hover:text-white"} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            Progress
            {currentScreen === 'progress' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />
            )}
          </button>
          <button
            onClick={() => navigate('history')}
            disabled={navigationLocked}
            className={`relative py-2 transition-all ${currentScreen === 'history' ? "text-white" : "hover:text-white"} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            History
            {currentScreen === 'history' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />
            )}
          </button>
        </nav>
        
        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/30">
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
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full border border-primary"></span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 ml-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white leading-none">Katja P.</div>
              <div className="text-[10px] text-white/70">Level 12</div>
            </div>
            <button
              onClick={() => navigate('dashboard')}
              disabled={navigationLocked}
              className="w-10 h-10 rounded-2xl bg-white p-0.5 shadow-md overflow-hidden border-2 border-white/50 disabled:opacity-60 disabled:cursor-not-allowed"
              title="My Profile"
            >
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Katja" 
                alt="User Avatar" 
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
