import { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function StartModeScreen({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (payload: { minutesSpent: number }) => void;
}) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [focusTask, setFocusTask] = useState('Create a simple outline');
  const [focusMessage, setFocusMessage] = useState(`"Just 3-5 main points. That's it! You've got this, Katja."`);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const makeStepSmaller = () => {
    setIsActive(false);
    setFocusTask('Write one bullet point');
    setFocusMessage('"Just one bullet point. Tiny win first, momentum second."');
    setTimeLeft((previous) => Math.min(previous, 5 * 60));
  };

  const handleStillStuck = () => {
    setIsActive(false);
    setFocusTask('Describe the task in one sentence');
    setFocusMessage('"Start with one sentence about what needs to be done. That is enough for now."');
    setTimeLeft(5 * 60);
  };
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((15 * 60 - timeLeft) / (15 * 60)) * 100;
  const handleComplete = () => {
    const elapsedSeconds = Math.max(60, 15 * 60 - timeLeft);
    const minutesSpent = Math.max(1, Math.round(elapsedSeconds / 60));
    onComplete({ minutesSpent });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 flex flex-col h-full relative">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-ink/40 hover:text-primary transition-all font-bold w-fit mb-12 group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-all" /> Back to My Path
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative">
        {/* Decorative Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-primary/15 text-accent text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-8"
        >
          Focus Mode Active
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-display font-bold text-ink mb-6"
        >
          {focusTask}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-ink/60 text-xl mb-16 max-w-xl leading-relaxed font-medium"
        >
          {focusMessage}
        </motion.p>

        {/* Timer Circle */}
        <div className="relative mb-16">
          <svg className="w-64 h-64 -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-primary/10"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 120}
              animate={{ strokeDashoffset: (2 * Math.PI * 120) * (1 - progress / 100) }}
              className="text-primary"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-6xl font-display font-bold text-ink tabular-nums tracking-tighter mb-1">
              {formatTime(timeLeft)}
            </div>
            <div className="text-primary font-black text-[10px] uppercase tracking-widest">Minutes Left</div>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-md gap-6">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTimer}
            className={`w-full py-6 rounded-[2rem] font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-lg ${
              isActive 
                ? 'bg-white text-ink border-2 border-primary/10 hover:bg-primary/5' 
                : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            {isActive ? (
              <><Pause className="w-6 h-6" /> Pause Focus</>
            ) : (
              <><Play className="w-6 h-6 fill-current" /> Start Focus</>
            )}
          </motion.button>

          <div className="flex gap-4 w-full">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              className="flex-1 py-4 bg-secondary text-white rounded-2xl font-bold hover:bg-primary transition-all shadow-lg shadow-secondary/40 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Done!
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={makeStepSmaller}
              className="flex-1 py-4 bg-white text-ink/60 border-2 border-primary/10 rounded-2xl font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" /> Smaller?
            </motion.button>
          </div>
          
          <button
            onClick={handleStillStuck}
            className="text-primary/40 font-bold hover:text-primary mt-6 transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4" />
            I still feel stuck
          </button>
        </div>
      </div>

      {/* Character Companion */}
      <motion.div 
        animate={{ scale: isActive ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-12 left-12 w-32 h-32 hidden xl:block"
      >
        <img 
          src="/logo.png" 
          alt="Companion" 
          className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply brightness-125 contrast-125"
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </div>
  );
}
