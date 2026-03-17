import { Home, Map, Focus, Activity, Settings, Sparkles, History, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
  navigationLocked?: boolean;
  onNewTask?: () => void;
  onVisualMapClick?: () => void;
}

export function Sidebar({
  currentScreen,
  setScreen,
  navigationLocked = false,
  onNewTask,
  onVisualMapClick,
}: SidebarProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'dashboard', icon: Map, label: 'Visual Map' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'start', icon: Focus, label: 'Focus Mode' },
    { id: 'progress', icon: Activity, label: 'Reflection' },
  ];

  return (
    <aside className="w-24 bg-white border-r border-primary/10 flex flex-col items-center py-8 shrink-0 z-10 shadow-sm relative">
      <div className="flex flex-col gap-6 w-full items-center flex-1">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (item.id === 'dashboard') {
                  onVisualMapClick?.();
                  return;
                }
                setScreen(item.id);
              }}
              disabled={navigationLocked}
              className={`relative p-4 rounded-[1.8rem] transition-all flex flex-col items-center gap-1 w-16 ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/15'
                  : 'text-ink/30 hover:bg-primary/5 hover:text-primary'
              } disabled:opacity-45 disabled:cursor-not-allowed`}
              title={item.label}
            >
              <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            </motion.button>
          );
        })}
        
        <div className="w-10 h-px bg-primary/10 my-2" />
        
        <button
          onClick={() => setScreen('home')}
          disabled={navigationLocked}
          className="p-4 rounded-2xl text-accent bg-primary/10 hover:bg-accent hover:text-white transition-all shadow-sm disabled:opacity-45 disabled:cursor-not-allowed"
          title="Quick Start"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onNewTask?.()}
          disabled={navigationLocked}
          className="p-4 rounded-2xl text-ink/40 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-45 disabled:cursor-not-allowed"
          title="New Task"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={() => setScreen('questions')}
          disabled={navigationLocked}
          className="p-4 rounded-2xl text-ink/30 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-45 disabled:cursor-not-allowed"
          title="Setup"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </aside>
  );
}
