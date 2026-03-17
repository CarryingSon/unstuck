import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function PlanningScreen({
  progress,
  taskText,
  isRunning,
  error,
  onRetry,
}: {
  progress: number;
  taskText: string;
  isRunning: boolean;
  error: string;
  onRetry: () => void;
}) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="max-w-3xl mx-auto py-24 px-8">
      <div className="bg-white rounded-[3rem] border border-primary/10 soft-shadow p-10 md:p-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/15 text-accent rounded-full text-xs font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-4 h-4" />
          AI analiza
        </div>

        <h2 className="text-4xl font-display font-bold text-ink mb-3">
          {isRunning ? 'Pripravljam razclenitev naloge...' : error ? 'Analiza ni uspela' : 'Analiza je koncana'}
        </h2>
        <p className="text-ink/60 font-medium mb-10">
          {taskText
            ? `Naloga: ${taskText.slice(0, 110)}${taskText.length > 110 ? '...' : ''}`
            : 'Pripravljam plan za tvojo nalogo.'}
        </p>

        <div className="w-full h-4 bg-primary/10 rounded-full overflow-hidden p-1 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${safeProgress}%` }}
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          />
        </div>

        <div className="flex items-center justify-between text-sm font-bold text-ink/50 mb-8">
          <span>{isRunning ? 'AI pripravlja korake in casovne ocene' : 'Zakljucek analize'}</span>
          <span>{safeProgress}%</span>
        </div>

        {isRunning ? (
          <div className="inline-flex items-center gap-2 text-primary font-semibold">
            <Loader2 className="w-4 h-4 animate-spin" />
            To lahko traja nekaj sekund.
          </div>
        ) : error ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 text-accent bg-accent/10 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <button
              onClick={onRetry}
              className="px-6 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
            >
              Poskusi znova
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
