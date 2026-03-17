import { CalendarClock, Clock3, Plus, Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatMinutes, type TaskPlan } from '../../../shared/taskPlan.ts';

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

const formatDeadline = (deadline: string, time?: string) => {
  if (!deadline) return 'No deadline set';

  const [year, month, day] = deadline.split('-').map(Number);
  if (!year || !month || !day) return deadline;

  const date = new Date(year, month - 1, day);
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return time ? `${dateLabel} ${time}` : dateLabel;
};

export function HistoryScreen({
  items,
  onOpenTask,
  onCreateNew,
  onDeleteTask,
  onClearHistory,
}: {
  items: TaskHistoryItem[];
  onOpenTask: (historyId: string) => void;
  onCreateNew: () => void;
  onDeleteTask: (historyId: string) => void;
  onClearHistory: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto py-14 px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/15 text-accent rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" />
            Task history
          </div>
          <h2 className="text-4xl font-display font-bold text-ink">Previous tasks</h2>
          <p className="text-ink/55 font-medium mt-2">
            All your saved AI breakdowns are stored here.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={onCreateNew}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New task
          </button>
          <button
            onClick={onClearHistory}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-accent/10 text-accent font-bold hover:bg-accent/15 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Clear history
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-primary/10 p-10 text-center soft-shadow">
          <h3 className="text-2xl font-display font-bold text-ink mb-3">History is currently empty</h3>
          <p className="text-ink/55 font-medium mb-8">
            When AI creates a plan, it will be saved here automatically.
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create your first task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.4) }}
              className="bg-white rounded-[2.2rem] border border-primary/10 p-7 soft-shadow flex flex-col"
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                  <CalendarClock className="w-4 h-4" />
                  {formatDateTime(item.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/55 bg-bg px-3 py-1 rounded-full">
                    <Clock3 className="w-3.5 h-3.5 text-primary" />
                    {formatMinutes(item.plan.totalMinutes)}
                  </div>
                  <button
                    onClick={() => onDeleteTask(item.id)}
                    className="w-8 h-8 rounded-xl inline-flex items-center justify-center text-accent hover:bg-accent/10 transition-colors"
                    title="Delete task from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-display font-bold text-ink leading-tight mb-3">
                {item.taskText.slice(0, 88)}
                {item.taskText.length > 88 ? '...' : ''}
              </h3>
              <p className="text-ink/55 text-sm leading-relaxed mb-5">{item.plan.summary}</p>

              <div className="flex items-center gap-2 text-xs font-semibold text-ink/55 mb-6">
                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full">{item.plan.steps.length} steps</span>
                <span className="w-1 h-1 rounded-full bg-ink/20" />
                <span>Due: {formatDeadline(item.answers.deadline, item.answers.time)}</span>
                <span className="w-1 h-1 rounded-full bg-ink/20" />
                <span>{item.answers.materials}</span>
              </div>

              <button
                onClick={() => onOpenTask(item.id)}
                className="mt-auto w-full py-3.5 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              >
                Open in canvas
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
