import { useId } from 'react';
import {
  AVATAR_ITEMS_BY_ID,
  BASE_AVATARS_BY_ID,
  DEFAULT_BASE_AVATAR_ID,
  DEFAULT_EQUIPPED_BY_SLOT,
  type AvatarSlot,
  type BaseAvatarId,
} from '../../data/avatarCatalog.ts';

const SIZE_MAP = {
  sm: { width: 66, height: 66, radius: 18, scale: 0.33, viewBoxWidth: 340, viewBoxHeight: 520 },
  md: { width: 110, height: 110, radius: 26, scale: 0.5, viewBoxWidth: 340, viewBoxHeight: 520 },
  lg: { width: 340, height: 430, radius: 34, scale: 1, viewBoxWidth: 340, viewBoxHeight: 520 },
} as const;

const normalizeRpmUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withoutQuery = trimmed.split('?')[0];
  if (!withoutQuery.includes('models.readyplayer.me')) return '';
  return withoutQuery.endsWith('.glb') ? withoutQuery : `${withoutQuery}.glb`;
};

type HairShapeProps = {
  modelKey: string;
  fill: string;
  shade: string;
  accent?: string;
};

const renderHairShape = ({ modelKey, fill, shade, accent }: HairShapeProps) => {
  switch (modelKey) {
    case 'sleek-bob':
      return (
        <g>
          <path d="M96 138c0-62 38-108 74-108 48 0 82 48 82 110 0 22-8 41-20 58-13 20-20 48-17 76l-26 0c-4-26 2-52 14-73 8-14 12-28 12-45 0-39-18-72-49-72-30 0-50 30-50 70 0 20 6 37 17 53 11 16 19 39 16 65l-27 0c3-29-5-56-18-76-12-17-18-35-18-58Z" fill={fill} />
          <path d="M116 96c12-26 30-43 54-43 24 0 43 15 55 40" stroke={shade} strokeWidth="10" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    case 'airy-lob':
      return (
        <g>
          <path d="M88 142c0-64 36-111 82-111 53 0 86 52 86 114 0 24-7 45-21 65-18 24-26 57-24 88h-28c-2-30 5-59 19-84 10-19 15-35 15-55 0-40-19-74-50-74-31 0-50 33-50 74 0 23 6 42 17 59 14 21 23 50 20 80h-29c2-31-6-62-24-89-9-14-13-30-13-47Z" fill={fill} />
          <path d="M119 78c15-15 31-22 51-22 22 0 40 8 56 26" stroke={shade} strokeWidth="8" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    case 'knot-bun':
      return (
        <g>
          <circle cx="171" cy="42" r="26" fill={shade} />
          <circle cx="171" cy="42" r="18" fill={fill} />
          <path d="M98 142c0-58 33-102 72-102 45 0 77 45 77 103 0 19-5 36-15 50l-26 0c7-13 11-27 11-43 0-34-16-66-47-66-30 0-47 30-47 66 0 17 5 34 13 46h-28c-7-11-10-24-10-38Z" fill={fill} />
          <path d="M129 68c11-11 25-16 41-16 16 0 30 6 42 17" stroke={shade} strokeWidth="7" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    case 'flow-quiff':
      return (
        <g>
          <path d="M102 145c0-56 32-99 68-99 18 0 34 9 45 24 13 16 20 39 20 64 0 15-3 30-10 43h-32c6-10 9-22 9-35 0-20-7-39-19-49-5 18-20 31-45 39-11 3-18 10-21 20-3 8-3 17 1 25h-28c-4-9-5-20-3-32 3-17 13-30 30-35 11-4 21-8 29-14-6-6-14-9-24-9-24 0-41 30-41 67 0 9 1 17 4 25h-28c-4-11-5-22-5-34Z" fill={fill} />
          <path d="M161 72c12 0 21 5 30 15" stroke={accent ?? '#d1d5db'} strokeWidth="4" strokeLinecap="round" opacity="0.65" />
        </g>
      );
    case 'mid-shag':
      return (
        <g>
          <path d="M92 141c0-62 36-108 80-108 52 0 83 51 83 109 0 23-7 43-19 61-15 21-23 49-20 77h-29c-3-24 4-50 16-71 8-14 13-28 13-46 0-38-18-70-48-70-31 0-49 31-49 70 0 19 6 36 15 51 13 21 20 47 17 72h-31c2-29-5-56-20-78-11-17-17-36-17-57Z" fill={fill} />
          <path d="M119 96c8 4 15 6 23 6 9 0 17-3 27-7 9-4 17-7 27-7" stroke={shade} strokeWidth="7" strokeLinecap="round" opacity="0.7" />
          <path d="M118 128c11 5 20 7 29 7 8 0 17-2 29-7" stroke={shade} strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        </g>
      );
    case 'precision-fade':
      return (
        <g>
          <path d="M110 142c0-50 25-89 61-89 34 0 59 36 59 87 0 12-2 24-6 35h-113c-1-7-1-15-1-23Z" fill={fill} />
          <path d="M119 175c-6-8-10-18-10-30 0-16 7-31 19-41" stroke={shade} strokeWidth="8" strokeLinecap="round" opacity="0.45" />
          <path d="M221 176c5-9 8-19 8-30 0-16-6-31-17-42" stroke={shade} strokeWidth="8" strokeLinecap="round" opacity="0.45" />
          <path d="M132 82c10-9 22-14 38-14 15 0 28 5 38 15" stroke={accent ?? '#d6dae5'} strokeWidth="4" strokeLinecap="round" opacity="0.65" />
        </g>
      );
    case 'low-ponytail':
      return (
        <g>
          <path d="M100 143c0-58 35-101 70-101 46 0 78 44 78 102 0 20-4 37-12 52h-29c8-13 11-27 11-43 0-37-18-67-49-67-27 0-40 24-40 59 0 18 3 35 9 50h-30c-5-15-8-33-8-52Z" fill={fill} />
          <path d="M219 179c14 11 24 23 29 40 4 14 3 29-4 42h-22c7-17 7-33 1-48-3-8-8-15-14-22" fill={shade} opacity="0.8" />
          <rect x="206" y="176" width="18" height="10" rx="5" fill={accent ?? '#c3ccd8'} />
        </g>
      );
    case 'sculpted-wave':
      return (
        <g>
          <path d="M96 145c0-61 34-108 76-108 51 0 84 49 84 111 0 21-5 40-16 58-14 23-22 52-20 81h-28c-2-26 4-53 17-76 9-16 13-31 13-49 0-38-18-72-50-72-32 0-49 31-49 71 0 22 7 40 19 57 14 21 22 47 20 72h-29c2-29-7-57-23-79-10-16-14-34-14-56Z" fill={fill} />
          <path d="M112 95c14-20 33-31 57-31 18 0 33 7 47 21" stroke={accent ?? '#d8dce7'} strokeWidth="6" strokeLinecap="round" opacity="0.7" />
          <path d="M123 130c9-8 18-12 28-12 12 0 23 4 35 13" stroke={shade} strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    default:
      return null;
  }
};

const renderOutfitOverlay = (modelKey: string, fill: string, shade: string, accent?: string) => {
  switch (modelKey) {
    case 'utility-shell':
      return (
        <g>
          <path d="M82 238c14-18 40-30 88-30 49 0 75 12 89 30l13 118H69l13-118Z" fill={fill} />
          <path d="M170 224v129" stroke={accent ?? '#e2e8f0'} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
          <path d="M112 266h116" stroke={shade} strokeWidth="4" opacity="0.36" />
          <path d="M109 296h122" stroke={shade} strokeWidth="3.2" opacity="0.24" />
        </g>
      );
    case 'oversized-hoodie':
      return (
        <g>
          <path d="M75 242c16-21 44-33 95-33s79 12 95 33l15 123H60l15-123Z" fill={fill} />
          <path d="M126 226c8-12 22-20 44-20 22 0 36 8 44 20" stroke={shade} strokeWidth="7" strokeLinecap="round" opacity="0.7" />
          <rect x="142" y="302" width="56" height="34" rx="13" fill={shade} opacity="0.34" />
        </g>
      );
    case 'structured-bomber':
      return (
        <g>
          <path d="M86 242c14-20 40-31 84-31s70 11 84 31l11 105H75l11-105Z" fill={fill} />
          <rect x="100" y="338" width="140" height="18" rx="9" fill={shade} opacity="0.88" />
          <path d="M170 226v122" stroke={accent ?? '#d5e0ef'} strokeWidth="4" opacity="0.86" />
          <path d="M116 258h108" stroke={shade} strokeWidth="3.4" opacity="0.3" />
        </g>
      );
    case 'minimal-trench':
      return (
        <g>
          <path d="M84 236c14-18 40-29 86-29s72 11 86 29l15 183H69l15-183Z" fill={fill} />
          <path d="M170 228v190" stroke={accent ?? '#f8fafc'} strokeWidth="4" opacity="0.82" />
          <path d="M123 267h94" stroke={shade} strokeWidth="4.5" opacity="0.4" />
          <path d="M124 305h92" stroke={shade} strokeWidth="4" opacity="0.3" />
          <path d="M124 345h92" stroke={shade} strokeWidth="3.5" opacity="0.22" />
        </g>
      );
    case 'carbon-techcoat':
      return (
        <g>
          <path d="M82 236c15-19 42-31 88-31 47 0 74 12 88 31l17 196H65l17-196Z" fill={fill} />
          <path d="M170 226v203" stroke={accent ?? '#7dd3fc'} strokeWidth="4" opacity="0.9" />
          <path d="M114 257h112" stroke={shade} strokeWidth="5.5" opacity="0.45" />
          <path d="M112 296h116" stroke={shade} strokeWidth="5" opacity="0.32" />
          <path d="M110 336h120" stroke={shade} strokeWidth="4.5" opacity="0.24" />
        </g>
      );
    default:
      return null;
  }
};

const renderAccessory = (modelKey: string, fill: string, shade: string, accent?: string) => {
  switch (modelKey) {
    case 'slim-glasses':
      return (
        <g>
          <rect x="132" y="126" width="27" height="16" rx="8" fill="none" stroke={fill} strokeWidth="3" />
          <rect x="181" y="126" width="27" height="16" rx="8" fill="none" stroke={fill} strokeWidth="3" />
          <path d="M159 133h22" stroke={fill} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'ear-cuffs':
      return (
        <g>
          <path d="M102 152c8 2 11 8 10 16" stroke={fill} strokeWidth="3" strokeLinecap="round" />
          <path d="M238 152c-8 2-11 8-10 16" stroke={fill} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'signal-necklace':
      return (
        <g>
          <path d="M144 214c8 10 19 15 27 15s19-5 27-15" stroke={fill} strokeWidth="3" fill="none" />
          <circle cx="170" cy="231" r="4" fill={accent ?? shade} />
        </g>
      );
    case 'crossbody':
      return (
        <g>
          <path d="M125 225l64 109" stroke={fill} strokeWidth="8" strokeLinecap="round" />
          <rect x="187" y="299" width="47" height="36" rx="9" fill={shade} />
          <rect x="196" y="309" width="20" height="5" rx="2" fill={accent ?? '#e2e8f0'} opacity="0.7" />
        </g>
      );
    case 'soft-cap':
      return (
        <g>
          <path d="M117 95c12-21 30-32 53-32 24 0 42 12 54 34" fill={fill} />
          <path d="M116 102h108c-8 9-26 15-53 15-26 0-46-5-55-15Z" fill={shade} />
        </g>
      );
    case 'visor':
      return (
        <g>
          <path d="M122 109h96c9 0 17 8 17 17v16c0 9-8 17-17 17h-96c-9 0-17-8-17-17v-16c0-9 8-17 17-17Z" fill={fill} opacity="0.35" />
          <path d="M122 109h96c9 0 17 8 17 17v16c0 9-8 17-17 17h-96c-9 0-17-8-17-17v-16c0-9 8-17 17-17Z" fill="none" stroke={accent ?? shade} strokeWidth="2.5" opacity="0.8" />
        </g>
      );
    case 'aero-headset':
      return (
        <g>
          <path d="M118 117c8-13 25-23 52-23s44 10 52 23" stroke={fill} strokeWidth="7" fill="none" />
          <rect x="109" y="133" width="12" height="28" rx="5" fill={shade} />
          <rect x="219" y="133" width="12" height="28" rx="5" fill={shade} />
          <rect x="224" y="145" width="16" height="4" rx="2" fill={accent ?? '#8bd7ff'} />
        </g>
      );
    default:
      return null;
  }
};

const renderFrontHair = (modelKey: string, fill: string, shade: string, accent?: string) => {
  switch (modelKey) {
    case 'sleek-bob':
    case 'airy-lob':
    case 'mid-shag':
      return (
        <path
          d="M118 98c13-14 31-21 52-21 22 0 41 7 54 21-7-2-16-3-27-3-10 0-19 1-27 1s-17-1-28-1c-10 0-18 1-24 3Z"
          fill={shade}
          opacity="0.9"
        />
      );
    case 'low-ponytail':
      return (
        <>
          <path d="M121 97c14-14 31-21 49-21 20 0 37 7 50 21" stroke={shade} strokeWidth="11" strokeLinecap="round" />
          <path d="M121 97c14-14 31-21 49-21 20 0 37 7 50 21" stroke={accent ?? '#d7dce7'} strokeWidth="3.5" strokeLinecap="round" opacity="0.38" />
        </>
      );
    case 'knot-bun':
      return (
        <path d="M120 102c12-16 30-25 50-25s38 9 50 25" stroke={shade} strokeWidth="10" strokeLinecap="round" />
      );
    case 'flow-quiff':
      return (
        <path d="M130 88c8-8 20-13 40-13 17 0 30 4 39 13-8 1-17 2-27 4-8 1-16 2-23 2-8 0-16-1-24-2-3 0-4-1-5-4Z" fill={fill} opacity="0.9" />
      );
    case 'precision-fade':
      return (
        <path d="M129 90c10-9 23-13 41-13 16 0 29 4 40 13" stroke={shade} strokeWidth="9" strokeLinecap="round" />
      );
    case 'sculpted-wave':
      return (
        <path d="M118 98c13-16 31-24 52-24 23 0 42 9 56 25-8-4-18-6-29-6-10 0-19 1-27 1-9 0-18-1-29-1-9 0-17 1-23 5Z" fill={fill} />
      );
    default:
      return null;
  }
};

export function AvatarPreview({
  equippedBySlot,
  selectedBaseAvatarId,
  size = 'md',
  className = '',
  viewAngle = 0,
  rpmAvatarUrl = null,
  renderMode = 'auto',
}: {
  equippedBySlot: Record<AvatarSlot, string>;
  selectedBaseAvatarId: BaseAvatarId;
  size?: keyof typeof SIZE_MAP;
  className?: string;
  viewAngle?: number;
  rpmAvatarUrl?: string | null;
  renderMode?: 'auto' | 'illustrated' | 'rpm';
}) {
  const tokens = SIZE_MAP[size];
  const uniqueId = useId().replace(/:/g, '');

  const baseAvatar = BASE_AVATARS_BY_ID[selectedBaseAvatarId] ?? BASE_AVATARS_BY_ID[DEFAULT_BASE_AVATAR_ID];

  const hairStyle = AVATAR_ITEMS_BY_ID[equippedBySlot.hairStyle] ?? AVATAR_ITEMS_BY_ID[DEFAULT_EQUIPPED_BY_SLOT.hairStyle];
  const hairColor = AVATAR_ITEMS_BY_ID[equippedBySlot.hairColor] ?? AVATAR_ITEMS_BY_ID[DEFAULT_EQUIPPED_BY_SLOT.hairColor];
  const outfit = AVATAR_ITEMS_BY_ID[equippedBySlot.outfit] ?? AVATAR_ITEMS_BY_ID[DEFAULT_EQUIPPED_BY_SLOT.outfit];
  const top = AVATAR_ITEMS_BY_ID[equippedBySlot.top] ?? AVATAR_ITEMS_BY_ID[DEFAULT_EQUIPPED_BY_SLOT.top];
  const bottom = AVATAR_ITEMS_BY_ID[equippedBySlot.bottom] ?? AVATAR_ITEMS_BY_ID[DEFAULT_EQUIPPED_BY_SLOT.bottom];
  const shoes = AVATAR_ITEMS_BY_ID[equippedBySlot.shoes] ?? AVATAR_ITEMS_BY_ID[DEFAULT_EQUIPPED_BY_SLOT.shoes];
  const accessory = AVATAR_ITEMS_BY_ID[equippedBySlot.accessory] ?? AVATAR_ITEMS_BY_ID[DEFAULT_EQUIPPED_BY_SLOT.accessory];
  const frame = AVATAR_ITEMS_BY_ID[equippedBySlot.frame] ?? AVATAR_ITEMS_BY_ID[DEFAULT_EQUIPPED_BY_SLOT.frame];

  const framePrimary = frame?.palette.primary ?? '#8b5cf6';
  const frameSecondary = frame?.palette.secondary ?? '#c4b5fd';
  const frameAccent = frame?.palette.accent ?? '#ede9fe';
  const normalizedRpmUrl = rpmAvatarUrl ? normalizeRpmUrl(rpmAvatarUrl) : '';
  const shouldRenderRpm =
    renderMode === 'rpm'
      ? Boolean(normalizedRpmUrl)
      : renderMode === 'illustrated'
        ? false
        : Boolean(normalizedRpmUrl);

  const hairPrimary = hairColor?.palette.primary ?? hairStyle?.palette.primary ?? '#2f241e';
  const hairSecondary = hairColor?.palette.secondary ?? hairStyle?.palette.secondary ?? '#5b4639';
  const hairAccent = hairColor?.palette.accent;

  const neckShade = baseAvatar.skin.shadow;
  const topPrimary = top?.palette.primary ?? '#3f4153';
  const topSecondary = top?.palette.secondary ?? '#5a5d75';
  const bottomPrimary = bottom?.palette.primary ?? '#3f4758';
  const bottomSecondary = bottom?.palette.secondary ?? '#667183';
  const shoesPrimary = shoes?.palette.primary ?? '#d7dce7';
  const shoesSecondary = shoes?.palette.secondary ?? '#9aa7be';

  const faceShape =
    baseAvatar.faceShape === 'defined-square'
      ? { rx: 67, ry: 81 }
      : baseAvatar.faceShape === 'athletic'
        ? { rx: 65, ry: 80 }
        : baseAvatar.faceShape === 'soft-heart'
          ? { rx: 63, ry: 82 }
          : { rx: 66, ry: 84 };

  if (shouldRenderRpm && normalizedRpmUrl) {
    return (
      <div
        className={`relative overflow-hidden border border-white/30 shadow-[0_26px_45px_-28px_rgba(25,15,60,0.9)] ${className}`}
        style={{
          width: tokens.width,
          height: tokens.height,
          borderRadius: tokens.radius,
          background: `linear-gradient(142deg, ${frameAccent} 0%, color-mix(in oklab, ${frameSecondary} 68%, #ffffff 32%) 45%, color-mix(in oklab, ${framePrimary} 58%, #111827 42%) 100%)`,
        }}
      >
        <div className="absolute inset-0.5 rounded-[inherit] overflow-hidden bg-[color-mix(in_oklab,var(--color-surface)_86%,#09090b_14%)]">
          <model-viewer
            src={normalizedRpmUrl}
            alt="Ready Player Me avatar"
            camera-controls={size !== 'sm'}
            auto-rotate={size === 'lg'}
            auto-rotate-delay="800"
            rotation-per-second="18deg"
            disable-pan
            interaction-prompt="none"
            environment-image="neutral"
            shadow-intensity="1"
            field-of-view={size === 'lg' ? '35deg' : '42deg'}
            camera-orbit={size === 'lg' ? `0deg 85deg ${viewAngle < 0 ? '125%' : '120%'}` : '0deg 83deg 130%'}
            min-camera-orbit="auto auto 95%"
            max-camera-orbit="auto auto 160%"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              background:
                'radial-gradient(150% 120% at 50% 4%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.03) 45%, rgba(15,23,42,0.36) 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(140% 80% at 50% -15%, rgba(255,255,255,0.42) 0%, transparent 46%), radial-gradient(140% 100% at 50% 130%, rgba(2,6,23,0.35) 0%, transparent 58%)',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden border border-white/30 shadow-[0_26px_45px_-28px_rgba(25,15,60,0.9)] ${className}`}
      style={{
        width: tokens.width,
        height: tokens.height,
        borderRadius: tokens.radius,
        background: `linear-gradient(142deg, ${frameAccent} 0%, color-mix(in oklab, ${frameSecondary} 68%, #ffffff 32%) 45%, color-mix(in oklab, ${framePrimary} 58%, #111827 42%) 100%)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 90% at 50% 5%, rgba(255,255,255,0.62) 0%, transparent 45%), radial-gradient(110% 80% at 50% 100%, rgba(17,24,39,0.35) 0%, transparent 54%)',
        }}
      />

      <div className="absolute inset-0.5 rounded-[inherit] overflow-hidden bg-[color-mix(in_oklab,var(--color-surface)_89%,#09090b_11%)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(130% 120% at 50% 8%, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.12) 37%, rgba(15,23,42,0.35) 100%)',
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            transform: `perspective(1000px) rotateY(${Math.max(-32, Math.min(32, viewAngle))}deg)`,
            transformStyle: 'preserve-3d',
            transformOrigin: '50% 52%',
            transition: 'transform 280ms ease',
          }}
        >
          <svg
            viewBox={`0 0 ${tokens.viewBoxWidth} ${tokens.viewBoxHeight}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: tokens.viewBoxWidth * tokens.scale,
              height: tokens.viewBoxHeight * tokens.scale,
              transform: 'translate(-50%, -46%)',
            }}
            role="img"
            aria-label={`${baseAvatar.name} avatar preview`}
          >
            <defs>
              <linearGradient id={`skin-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={baseAvatar.skin.highlight} />
                <stop offset="58%" stopColor={baseAvatar.skin.base} />
                <stop offset="100%" stopColor={baseAvatar.skin.shadow} />
              </linearGradient>

              <linearGradient id={`hair-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={hairSecondary} />
                <stop offset="100%" stopColor={hairPrimary} />
              </linearGradient>

              <linearGradient id={`top-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={topSecondary} />
                <stop offset="100%" stopColor={topPrimary} />
              </linearGradient>

              <linearGradient id={`bottom-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={bottomSecondary} />
                <stop offset="100%" stopColor={bottomPrimary} />
              </linearGradient>

              <linearGradient id={`shoe-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={shoesPrimary} />
                <stop offset="100%" stopColor={shoesSecondary} />
              </linearGradient>
            </defs>

            <ellipse cx="170" cy="474" rx="98" ry="18" fill="rgba(7,14,27,0.24)" />

            <g>
              <g opacity="0.96">
                {renderHairShape({
                  modelKey: hairStyle?.modelKey ?? 'sleek-bob',
                  fill: `url(#hair-${uniqueId})`,
                  shade: hairPrimary,
                  accent: hairAccent,
                })}
              </g>

              <rect x="137" y="196" width="66" height="38" rx="16" fill={`url(#skin-${uniqueId})`} opacity="0.95" />
              <ellipse cx="170" cy="216" rx="29" ry="14" fill={neckShade} opacity="0.34" />

              <ellipse
                cx="170"
                cy="132"
                rx={faceShape.rx}
                ry={faceShape.ry}
                fill={`url(#skin-${uniqueId})`}
              />
              <ellipse cx="170" cy="170" rx="34" ry="25" fill={baseAvatar.skin.highlight} opacity="0.11" />
              <circle cx="108" cy="147" r="9" fill={baseAvatar.skin.base} opacity="0.94" />
              <circle cx="232" cy="147" r="9" fill={baseAvatar.skin.base} opacity="0.94" />

              {renderFrontHair(
                hairStyle?.modelKey ?? 'sleek-bob',
                `url(#hair-${uniqueId})`,
                hairPrimary,
                hairAccent,
              )}

              <path d="M142 110c8-5 17-8 28-8 11 0 20 2 29 8" stroke={baseAvatar.eyes.brow} strokeWidth="5" strokeLinecap="round" opacity="0.84" />
              <ellipse cx="148" cy="136" rx="11" ry="8" fill="#fff" opacity="0.94" />
              <ellipse cx="192" cy="136" rx="11" ry="8" fill="#fff" opacity="0.94" />
              <circle cx="148" cy="136" r="4.3" fill={baseAvatar.eyes.iris} />
              <circle cx="192" cy="136" r="4.3" fill={baseAvatar.eyes.iris} />
              <circle cx="148" cy="136" r="1.9" fill={baseAvatar.eyes.pupil} />
              <circle cx="192" cy="136" r="1.9" fill={baseAvatar.eyes.pupil} />
              <circle cx="149" cy="135" r="1" fill="#ffffff" />
              <circle cx="193" cy="135" r="1" fill="#ffffff" />

              <path d="M170 146c-3 8-4 17-2 26" stroke={baseAvatar.skin.shadow} strokeWidth="2.6" strokeLinecap="round" opacity="0.64" />
              <path d="M156 183c8 5 18 6 28 0" stroke={baseAvatar.skin.blush} strokeWidth="3.9" strokeLinecap="round" />

              <path d="M74 246c17-25 46-39 96-39s79 14 96 39l14 108H60l14-108Z" fill={`url(#top-${uniqueId})`} />
              <path d="M98 226c19 17 43 26 72 26 29 0 53-9 72-26" stroke="rgba(255,255,255,0.26)" strokeWidth="4.8" strokeLinecap="round" />
              <path d="M74 354h192v17H74z" fill={topSecondary} opacity="0.35" />

              {renderOutfitOverlay(
                outfit?.modelKey ?? 'none',
                outfit?.palette.primary ?? '#384257',
                outfit?.palette.secondary ?? '#60708a',
                outfit?.palette.accent,
              )}

              <path d="M102 355h136v48H102z" fill={`url(#bottom-${uniqueId})`} opacity="0.94" />
              <rect x="109" y="401" width="50" height="76" rx="14" fill={`url(#bottom-${uniqueId})`} />
              <rect x="181" y="401" width="50" height="76" rx="14" fill={`url(#bottom-${uniqueId})`} />
              <rect x="159" y="401" width="22" height="76" rx="8" fill="rgba(238,242,255,0.22)" />

              {bottom?.modelKey === 'tech-cargo' && (
                <>
                  <rect x="117" y="427" width="24" height="23" rx="7" fill={bottom?.palette.accent ?? '#95a5be'} opacity="0.4" />
                  <rect x="199" y="427" width="24" height="23" rx="7" fill={bottom?.palette.accent ?? '#95a5be'} opacity="0.4" />
                </>
              )}

              {bottom?.modelKey === 'structured-wideleg' && (
                <>
                  <path d="M103 356h58v122h-63z" fill={bottomSecondary} opacity="0.45" />
                  <path d="M237 356h-58v122h63z" fill={bottomSecondary} opacity="0.45" />
                </>
              )}

              <ellipse cx="134" cy="478" rx="30" ry="10" fill={`url(#shoe-${uniqueId})`} />
              <ellipse cx="206" cy="478" rx="30" ry="10" fill={`url(#shoe-${uniqueId})`} />

              {shoes?.modelKey === 'urban-boot' && (
                <>
                  <rect x="103" y="462" width="62" height="14" rx="5" fill={shoesSecondary} opacity="0.74" />
                  <rect x="175" y="462" width="62" height="14" rx="5" fill={shoesSecondary} opacity="0.74" />
                </>
              )}

              {renderAccessory(
                accessory?.modelKey ?? 'none',
                accessory?.palette.primary ?? '#1f2937',
                accessory?.palette.secondary ?? '#94a3b8',
                accessory?.palette.accent,
              )}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
