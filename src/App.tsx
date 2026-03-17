import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HomeScreen } from './components/screens/HomeScreen';
import { QuestionsScreen } from './components/screens/QuestionsScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { StartModeScreen } from './components/screens/StartModeScreen';
import { ProgressScreen } from './components/screens/ProgressScreen';
import { PlanningScreen } from './components/screens/PlanningScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { VisualMapPicker } from './components/VisualMapPicker';
import { ProfileHub } from './components/profile/ProfileHub';
import { RewardToasts } from './components/RewardToasts';
import { requestTaskPlan } from './lib/taskPlanner';
import type { TaskPlan } from '../shared/taskPlan.ts';
import { getTodayKey, useGamification } from './state/gamification.tsx';
import { useTheme } from './state/theme.tsx';

const APP_STORAGE_KEY = 'unstuck.app.v1';
const TASK_HISTORY_STORAGE_KEY = 'unstuck.task-history.v1';
const DASHBOARD_DRAFT_STORAGE_KEY = 'unstuck.dashboard.v3.draft';
const MIN_ANALYSIS_DURATION_MS = 5500;
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
  const { state: gamificationState, recordEvent, syncSelectedTheme } = useGamification();
  const { themeId } = useTheme();
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
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isProfileHubOpen, setIsProfileHubOpen] = useState(false);
  const [pendingCompletions, setPendingCompletions] = useState(0);
  const isNavigationLocked = planningState.isRunning;
  const navigationLockRef = useRef(isNavigationLocked);
  const analysisRunRef = useRef(0);

  useEffect(() => {
    navigationLockRef.current = isNavigationLocked;
  }, [isNavigationLocked]);

  useEffect(() => {
    syncSelectedTheme(themeId);
  }, [syncSelectedTheme, themeId]);

  useEffect(() => {
    const today = getTodayKey();
    recordEvent('daily_return', {
      idempotencyKey: `daily_return:${today}`,
    });
  }, [recordEvent]);

  useEffect(() => {
    if (currentScreen !== 'progress') return;
    const today = getTodayKey();
    recordEvent('progress_reviewed', {
      idempotencyKey: `progress_reviewed:${today}`,
    });
  }, [currentScreen, recordEvent]);

  const navigateToScreen = useCallback(
    (screen: string, options?: { replace?: boolean; force?: boolean }) => {
      if (!isValidScreen(screen)) return;

      if (navigationLockRef.current && screen !== 'planning' && !options?.force) {
        setCurrentScreen('planning');
        applyHashScreen('planning', true);
        return;
      }

      setCurrentScreen(screen);
      applyHashScreen(screen, options?.replace);
    },
    []
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
    if (navigationLockRef.current) return;

    setTaskText('');
    setTaskError('');
    setAnswers({ ...defaultAnswers });
    setPlanningState({ ...defaultPlanningState });
    setPlannedTask(null);
    setCurrentHistoryId(null);
    setIsMapPickerOpen(false);
    setIsProfileHubOpen(false);
    setPendingCompletions(0);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DASHBOARD_DRAFT_STORAGE_KEY);
    }

    navigateToScreen('home', { force: true });
  }, [navigateToScreen]);

  const startAiAnalysis = useCallback(async () => {
    if (!taskText.trim()) {
      setTaskError('Write at least one sentence so we can help.');
      navigateToScreen('home');
      return;
    }

    const runId = analysisRunRef.current + 1;
    analysisRunRef.current = runId;
    const startedAt = Date.now();

    navigationLockRef.current = true;
    setPlannedTask(null);
    setPlanningState({
      isRunning: true,
      progress: 3,
      error: '',
    });
    navigateToScreen('planning', { force: true });

    const progressTimer =
      typeof window === 'undefined'
        ? null
        : window.setInterval(() => {
            setPlanningState((current) => {
              if (!current.isRunning || analysisRunRef.current !== runId) return current;
              const step =
                current.progress < 40
                  ? Math.floor(Math.random() * 3) + 1
                  : current.progress < 70
                    ? Math.floor(Math.random() * 2) + 1
                    : 1;
              const next = Math.min(88, current.progress + step);
              return { ...current, progress: next };
            });
          }, 620);

    try {
      const plan = await requestTaskPlan({
        taskText,
        answers,
      });
      if (analysisRunRef.current !== runId) return;

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_ANALYSIS_DURATION_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_ANALYSIS_DURATION_MS - elapsed));
      }
      if (analysisRunRef.current !== runId) return;

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
      setCurrentHistoryId(historyItem.id);
      setTaskHistory((previous) => [historyItem, ...previous].slice(0, 50));
      setIsMapPickerOpen(false);
      setIsProfileHubOpen(false);
      navigationLockRef.current = false;
      setTimeout(() => {
        if (analysisRunRef.current !== runId) return;
        navigateToScreen('dashboard', { force: true });
      }, 280);
    } catch (error) {
      if (analysisRunRef.current !== runId) return;

      const elapsed = Date.now() - startedAt;
      if (elapsed < 2200) {
        await new Promise((resolve) => setTimeout(resolve, 2200 - elapsed));
      }

      navigationLockRef.current = false;
      setPlanningState({
        isRunning: false,
        progress: 100,
        error: error instanceof Error ? error.message : 'AI analysis failed. Please try again.',
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

      if (navigationLockRef.current && hashScreen !== 'planning') {
        setCurrentScreen('planning');
        applyHashScreen('planning', true);
        return;
      }

      setCurrentScreen((previous) => (previous === hashScreen ? previous : hashScreen));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (currentScreen !== 'planning') return;
    if (planningState.isRunning) return;
    if (planningState.error) return;
    if (!plannedTask) return;

    const timer = window.setTimeout(() => {
      navigateToScreen('dashboard', { force: true });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [currentScreen, navigateToScreen, plannedTask, planningState.error, planningState.isRunning]);

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
      setCurrentHistoryId(selected.id);
      setIsMapPickerOpen(false);
      setIsProfileHubOpen(false);
      navigateToScreen('dashboard', { force: true });
    },
    [navigateToScreen, taskHistory]
  );

  const openVisualMapPicker = useCallback(() => {
    if (navigationLockRef.current) return;

    if (!taskHistory.length) {
      if (plannedTask) {
        navigateToScreen('dashboard', { force: true });
      } else {
        navigateToScreen('home', { force: true });
      }
      return;
    }

    setIsMapPickerOpen(true);
  }, [navigateToScreen, plannedTask, taskHistory.length]);

  const deleteTaskFromHistory = useCallback((historyId: string) => {
    if (typeof window !== 'undefined') {
      const accepted = window.confirm('Do you want to delete this task from history?');
      if (!accepted) return;
    }

    setTaskHistory((previous) => previous.filter((item) => item.id !== historyId));
    setCurrentHistoryId((previous) => (previous === historyId ? null : previous));
  }, []);

  const clearHistory = useCallback(() => {
    if (!taskHistory.length) return;

    if (typeof window !== 'undefined') {
      const accepted = window.confirm('Do you want to clear the entire history?');
      if (!accepted) return;
    }

    setTaskHistory([]);
    setCurrentHistoryId(null);
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
      case 'dashboard': {
        const activeTaskId = currentHistoryId ?? 'draft';
        return (
          <DashboardScreen
            activeTaskId={activeTaskId}
            taskText={taskText}
            answers={answers}
            plannedTask={plannedTask}
            planningError={planningState.error}
            onNewTask={createNewTask}
            pendingCompletions={pendingCompletions}
            onConsumeCompletion={() => {
              setPendingCompletions((current) => Math.max(0, current - 1));
            }}
            onStepCompleted={(stepId) => {
              recordEvent('step_completed', {
                idempotencyKey: `${activeTaskId}:step:${stepId}`,
              });
            }}
            onTaskPathCompleted={() => {
              recordEvent('task_path_completed', {
                idempotencyKey: `${activeTaskId}:completed`,
              });
            }}
            onStart={() => navigateToScreen('start')}
          />
        );
      }
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
        return (
          <StartModeScreen
            onBack={() => navigateToScreen('dashboard')}
            onComplete={({ minutesSpent }) => {
              recordEvent('focus_session_completed', {
                minutes: Math.max(1, minutesSpent),
              });
              setPendingCompletions((current) => current + 1);
              navigateToScreen('dashboard');
            }}
          />
        );
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
        onVisualMapClick={openVisualMapPicker}
        onProfileClick={() => setIsProfileHubOpen(true)}
        coins={gamificationState.coins}
        level={gamificationState.level}
        xpIntoLevel={gamificationState.xpIntoLevel}
        xpToNextLevel={gamificationState.xpToNextLevel}
        streakDays={gamificationState.streakDays}
        username={gamificationState.username}
        selectedBaseAvatarId={gamificationState.selectedBaseAvatarId}
        selectedRpmAvatarUrl={gamificationState.selectedRpmAvatarUrl}
        equippedBySlot={gamificationState.equippedBySlot}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentScreen={currentScreen}
          setScreen={navigateToScreen}
          navigationLocked={isNavigationLocked}
          onNewTask={createNewTask}
          onVisualMapClick={openVisualMapPicker}
        />
        <main className="flex-1 overflow-y-auto">{renderScreen()}</main>
      </div>
      <VisualMapPicker
        isOpen={isMapPickerOpen}
        items={taskHistory}
        currentId={currentHistoryId}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectMap={openTaskFromHistory}
        onOpenHistory={() => {
          setIsMapPickerOpen(false);
          navigateToScreen('history', { force: true });
        }}
        onCreateNew={createNewTask}
      />
      <ProfileHub
        isOpen={isProfileHubOpen}
        onClose={() => setIsProfileHubOpen(false)}
      />
      <RewardToasts />
    </div>
  );
}
