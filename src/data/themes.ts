export type ThemePresetId =
  | 'default-purple'
  | 'dark'
  | 'minimalist'
  | 'colorful'
  | 'soft-pastel'
  | 'focus';

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  description: string;
  previewGradient: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default-purple',
    label: 'Default Purple',
    description: 'Branded violet palette with soft contrast.',
    previewGradient: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 55%, #B499FF 100%)',
  },
  {
    id: 'dark',
    label: 'Dark Mode',
    description: 'Elegant dark workspace with high readability.',
    previewGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #334155 100%)',
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Calm neutral tones and low saturation.',
    previewGradient: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 55%, #9CA3AF 100%)',
  },
  {
    id: 'colorful',
    label: 'Colorful',
    description: 'Vibrant but tasteful gradients for momentum.',
    previewGradient: 'linear-gradient(135deg, #F97316 0%, #EC4899 50%, #6366F1 100%)',
  },
  {
    id: 'soft-pastel',
    label: 'Soft Pastel',
    description: 'Playful and gentle with pastel accents.',
    previewGradient: 'linear-gradient(135deg, #FDBA74 0%, #F9A8D4 50%, #A7F3D0 100%)',
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Low-distraction palette designed for deep work.',
    previewGradient: 'linear-gradient(135deg, #0B1E2D 0%, #1E3A4A 55%, #356C76 100%)',
  },
];

export const DEFAULT_THEME_ID: ThemePresetId = 'default-purple';
