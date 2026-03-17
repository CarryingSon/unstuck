import { Coins, Trophy, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useGamification } from '../state/gamification.tsx';

const toneClass = (tone?: string) => {
  if (tone === 'achievement') return 'border-amber-300/70 bg-amber-50 text-amber-900';
  if (tone === 'level') return 'border-emerald-300/70 bg-emerald-50 text-emerald-900';
  if (tone === 'warning') return 'border-rose-300/70 bg-rose-50 text-rose-900';
  return 'border-primary/20 bg-white text-ink';
};

export function RewardToasts() {
  const { toasts, dismissToast } = useGamification();

  return (
    <div className="fixed top-24 right-5 z-[140] w-[min(92vw,380px)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10, x: 30 }}
            className={`pointer-events-auto mb-3 rounded-2xl border px-4 py-3 shadow-xl ${toneClass(toast.tone)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-sm leading-tight">{toast.title}</p>
                {toast.subtitle && <p className="text-xs opacity-75 mt-1">{toast.subtitle}</p>}

                {(toast.xp || toast.coins) && (
                  <div className="mt-2 flex items-center gap-3 text-xs font-bold">
                    {toast.xp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                        <Zap className="w-3.5 h-3.5" /> +{toast.xp} XP
                      </span>
                    ) : null}
                    {toast.coins ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        <Coins className="w-3.5 h-3.5" /> +{toast.coins}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="w-7 h-7 rounded-xl text-ink/45 hover:text-ink hover:bg-black/5 transition-colors"
                title="Dismiss"
              >
                <Trophy className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
