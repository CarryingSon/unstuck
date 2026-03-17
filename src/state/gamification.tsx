import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AVATAR_CATALOG,
  AVATAR_SLOT_ORDER,
  AVATAR_ITEMS_BY_ID,
  BASE_AVATARS,
  BASE_AVATARS_BY_ID,
  DEFAULT_BASE_AVATAR_ID,
  DEFAULT_EQUIPPED_BY_SLOT,
  DEFAULT_OWNED_ITEM_IDS,
  type AvatarItem,
  type BaseAvatarDefinition,
  type BaseAvatarId,
  type AvatarSlot,
} from '../data/avatarCatalog.ts';
import { ACHIEVEMENTS, type AchievementDefinition, type AchievementId } from '../data/achievements.ts';
import { type ThemePresetId } from '../data/themes.ts';

const GAMIFICATION_STORAGE_KEY = 'unstuck.gamification.v1';

const EVENT_REWARDS = {
  step_completed: { xp: 20, coins: 15, title: 'Step completed' },
  focus_session_completed: { xp: 15, coins: 5, title: 'Focus session completed' },
  task_path_completed: { xp: 80, coins: 50, title: 'Task path completed' },
  progress_reviewed: { xp: 5, coins: 3, title: 'Progress reviewed' },
  daily_return: { xp: 10, coins: 8, title: 'Welcome back' },
} as const;

export type GamificationEventType =
  | 'step_completed'
  | 'focus_session_completed'
  | 'task_path_completed'
  | 'progress_reviewed'
  | 'daily_return'
  | 'avatar_customized'
  | 'shop_item_purchased';

export type RewardGrant = {
  xp: number;
  coins: number;
  title: string;
};

export type RewardToast = {
  id: string;
  title: string;
  subtitle?: string;
  xp?: number;
  coins?: number;
  tone?: 'reward' | 'achievement' | 'level' | 'warning';
};

export type GamificationState = {
  username: string;
  xpTotal: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  coins: number;
  streakDays: number;
  lastMeaningfulTaskDate: string | null;
  tasksCompleted: number;
  stepsCompleted: number;
  focusSessionsCompleted: number;
  focusMinutesTotal: number;
  rewardsEarnedTotal: number;
  selectedBaseAvatarId: BaseAvatarId;
  ownedItemIds: string[];
  equippedBySlot: Record<AvatarSlot, string>;
  unlockedAchievementIds: AchievementId[];
  achievementProgress: Record<AchievementId, number>;
  dailyActions: Record<string, string[]>;
  processedEventKeys: string[];
  avatarCustomizations: number;
  shopPurchases: number;
  selectedThemeId: ThemePresetId;
  rpmAvatarLibrary: string[];
  selectedRpmAvatarUrl: string | null;
};

type EventPayload = {
  idempotencyKey?: string;
  minutes?: number;
};

type GamificationContextValue = {
  state: GamificationState;
  avatarCatalog: AvatarItem[];
  baseAvatars: BaseAvatarDefinition[];
  achievements: AchievementDefinition[];
  toasts: RewardToast[];
  recordEvent: (eventType: GamificationEventType, payload?: EventPayload) => void;
  buyItem: (itemId: string) => { ok: boolean; reason?: string };
  equipItem: (itemId: string) => { ok: boolean; reason?: string };
  selectBaseAvatar: (baseAvatarId: BaseAvatarId) => { ok: boolean; reason?: string };
  saveRpmAvatar: (avatarUrl: string) => { ok: boolean; reason?: string };
  selectRpmAvatar: (avatarUrl: string) => { ok: boolean; reason?: string };
  removeRpmAvatar: (avatarUrl: string) => { ok: boolean; reason?: string };
  dismissToast: (toastId: string) => void;
  syncSelectedTheme: (themeId: ThemePresetId) => void;
};

const GamificationContext = createContext<GamificationContextValue | null>(null);

const XP_LEVEL_BASE = 100;
const XP_LEVEL_GROWTH = 40;
const MAX_RPM_AVATARS = 4;

const xpRequired = (level: number) => XP_LEVEL_BASE + (level - 1) * XP_LEVEL_GROWTH;

const getTodayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isYesterday = (dateKey: string, comparedWith: string) => {
  const [leftYear, leftMonth, leftDay] = dateKey.split('-').map(Number);
  const [rightYear, rightMonth, rightDay] = comparedWith.split('-').map(Number);
  if (!leftYear || !leftMonth || !leftDay || !rightYear || !rightMonth || !rightDay) {
    return false;
  }

  const left = new Date(leftYear, leftMonth - 1, leftDay);
  const right = new Date(rightYear, rightMonth - 1, rightDay);
  const diffMs = right.getTime() - left.getTime();
  return diffMs === 24 * 60 * 60 * 1000;
};

const deriveLevelState = (xpTotal: number) => {
  let remainingXp = Math.max(0, Math.round(xpTotal));
  let level = 1;

  while (remainingXp >= xpRequired(level)) {
    remainingXp -= xpRequired(level);
    level += 1;
  }

  return {
    level,
    xpIntoLevel: remainingXp,
    xpToNextLevel: xpRequired(level),
  };
};

const withDerivedLevel = (state: GamificationState): GamificationState => {
  const derived = deriveLevelState(state.xpTotal);
  return {
    ...state,
    ...derived,
  };
};

const toAchievementProgress = (state: GamificationState) => {
  const progress = {} as Record<AchievementId, number>;
  for (const achievement of ACHIEVEMENTS) {
    const metric = getAchievementMetric(state, achievement.id);
    progress[achievement.id] = Math.min(achievement.target, metric);
  }
  return progress;
};

const getAchievementMetric = (state: GamificationState, achievementId: AchievementId) => {
  switch (achievementId) {
    case 'first_task_completed':
      return state.tasksCompleted;
    case 'streak_3_days':
      return state.streakDays;
    case 'streak_7_days':
      return state.streakDays;
    case 'tasks_10_completed':
      return state.tasksCompleted;
    case 'focus_50_minutes':
      return state.focusMinutesTotal;
    case 'full_ai_path':
      return state.tasksCompleted;
    case 'customized_avatar_first_time':
      return state.avatarCustomizations;
    case 'first_shop_purchase':
      return state.shopPurchases;
    default:
      return 0;
  }
};

const evaluateAchievements = (state: GamificationState) => {
  const unlocked = new Set(state.unlockedAchievementIds);
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const achievement of ACHIEVEMENTS) {
    const metric = getAchievementMetric(state, achievement.id);
    if (metric >= achievement.target && !unlocked.has(achievement.id)) {
      unlocked.add(achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  return {
    unlockedAchievementIds: Array.from(unlocked) as AchievementId[],
    achievementProgress: toAchievementProgress(state),
    newlyUnlocked,
  };
};

const trimEventKeys = (keys: string[]) => keys.slice(-1500);

const trimDailyActions = (dailyActions: Record<string, string[]>) => {
  const entries = Object.entries(dailyActions)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-45);

  return Object.fromEntries(entries);
};

const isBaseAvatarId = (value: string): value is BaseAvatarId =>
  BASE_AVATARS.some((avatar) => avatar.id === value);

const sanitizeOwnedItems = (rawOwned: unknown) => {
  if (!Array.isArray(rawOwned)) return [...DEFAULT_OWNED_ITEM_IDS];

  const valid = rawOwned.filter(
    (itemId): itemId is string => typeof itemId === 'string' && !!AVATAR_ITEMS_BY_ID[itemId],
  );
  if (!valid.length) return [...DEFAULT_OWNED_ITEM_IDS];

  return Array.from(new Set([...DEFAULT_OWNED_ITEM_IDS, ...valid]));
};

const sanitizeEquippedBySlot = (
  rawEquipped: unknown,
  selectedBaseAvatarId: BaseAvatarId,
  ownedItemIds: string[],
) => {
  const base = BASE_AVATARS_BY_ID[selectedBaseAvatarId];
  const fallback: Record<AvatarSlot, string> = {
    ...DEFAULT_EQUIPPED_BY_SLOT,
    ...(base.starterLoadout as Partial<Record<AvatarSlot, string>>),
  };

  const parsed =
    rawEquipped && typeof rawEquipped === 'object'
      ? (rawEquipped as Partial<Record<AvatarSlot, string>>)
      : {};

  const next = { ...fallback };

  for (const slot of AVATAR_SLOT_ORDER) {
    const candidateId = parsed[slot];
    if (!candidateId || typeof candidateId !== 'string') continue;

    const item = AVATAR_ITEMS_BY_ID[candidateId];
    if (!item || item.slot !== slot) continue;
    if (!ownedItemIds.includes(candidateId)) continue;

    next[slot] = candidateId;
  }

  return next;
};

const normalizeRpmAvatarUrl = (avatarUrl: string) => {
  const trimmed = avatarUrl.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('models.readyplayer.me')) return '';

  const withoutQuery = trimmed.split('?')[0];
  return withoutQuery.endsWith('.glb') ? withoutQuery : `${withoutQuery}.glb`;
};

const sanitizeRpmAvatarLibrary = (rawLibrary: unknown) => {
  if (!Array.isArray(rawLibrary)) return [];

  return Array.from(
    new Set(
      rawLibrary
        .filter((url): url is string => typeof url === 'string')
        .map((url) => normalizeRpmAvatarUrl(url))
        .filter(Boolean),
    ),
  ).slice(0, MAX_RPM_AVATARS);
};

const initialState = (): GamificationState => {
  const base: GamificationState = {
    username: 'Katja P.',
    xpTotal: 0,
    level: 1,
    xpIntoLevel: 0,
    xpToNextLevel: xpRequired(1),
    coins: 180,
    streakDays: 0,
    lastMeaningfulTaskDate: null,
    tasksCompleted: 0,
    stepsCompleted: 0,
    focusSessionsCompleted: 0,
    focusMinutesTotal: 0,
    rewardsEarnedTotal: 0,
    selectedBaseAvatarId: DEFAULT_BASE_AVATAR_ID,
    ownedItemIds: [...DEFAULT_OWNED_ITEM_IDS],
    equippedBySlot: { ...DEFAULT_EQUIPPED_BY_SLOT },
    unlockedAchievementIds: [],
    achievementProgress: {} as Record<AchievementId, number>,
    dailyActions: {},
    processedEventKeys: [],
    avatarCustomizations: 0,
    shopPurchases: 0,
    selectedThemeId: 'default-purple',
    rpmAvatarLibrary: [],
    selectedRpmAvatarUrl: null,
  };

  const initialProgress = toAchievementProgress(base);
  return {
    ...base,
    achievementProgress: initialProgress,
  };
};

const readPersistedState = (): GamificationState => {
  if (typeof window === 'undefined') return initialState();

  try {
    const raw = window.localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) return initialState();

    const parsed = JSON.parse(raw) as Partial<GamificationState>;
    if (!parsed || typeof parsed !== 'object') return initialState();

    const seeded = initialState();
    const selectedBaseAvatarId =
      typeof parsed.selectedBaseAvatarId === 'string' && isBaseAvatarId(parsed.selectedBaseAvatarId)
        ? parsed.selectedBaseAvatarId
        : seeded.selectedBaseAvatarId;
    const ownedItemIds = sanitizeOwnedItems(parsed.ownedItemIds);
    const equippedBySlot = sanitizeEquippedBySlot(
      parsed.equippedBySlot,
      selectedBaseAvatarId,
      ownedItemIds,
    );
    const normalizedOwned = Array.from(new Set([...ownedItemIds, ...Object.values(equippedBySlot)]));
    const rpmAvatarLibrary = sanitizeRpmAvatarLibrary(parsed.rpmAvatarLibrary);
    const selectedRpmAvatarUrlRaw =
      typeof parsed.selectedRpmAvatarUrl === 'string'
        ? normalizeRpmAvatarUrl(parsed.selectedRpmAvatarUrl)
        : '';
    const selectedRpmAvatarUrl =
      selectedRpmAvatarUrlRaw && rpmAvatarLibrary.includes(selectedRpmAvatarUrlRaw)
        ? selectedRpmAvatarUrlRaw
        : rpmAvatarLibrary[0] ?? null;

    const merged: GamificationState = {
      ...seeded,
      ...parsed,
      selectedBaseAvatarId,
      ownedItemIds: normalizedOwned,
      equippedBySlot,
      unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds)
        ? (parsed.unlockedAchievementIds.filter((id): id is AchievementId =>
            ACHIEVEMENTS.some((achievement) => achievement.id === id),
          ) as AchievementId[])
        : seeded.unlockedAchievementIds,
      achievementProgress: {
        ...seeded.achievementProgress,
        ...(parsed.achievementProgress ?? {}),
      },
      dailyActions:
        parsed.dailyActions && typeof parsed.dailyActions === 'object'
          ? (parsed.dailyActions as Record<string, string[]>)
          : seeded.dailyActions,
      processedEventKeys: Array.isArray(parsed.processedEventKeys)
        ? parsed.processedEventKeys.filter((key) => typeof key === 'string')
        : seeded.processedEventKeys,
      rpmAvatarLibrary,
      selectedRpmAvatarUrl,
    };

    const normalized = withDerivedLevel(merged);
    const achievements = evaluateAchievements(normalized);

    return {
      ...normalized,
      unlockedAchievementIds: achievements.unlockedAchievementIds,
      achievementProgress: achievements.achievementProgress,
      dailyActions: trimDailyActions(normalized.dailyActions),
      processedEventKeys: trimEventKeys(normalized.processedEventKeys),
    };
  } catch {
    return initialState();
  }
};

const createToast = (toast: Omit<RewardToast, 'id'>): RewardToast => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  ...toast,
});

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>(() => readPersistedState());
  const [toasts, setToasts] = useState<RewardToast[]>([]);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const pushToasts = useCallback(
    (nextToasts: RewardToast[]) => {
      if (!nextToasts.length) return;

      setToasts((current) => [...nextToasts, ...current].slice(0, 6));

      for (const toast of nextToasts) {
        window.setTimeout(() => {
          dismissToast(toast.id);
        }, 3600);
      }
    },
    [dismissToast],
  );

  const recordEvent = useCallback(
    (eventType: GamificationEventType, payload: EventPayload = {}) => {
      const current = stateRef.current;
      let next = { ...current };
      const nextToasts: RewardToast[] = [];

      if (payload.idempotencyKey) {
        if (current.processedEventKeys.includes(payload.idempotencyKey)) {
          return;
        }
        next.processedEventKeys = trimEventKeys([...next.processedEventKeys, payload.idempotencyKey]);
      }

      const today = getTodayKey();
      const todayActions = new Set(next.dailyActions[today] ?? []);

      if (eventType === 'daily_return' || eventType === 'progress_reviewed') {
        if (todayActions.has(eventType)) {
          stateRef.current = next;
          setState(next);
          return;
        }
        todayActions.add(eventType);
        next.dailyActions = trimDailyActions({
          ...next.dailyActions,
          [today]: Array.from(todayActions),
        });
      }

      if (eventType === 'step_completed') {
        next.stepsCompleted += 1;
        if (next.lastMeaningfulTaskDate !== today) {
          if (next.lastMeaningfulTaskDate && isYesterday(next.lastMeaningfulTaskDate, today)) {
            next.streakDays += 1;
          } else {
            next.streakDays = 1;
          }
          next.lastMeaningfulTaskDate = today;
        }
      }

      if (eventType === 'task_path_completed') {
        next.tasksCompleted += 1;
      }

      if (eventType === 'focus_session_completed') {
        const minutes = Math.max(1, Math.round(payload.minutes ?? 1));
        next.focusSessionsCompleted += 1;
        next.focusMinutesTotal += minutes;
      }

      if (eventType === 'avatar_customized') {
        next.avatarCustomizations += 1;
      }

      if (eventType === 'shop_item_purchased') {
        next.shopPurchases += 1;
      }

      const reward = EVENT_REWARDS[eventType as keyof typeof EVENT_REWARDS] as RewardGrant | undefined;
      if (reward) {
        const previousLevel = next.level;
        next.xpTotal += reward.xp;
        next.coins += reward.coins;
        next.rewardsEarnedTotal += reward.coins;
        next = withDerivedLevel(next);

        nextToasts.push(
          createToast({
            title: reward.title,
            subtitle: `+${reward.xp} XP · +${reward.coins} coins`,
            xp: reward.xp,
            coins: reward.coins,
            tone: 'reward',
          }),
        );

        if (next.level > previousLevel) {
          nextToasts.push(
            createToast({
              title: `Level up! Level ${next.level}`,
              subtitle: 'Great momentum. Keep going.',
              tone: 'level',
            }),
          );
        }
      }

      const achievementEvaluation = evaluateAchievements(next);
      next.unlockedAchievementIds = achievementEvaluation.unlockedAchievementIds;
      next.achievementProgress = achievementEvaluation.achievementProgress;

      for (const unlocked of achievementEvaluation.newlyUnlocked) {
        nextToasts.push(
          createToast({
            title: `Achievement unlocked: ${unlocked.title}`,
            subtitle: unlocked.description,
            tone: 'achievement',
          }),
        );
      }

      stateRef.current = next;
      setState(next);
      pushToasts(nextToasts);
    },
    [pushToasts],
  );

  const buyItem = useCallback(
    (itemId: string) => {
      const current = stateRef.current;
      const item = AVATAR_ITEMS_BY_ID[itemId];

      if (!item) {
        pushToasts([
          createToast({
            title: 'Item not found',
            subtitle: 'This shop item is unavailable right now.',
            tone: 'warning',
          }),
        ]);
        return { ok: false, reason: 'Item not found' };
      }

      if (current.ownedItemIds.includes(itemId)) {
        return { ok: true };
      }

      if (current.coins < item.cost) {
        pushToasts([
          createToast({
            title: 'Not enough coins',
            subtitle: `${item.cost - current.coins} more coins needed.`,
            tone: 'warning',
          }),
        ]);
        return { ok: false, reason: 'Not enough coins' };
      }

      let next: GamificationState = {
        ...current,
        coins: current.coins - item.cost,
        ownedItemIds: Array.from(new Set([...current.ownedItemIds, itemId])),
        shopPurchases: current.shopPurchases + 1,
      };

      const evaluation = evaluateAchievements(next);
      next.unlockedAchievementIds = evaluation.unlockedAchievementIds;
      next.achievementProgress = evaluation.achievementProgress;

      const nextToasts: RewardToast[] = [
        createToast({
          title: `${item.name} purchased`,
          subtitle: `-${item.cost} coins`,
          tone: 'reward',
        }),
      ];

      for (const unlocked of evaluation.newlyUnlocked) {
        nextToasts.push(
          createToast({
            title: `Achievement unlocked: ${unlocked.title}`,
            subtitle: unlocked.description,
            tone: 'achievement',
          }),
        );
      }

      stateRef.current = next;
      setState(next);
      pushToasts(nextToasts);

      return { ok: true };
    },
    [pushToasts],
  );

  const equipItem = useCallback(
    (itemId: string) => {
      const current = stateRef.current;
      const item = AVATAR_ITEMS_BY_ID[itemId];

      if (!item) return { ok: false, reason: 'Item not found' };
      if (!current.ownedItemIds.includes(itemId)) return { ok: false, reason: 'Item not owned' };
      if (current.equippedBySlot[item.slot] === itemId) return { ok: true };

      let next: GamificationState = {
        ...current,
        equippedBySlot: {
          ...current.equippedBySlot,
          [item.slot]: itemId,
        },
        avatarCustomizations: current.avatarCustomizations + 1,
      };

      const evaluation = evaluateAchievements(next);
      next.unlockedAchievementIds = evaluation.unlockedAchievementIds;
      next.achievementProgress = evaluation.achievementProgress;

      const nextToasts: RewardToast[] = [
        createToast({
          title: `${item.name} equipped`,
          subtitle: 'Avatar updated instantly.',
          tone: 'reward',
        }),
      ];

      for (const unlocked of evaluation.newlyUnlocked) {
        nextToasts.push(
          createToast({
            title: `Achievement unlocked: ${unlocked.title}`,
            subtitle: unlocked.description,
            tone: 'achievement',
          }),
        );
      }

      stateRef.current = next;
      setState(next);
      pushToasts(nextToasts);

      return { ok: true };
    },
    [pushToasts],
  );

  const selectBaseAvatar = useCallback(
    (baseAvatarId: BaseAvatarId) => {
      const current = stateRef.current;
      const selectedBase = BASE_AVATARS_BY_ID[baseAvatarId];
      if (!selectedBase) return { ok: false, reason: 'Base avatar not found' };
      if (current.selectedBaseAvatarId === baseAvatarId) return { ok: true };

      const nextOwned = Array.from(new Set([...current.ownedItemIds, ...DEFAULT_OWNED_ITEM_IDS]));
      const nextEquipped = sanitizeEquippedBySlot(
        {
          ...current.equippedBySlot,
          ...(selectedBase.starterLoadout as Partial<Record<AvatarSlot, string>>),
        },
        baseAvatarId,
        nextOwned,
      );

      let next: GamificationState = {
        ...current,
        selectedBaseAvatarId: baseAvatarId,
        ownedItemIds: nextOwned,
        equippedBySlot: nextEquipped,
        avatarCustomizations: current.avatarCustomizations + 1,
      };

      const evaluation = evaluateAchievements(next);
      next.unlockedAchievementIds = evaluation.unlockedAchievementIds;
      next.achievementProgress = evaluation.achievementProgress;

      const nextToasts: RewardToast[] = [
        createToast({
          title: `${selectedBase.shortLabel} selected`,
          subtitle: 'Base character updated.',
          tone: 'reward',
        }),
      ];

      for (const unlocked of evaluation.newlyUnlocked) {
        nextToasts.push(
          createToast({
            title: `Achievement unlocked: ${unlocked.title}`,
            subtitle: unlocked.description,
            tone: 'achievement',
          }),
        );
      }

      stateRef.current = next;
      setState(next);
      pushToasts(nextToasts);

      return { ok: true };
    },
    [pushToasts],
  );

  const saveRpmAvatar = useCallback(
    (avatarUrl: string) => {
      const normalized = normalizeRpmAvatarUrl(avatarUrl);
      if (!normalized) {
        pushToasts([
          createToast({
            title: 'Invalid avatar URL',
            subtitle: 'The Ready Player Me URL is not valid.',
            tone: 'warning',
          }),
        ]);
        return { ok: false, reason: 'Invalid avatar URL' };
      }

      const current = stateRef.current;
      const nextLibrary = Array.from(new Set([normalized, ...current.rpmAvatarLibrary])).slice(
        0,
        MAX_RPM_AVATARS,
      );

      let next: GamificationState = {
        ...current,
        rpmAvatarLibrary: nextLibrary,
        selectedRpmAvatarUrl: normalized,
        avatarCustomizations: current.avatarCustomizations + 1,
      };

      const evaluation = evaluateAchievements(next);
      next.unlockedAchievementIds = evaluation.unlockedAchievementIds;
      next.achievementProgress = evaluation.achievementProgress;

      const nextToasts: RewardToast[] = [
        createToast({
          title: '3D avatar saved',
          subtitle: 'Ready Player Me avatar is now active.',
          tone: 'reward',
        }),
      ];

      for (const unlocked of evaluation.newlyUnlocked) {
        nextToasts.push(
          createToast({
            title: `Achievement unlocked: ${unlocked.title}`,
            subtitle: unlocked.description,
            tone: 'achievement',
          }),
        );
      }

      stateRef.current = next;
      setState(next);
      pushToasts(nextToasts);

      return { ok: true };
    },
    [pushToasts],
  );

  const selectRpmAvatar = useCallback(
    (avatarUrl: string) => {
      const normalized = normalizeRpmAvatarUrl(avatarUrl);
      const current = stateRef.current;
      if (!normalized || !current.rpmAvatarLibrary.includes(normalized)) {
        return { ok: false, reason: 'Avatar not found in library' };
      }
      if (current.selectedRpmAvatarUrl === normalized) return { ok: true };

      const next: GamificationState = {
        ...current,
        selectedRpmAvatarUrl: normalized,
      };
      stateRef.current = next;
      setState(next);
      return { ok: true };
    },
    [],
  );

  const removeRpmAvatar = useCallback((avatarUrl: string) => {
    const normalized = normalizeRpmAvatarUrl(avatarUrl);
    const current = stateRef.current;
    if (!normalized) return { ok: false, reason: 'Invalid avatar URL' };
    if (!current.rpmAvatarLibrary.includes(normalized)) return { ok: false, reason: 'Avatar not found' };

    const nextLibrary = current.rpmAvatarLibrary.filter((url) => url !== normalized);
    const next: GamificationState = {
      ...current,
      rpmAvatarLibrary: nextLibrary,
      selectedRpmAvatarUrl:
        current.selectedRpmAvatarUrl === normalized
          ? nextLibrary[0] ?? null
          : current.selectedRpmAvatarUrl,
    };

    stateRef.current = next;
    setState(next);
    return { ok: true };
  }, []);

  const syncSelectedTheme = useCallback((themeId: ThemePresetId) => {
    const current = stateRef.current;
    if (current.selectedThemeId === themeId) return;

    const next: GamificationState = {
      ...current,
      selectedThemeId: themeId,
    };
    stateRef.current = next;
    setState(next);
  }, []);

  const value = useMemo<GamificationContextValue>(
    () => ({
      state,
      avatarCatalog: AVATAR_CATALOG,
      baseAvatars: BASE_AVATARS,
      achievements: ACHIEVEMENTS,
      toasts,
      recordEvent,
      buyItem,
      equipItem,
      selectBaseAvatar,
      saveRpmAvatar,
      selectRpmAvatar,
      removeRpmAvatar,
      dismissToast,
      syncSelectedTheme,
    }),
    [
      state,
      toasts,
      recordEvent,
      buyItem,
      equipItem,
      selectBaseAvatar,
      saveRpmAvatar,
      selectRpmAvatar,
      removeRpmAvatar,
      dismissToast,
      syncSelectedTheme,
    ],
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used inside GamificationProvider');
  }
  return context;
};

export { getTodayKey };
