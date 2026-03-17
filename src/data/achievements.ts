export type AchievementId =
  | 'first_task_completed'
  | 'streak_3_days'
  | 'streak_7_days'
  | 'tasks_10_completed'
  | 'focus_50_minutes'
  | 'full_ai_path'
  | 'customized_avatar_first_time'
  | 'first_shop_purchase';

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  target: number;
  icon: string;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_task_completed',
    title: 'First Finish',
    description: 'Complete your first full task path.',
    target: 1,
    icon: '🏁',
  },
  {
    id: 'streak_3_days',
    title: 'Momentum 3',
    description: 'Keep a 3-day productivity streak.',
    target: 3,
    icon: '🔥',
  },
  {
    id: 'streak_7_days',
    title: 'Momentum 7',
    description: 'Keep a 7-day productivity streak.',
    target: 7,
    icon: '⚡',
  },
  {
    id: 'tasks_10_completed',
    title: 'Task Finisher',
    description: 'Complete 10 task paths.',
    target: 10,
    icon: '✅',
  },
  {
    id: 'focus_50_minutes',
    title: 'Deep Worker',
    description: 'Accumulate 50 minutes in focus mode.',
    target: 50,
    icon: '⏱️',
  },
  {
    id: 'full_ai_path',
    title: 'AI Path Master',
    description: 'Finish a full AI-generated path.',
    target: 1,
    icon: '🧠',
  },
  {
    id: 'customized_avatar_first_time',
    title: 'Styled Up',
    description: 'Customize your avatar for the first time.',
    target: 1,
    icon: '🎨',
  },
  {
    id: 'first_shop_purchase',
    title: 'First Purchase',
    description: 'Buy your first shop item.',
    target: 1,
    icon: '🛍️',
  },
];
