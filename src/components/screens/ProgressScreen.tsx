import React, { useState, useEffect, useRef } from 'react';
import { Star, Clock, Sparkles, X, ChevronRight, Map as MapIcon, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ProgressScreen({ onNext }: { onNext: () => void }) {
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const draggedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);

  const steps = [
    { id: 1, title: "Understand the task", time: "10 min", tip: "Read the requirements carefully.", status: "done", x: 200, y: 550 },
    { id: 2, title: "Define the first small action", time: "5 min", tip: "Write down the absolute smallest thing you can do right now.", status: "done", x: 450, y: 350 },
    { id: 3, title: "Start working", time: "10 min", tip: "Start with a rough draft. Do not aim for perfection.", status: "current", x: 700, y: 550 },
    { id: 4, title: "Continue momentum", time: "25 min", tip: "Keep going! You're in the flow state now.", status: "locked", x: 950, y: 350 },
    { id: 5, title: "Almost finished", time: "15 min", tip: "Review your work and make final tweaks.", status: "locked", x: 1200, y: 550 },
    { id: 6, title: "Task completed", time: "0 min", tip: "You did it! Take a well-deserved break.", status: "locked", x: 1450, y: 350 },
  ];

  // Auto-scroll to current step on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 700 - window.innerWidth / 2 + 100;
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    activePointerIdRef.current = e.pointerId;
    scrollRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    draggedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== null && scrollRef.current?.hasPointerCapture(activePointerIdRef.current)) {
      scrollRef.current.releasePointerCapture(activePointerIdRef.current);
    }
    activePointerIdRef.current = null;
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const walk = (e.clientX - dragStartXRef.current) * 1.5;
    
    if (Math.abs(walk) > 5) {
      draggedRef.current = true;
    }
    
    scrollRef.current.scrollLeft = dragStartScrollLeftRef.current - walk;
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-bg relative overflow-hidden">
      
      {/* Header Area */}
      <div className="px-8 py-6 bg-surface border-b border-primary/10 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-primary" />
            Your Journey
          </h1>
          <p className="text-ink/40 text-sm font-medium">Follow the path to complete your presentation.</p>
        </div>
        <button 
          onClick={onNext}
          className="px-6 py-2.5 bg-surface border-2 border-primary/10 text-ink/60 font-bold rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all flex items-center gap-2"
        >
          Back to Dashboard <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Map Area */}
      <div 
        ref={scrollRef} 
        className={`flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar relative bg-primary/5 touch-pan-x ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="w-[1800px] h-full min-h-[700px] relative pointer-events-none">
          
          {/* --- MAP ENVIRONMENT DECORATIONS --- */}
          {/* Soft Clouds/Hills */}
          <div className="absolute bottom-[-100px] left-[100px] w-[600px] h-[400px] bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-[-150px] left-[500px] w-[500px] h-[300px] bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-50px] right-[200px] w-[700px] h-[400px] bg-secondary/12 rounded-full blur-3xl"></div>
          
          {/* Floating Shapes */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-[150px] left-[250px] w-32 h-32 bg-primary/10 rounded-3xl rotate-12"
          ></motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute bottom-[100px] right-[400px] w-48 h-48 bg-secondary/10 rounded-full"
          ></motion.div>
          
          {/* --- THE PATH --- */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1800 800" preserveAspectRatio="none">
            <path 
              d="M 50,550 L 200,550 C 325,550 325,350 450,350 C 575,350 575,550 700,550 C 825,550 825,350 950,350 C 1075,350 1075,550 1200,550 C 1325,550 1325,350 1450,350 L 1600,350" 
              fill="none" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" 
              className="text-primary/10"
            />
            <path 
              d="M 50,550 L 200,550 C 325,550 325,350 450,350 C 575,350 575,550 700,550 C 825,550 825,350 950,350 C 1075,350 1075,550 1200,550 C 1325,550 1325,350 1450,350 L 1600,350" 
              fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20 30"
              className="text-primary/30"
            />
          </svg>

          {/* --- CHECKPOINTS (NODES) --- */}
          {steps.map((step) => {
            const isDone = step.status === 'done';
            const isCurrent = step.status === 'current';
            return (
              <div 
                key={step.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group pointer-events-auto"
                style={{ left: step.x, top: step.y }}
              >
                {/* Current Step Indicator */}
                {isCurrent && (
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-20 bg-surface p-3 rounded-2xl shadow-xl border-2 border-primary/20 flex flex-col items-center"
                  >
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">You are here</div>
                    <Star className="w-6 h-6 text-primary fill-primary" />
                    <div className="absolute -bottom-2 w-4 h-4 bg-surface border-r-2 border-b-2 border-primary/20 rotate-45"></div>
                  </motion.div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    if (draggedRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    setSelectedStep(step);
                  }}
                    className={`relative w-24 h-24 rounded-[2.5rem] flex items-center justify-center font-display font-bold text-3xl transition-all shadow-lg ${
                    isDone 
                      ? 'bg-secondary text-white shadow-secondary/40' 
                      : isCurrent 
                        ? 'bg-primary text-white shadow-primary/30 ring-8 ring-primary/20' 
                        : 'bg-white text-ink/20 border-2 border-primary/10 shadow-sm'
                  }`}
                >
                  {isDone ? <Trophy className="w-10 h-10" /> : step.id}
                </motion.button>
                
                <div className={`mt-6 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-sm border-2 whitespace-nowrap transition-all ${
                  isCurrent ? 'bg-white text-ink border-primary/20 scale-110 shadow-lg' : 
                  isDone ? 'bg-white/80 text-ink/60 border-primary/5' : 
                  'bg-white/40 text-ink/30 border-transparent'
                }`}>
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {selectedStep && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto"
              onClick={() => setSelectedStep(null)}
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-md rounded-[3rem] p-10 shadow-2xl pointer-events-auto relative overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              
              <div className="flex justify-between items-start mb-8 relative">
                <div>
                  <div className="text-xs font-black text-primary uppercase tracking-widest mb-2">Step {selectedStep.id}</div>
                  <h3 className="font-display font-bold text-4xl text-ink leading-tight">{selectedStep.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedStep(null)}
                  className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center text-ink/20 hover:text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-primary font-bold mb-10 bg-primary/5 w-fit px-5 py-2.5 rounded-2xl text-lg">
                <Clock className="w-5 h-5" /> {selectedStep.time}
              </div>
              
              <div className="bg-secondary/10 rounded-[2rem] p-8 border-2 border-secondary/20 mb-10 relative group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-surface rounded-xl shadow-sm">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-bold text-primary text-xl">AI Companion Tip</span>
                </div>
                <p className="text-ink/70 font-medium text-lg leading-relaxed italic">"{selectedStep.tip}"</p>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (selectedStep.status === 'locked') return;
                  setSelectedStep(null);
                  onNext();
                }}
                className={`w-full py-6 font-bold text-xl rounded-[2rem] transition-all shadow-lg ${
                  selectedStep.status === 'locked'
                    ? 'bg-bg text-ink/20 cursor-not-allowed'
                    : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'
                }`}
              >
                {selectedStep.status === 'done' ? 'Review Step' : selectedStep.status === 'locked' ? 'Locked' : 'Start Step'}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
