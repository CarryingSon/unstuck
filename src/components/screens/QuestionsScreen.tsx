import { useState } from 'react';
import { Calendar, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const formatDateForDisplay = (value: string) => {
  if (!value) return 'DD.MM.YYYY';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
};

export function QuestionsScreen({
  answers,
  setAnswers,
  onNext,
}: {
  answers: {
    deadline: string;
    time?: string;
    materials: string;
  };
  setAnswers: (values: {
    deadline: string;
    time?: string;
    materials: string;
  }) => void;
  onNext: () => void;
}) {
  const [step, setStep] = useState(0);

  const questions = [
    {
      id: 'materials',
      title: 'Ali ze imas vse gradivo?',
      subtitle: 'Zapiske, datoteke, povezave, navodila...',
      options: ['Ja, vse imam', 'Imam del gradiva', 'Se nimam skoraj nic'],
    },
    {
      id: 'deadline',
      title: 'Do kdaj moras oddati nalogo?',
      subtitle: 'To bo osnova za realen casovni plan.',
      type: 'date',
    },
  ];

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onNext();
    }
  };

  const setAnswer = (key: keyof typeof answers, value: string) => {
    setAnswers({ ...answers, [key]: value });
  };

  const canContinue = step === 0 ? Boolean(answers.materials) : Boolean(answers.deadline);

  return (
    <div className="max-w-3xl mx-auto py-20 px-8">
      <div className="flex justify-center mb-12">
        <div className="flex gap-3">
          {questions.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-12 bg-primary' : 'w-2 bg-primary/20'}`} 
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-display font-bold text-ink mb-3">{questions[step].title}</h2>
          <p className="text-ink/50 font-medium">{questions[step].subtitle}</p>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${step}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {questions[step].options ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questions[step].options.map((opt) => {
                const key = questions[step].id as keyof typeof answers;
                const isSelected = answers[key] === opt;
                return (
                  <motion.button 
                    key={opt}
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setAnswer(key, opt);
                      handleNext();
                    }}
                    className={`p-8 rounded-[2.5rem] bg-white border-2 ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-primary/5 text-ink'} font-bold text-xl hover:border-primary hover:bg-primary/5 hover:text-primary transition-all text-left shadow-sm soft-shadow flex justify-between items-center group`}
                  >
                    {opt}
                    <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[3rem] border-2 border-primary/5 shadow-xl soft-shadow flex flex-col gap-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-ink/40 uppercase tracking-widest mb-3 ml-2">Datum oddaje</label>
                  <div className="relative bg-bg border-2 border-transparent rounded-2xl focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/20 transition-all">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-primary pointer-events-none" />
                    <div className="pl-14 pr-6 py-5 text-ink font-black text-2xl tracking-wide tabular-nums">
                      {formatDateForDisplay(answers.deadline)}
                    </div>
                    <input
                      type="date"
                      value={answers.deadline}
                      onChange={(e) => setAnswer('deadline', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="Datum oddaje"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-ink/40 uppercase tracking-widest mb-3 ml-2">Ura (opcijsko)</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                    <input 
                      type="time" 
                      value={answers.time || ''}
                      onChange={(e) => setAnswer('time', e.target.value)}
                      className="w-full bg-bg border-2 border-transparent rounded-2xl pl-14 pr-6 py-5 text-ink font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all text-lg"
                    />
                  </div>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={!canContinue}
                className="w-full py-6 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-6 h-6 fill-white/20" />
                Nadaljuj
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      <div className="mt-16 flex justify-center">
        <button 
          onClick={handleNext}
          className="text-ink/30 hover:text-primary font-bold transition-all flex items-center gap-2 group"
        >
          Preskoci za zdaj
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Character Support */}
      <motion.div 
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-12 right-12 w-32 h-32 hidden xl:block"
      >
        <div className="absolute -top-12 -left-20 bg-white p-4 rounded-2xl rounded-br-none shadow-lg border border-primary/10 text-sm font-bold text-ink max-w-[150px]">
          "Vzemi si cas, tukaj sem."
        </div>
        <img 
          src="/logo.png" 
          alt="Happy Companion" 
          className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply brightness-125 contrast-125"
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </div>
  );
}
