import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HomeScreen } from './components/screens/HomeScreen';
import { QuestionsScreen } from './components/screens/QuestionsScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { StartModeScreen } from './components/screens/StartModeScreen';
import { ProgressScreen } from './components/screens/ProgressScreen';
import { PlanningScreen } from './components/screens/PlanningScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { requestTaskPlan } from './lib/taskPlanner';
import type { TaskPlan } from '../shared/taskPlan.ts';

const APP_STORAGE_KEY = 'unstuck.app.v1';
const TASK_HISTORY_STORAGE_KEY = 'unstuck.task-history.v1';
const DASHBOARD_STORAGE_KEY = 'unstuck.dashboard.v2';
const SCREENS = ['home', 'questions', 'planning', 'dashboard', 'history', 'start', 'progress'] as const;
type ScreenId = (typeof SCREENS)[number];

type QuestionsAnswers = {
  deadline: string;
  time?: string;
  materials: string;
};

type PersistedAppState = {
  currentScreen: ScreenId;
  taskText: string;
  taskError: string;
  answers: QuestionsAnswers;
};

type PlanningState = {
  isRunning: boolean;
  progress: number;
  error: string;
};

type TaskHistoryItem = {
  id: string;
  createdAt: string;
  taskText: string;
  answers: QuestionsAnswers;
  plan: TaskPlan;
};

const defaultAnswers: QuestionsAnswers = {
  deadline: '',
  time: '',
  materials: '',
};

const defaultPlanningState: PlanningState = {
  isRunning: false,
  progress: 0,
  error: '',
};

const isTaskHistoryItem = (value: unknown): value is TaskHistoryItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.taskText === 'string' &&
    !!item.answers &&
    typeof item.answers === 'object' &&
    !!item.plan &&
    typeof item.plan === 'object'
  );
};

const isValidScreen = (value: string): value is ScreenId =>
  (SCREENS as readonly string[]).includes(value);

const getScreenFromHash = (): ScreenId | null => {
  if (typeof window === 'undefined') return null;
  const normalized = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return isValidScreen(normalized) ? normalized : null;
};

const readPersistedState = (): PersistedAppState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.currentScreen || !isValidScreen(parsed.currentScreen)) return null;
    if (typeof parsed.taskText !== 'string') return null;
    if (typeof parsed.taskError !== 'string') return null;
    if (!parsed.answers || typeof parsed.answers !== 'object') return null;

    return {
      currentScreen: parsed.currentScreen,
      taskText: parsed.taskText,
      taskError: parsed.taskError,
      answers: {
        deadline: String(parsed.answers.deadline ?? ''),
        time: String(parsed.answers.time ?? ''),
        materials: String(parsed.answers.materials ?? ''),
      },
    };
  } catch {
    return null;
  }
};

const readTaskHistory = (): TaskHistoryItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(TASK_HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is TaskHistoryItem => isTaskHistoryItem(item));
  } catch {
    return [];
  }
};

const applyHashScreen = (screen: ScreenId, replace = false) => {
  if (typeof window === 'undefined') return;
  const nextHash = `#/${screen}`;
  if (window.location.hash === nextHash) return;

  if (replace) {
    const nextUrl = new URL(window.location.href);
    nextUrl.hash = `/${screen}`;
    window.history.replaceState(null, '', nextUrl.toString());
    return;
  }

  window.location.hash = `/${screen}`;
};

export default function App() {
  const persisted = useMemo(() => readPersistedState(), []);
  const initialScreen = useMemo(() => {
    const fromState = getScreenFromHash() ?? persisted?.currentScreen ?? 'home';
    return fromState === 'planning' ? 'questions' : fromState;
  }, [persisted]);

  const [currentScreen, setCurrentScreen] = useState<ScreenId>(initialScreen);
  const [taskText, setTaskText] = useState(persisted?.taskText ?? '');
  const [taskError, setTaskError] = useState(persisted?.taskError ?? '');
  const [answers, setAnswers] = useState<QuestionsAnswers>(persisted?.answers ?? defaultAnswers);
  const [planningState, setPlanningState] = useState<PlanningState>(defaultPlanningState);
  const [plannedTask, setPlannedTask] = useState<TaskPlan | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>(() => readTaskHistory());
  const isNavigationLocked = planningState.isRunning;

  const navigateToScreen = useCallback(
    (screen: string, options?: { replace?: boolean; force?: boolean }) => {
      if (!isValidScreen(screen)) return;

      if (isNavigationLocked && screen !== 'planning' && !options?.force) {
        setCurrentScreen('planning');
        applyHashScreen('planning', true);
        return;
      }

      setCurrentScreen(screen);
      applyHashScreen(screen, options?.replace);
    },
    [isNavigationLocked]
  );

  const goToQuestions = () => {
    if (!taskText.trim()) {
      setTaskError('Write at least one sentence so we can help.');
      return;
    }
    setTaskError('');
    navigateToScreen('questions');
  };

  const createNewTask = useCallback(() => {
    if (isNavigationLocked) return;

    setTaskText('');
    setTaskError('');
    setAnswers({ ...defaultAnswers });
    setPlanningState({ ...defaultPlanningState });
    setPlannedTask(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    }

    navigateToScreen('home', { force: true });
  }, [isNavigationLocked, navigateToScreen]);

  const startAiAnalysis = useCallback(async () => {
    if (!taskText.trim()) {
      setTaskError('Write at least one sentence so we can help.');
      navigateToScreen('home');
      return;
    }

    setPlannedTask(null);
    setPlanningState({
      isRunning: true,
      progress: 8,
      error: '',
    });
    navigateToScreen('planning');

    const progressTimer =
      typeof window === 'undefined'
        ? null
        : window.setInterval(() => {
            setPlanningState((current) => {
              if (!current.isRunning) return current;
              const next = Math.min(92, current.progress + Math.floor(Math.random() * 7) + 2);
              return { ...current, progress: next };
            });
          }, 260);

    try {
      const plan = await requestTaskPlan({
        taskText,
        answers,
      });

      setPlannedTask(plan);
      setPlanningState({
        isRunning: false,
        progress: 100,
        error: '',
      });
      const historyItem: TaskHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        createdAt: new Date().toISOString(),
        taskText,
        answers: { ...answers },
        plan,
      };
      setTaskHistory((previous) => [historyItem, ...previous].slice(0, 50));
      navigateToScreen('dashboard', { force: true });
    } catch (error) {
      setPlanningState({
        isRunning: false,
        progress: 100,
        error: error instanceof Error ? error.message : 'AI analiza trenutno ni uspela.',
      });
    } finally {
      if (progressTimer !== null) {
        window.clearInterval(progressTimer);
      }
    }
  }, [answers, navigateToScreen, taskText]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const hashScreen = getScreenFromHash();
      if (!hashScreen) return;

      if (isNavigationLocked && hashScreen !== 'planning') {
        setCurrentScreen('planning');
        applyHashScreen('planning', true);
        return;
      }

      setCurrentScreen((previous) => (previous === hashScreen ? previous : hashScreen));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isNavigationLocked]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.hash) {
      applyHashScreen(currentScreen, true);
    }
  }, [currentScreen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: PersistedAppState = {
      currentScreen,
      taskText,
      taskError,
      answers,
    };
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(payload));
  }, [answers, currentScreen, taskError, taskText]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TASK_HISTORY_STORAGE_KEY, JSON.stringify(taskHistory));
  }, [taskHistory]);

  const openTaskFromHistory = useCallback(
    (historyId: string) => {
      const selected = taskHistory.find((item) => item.id === historyId);
      if (!selected) return;

      setTaskText(selected.taskText);
      setTaskError('');
      setAnswers({ ...selected.answers });
      setPlanningState({ ...defaultPlanningState });
      setPlannedTask(selected.plan);
      navigateToScreen('dashboard', { force: true });
    },
    [navigateToScreen, taskHistory]
  );

  const deleteTaskFromHistory = useCallback((historyId: string) => {
    if (typeof window !== 'undefined') {
      const accepted = window.confirm('Ali zelis izbrisati ta task iz history?');
      if (!accepted) return;
    }

    setTaskHistory((previous) => previous.filter((item) => item.id !== historyId));
  }, []);

  const clearHistory = useCallback(() => {
    if (!taskHistory.length) return;

    if (typeof window !== 'undefined') {
      const accepted = window.confirm('Ali zelis pobrisati celoten history?');
      if (!accepted) return;
    }

    setTaskHistory([]);
  }, [taskHistory.length]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            taskText={taskText}
            setTaskText={setTaskText}
            error={taskError}
            onNext={goToQuestions}
          />
        );
      case 'questions':
        return (
          <QuestionsScreen
            answers={answers}
            setAnswers={setAnswers}
            onNext={() => {
              void startAiAnalysis();
            }}
          />
        );
      case 'planning':
        return (
          <PlanningScreen
            progress={planningState.progress}
            taskText={taskText}
            isRunning={planningState.isRunning}
            error={planningState.error}
            onRetry={() => {
              void startAiAnalysis();
            }}
          />
        );
      case 'dashboard':
        return (
          <DashboardScreen
            taskText={taskText}
            answers={answers}
            plannedTask={plannedTask}
            planningError={planningState.error}
            onNewTask={createNewTask}
            onStart={() => navigateToScreen('start')}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            items={taskHistory}
            onOpenTask={openTaskFromHistory}
            onCreateNew={createNewTask}
            onDeleteTask={deleteTaskFromHistory}
            onClearHistory={clearHistory}
          />
        );
      case 'start':
        return <StartModeScreen onBack={() => navigateToScreen('dashboard')} onComplete={() => navigateToScreen('progress')} />;
      case 'progress':
        return <ProgressScreen onNext={() => navigateToScreen('dashboard')} />;
      default:
        return (
          <HomeScreen
            taskText={taskText}
            setTaskText={setTaskText}
            error={taskError}
            onNext={goToQuestions}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-bg font-sans">
      <TopBar
        currentScreen={currentScreen}
        setScreen={navigateToScreen}
        navigationLocked={isNavigationLocked}
        onNewTask={createNewTask}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentScreen={currentScreen}
          setScreen={navigateToScreen}
          navigationLocked={isNavigationLocked}
          onNewTask={createNewTask}
        />
        <main className="flex-1 overflow-y-auto">{renderScreen()}</main>
      </div>
    </div>
  );
}
