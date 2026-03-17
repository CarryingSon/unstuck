import { CalendarClock, Clock3, Layers3, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatMinutes, type TaskPlan } from '../../shared/taskPlan.ts';

type QuestionsAnswers = {
  deadline: string;
  time?: string;
  materials: string;
};

type TaskHistoryItem = {
  id: string;
  createdAt: string;
  taskText: string;
  answers: QuestionsAnswers;
  plan: TaskPlan;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function VisualMapPicker({
  isOpen,
  items,
  currentId,
  onClose,
  onSelectMap,
  onOpenHistory,
  onCreateNew,
}: {
  isOpen: boolean;
  items: TaskHistoryItem[];
  currentId: string | null;
  onClose: () => void;
  onSelectMap: (historyId: string) => void;
  onOpenHistory: () => void;
  onCreateNew: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80]">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
            aria-label="Close visual map picker"
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="absolute left-1/2 top-1/2 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-[2.2rem] border border-primary/15 bg-white shadow-2xl"
          >
            <div className="px-8 pt-8 pb-5 border-b border-primary/10 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                  <Layers3 className="w-4 h-4" />
                  Visual maps
                </div>
                <h3 className="text-3xl font-display font-bold text-ink">
                  Choose a visual map
                </h3>
                <p className="text-ink/55 text-sm font-medium mt-1">
                  Here are all your saved maps.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl inline-flex items-center justify-center text-ink/50 hover:bg-primary/10 hover:text-primary transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectMap(item.id)}
                  className={`w-full text-left rounded-2xl border px-5 py-4 transition-all ${
                    currentId === item.id
                      ? 'border-primary bg-primary/10'
                      : 'border-primary/10 bg-white hover:bg-primary/5 hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {formatDateTime(item.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/60 bg-bg px-2.5 py-1 rounded-full">
                      <Clock3 className="w-3.5 h-3.5 text-primary" />
                      {formatMinutes(item.plan.totalMinutes)}
                    </span>
                  </div>
                  <p className="font-bold text-ink leading-tight">
                    {item.taskText.slice(0, 92)}
                    {item.taskText.length > 92 ? '...' : ''}
                  </p>
                </button>
              ))}
            </div>

            <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onCreateNew}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Task
              </button>
              <button
                onClick={onOpenHistory}
                className="flex-1 py-3 rounded-2xl bg-bg text-ink/70 font-bold hover:bg-primary/5 hover:text-primary transition-colors border border-primary/10"
              >
                Open full history
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
