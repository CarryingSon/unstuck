import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  ExternalLink,
  Flame,
  Palette,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trash2,
  Trophy,
  User,
  X,
} from 'lucide-react';
import {
  AVATAR_CATEGORY_LABELS,
  type AvatarCategory,
  type AvatarItem,
} from '../../data/avatarCatalog.ts';
import { AvatarPreview } from './AvatarPreview.tsx';
import { useGamification } from '../../state/gamification.tsx';
import { useTheme } from '../../state/theme.tsx';

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'avatar', label: 'Avatar', icon: Sparkles },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'themes', label: 'Themes', icon: Palette },
] as const;

type TabId = (typeof tabs)[number]['id'];

const shopCategories: AvatarCategory[] = [
  'hair',
  'outfits',
  'tops',
  'bottoms',
  'shoes',
  'accessories',
  'frames',
];

const rpmCreatorBaseUrl = import.meta.env.VITE_RPM_CREATOR_URL || 'https://demo.readyplayer.me/avatar';
const rpmCreatorUrl = rpmCreatorBaseUrl.includes('?')
  ? `${rpmCreatorBaseUrl}&frameApi`
  : `${rpmCreatorBaseUrl}?frameApi`;

type RpmFrameMessage = {
  source?: string;
  eventName?: string;
  data?: {
    url?: string;
  };
};

const parseRpmMessage = (value: unknown): RpmFrameMessage | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as RpmFrameMessage;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') {
    return value as RpmFrameMessage;
  }
  return null;
};

const rarityClass = (rarity: AvatarItem['rarity']) => {
  if (rarity === 'Legendary') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (rarity === 'Epic') return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
  if (rarity === 'Rare') return 'bg-sky-100 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const slotLabel = (slot: AvatarItem['slot']) => {
  if (slot === 'hairStyle') return 'Hair style';
  if (slot === 'hairColor') return 'Hair color';
  if (slot === 'outfit') return 'Outer layer';
  if (slot === 'top') return 'Top';
  if (slot === 'bottom') return 'Bottom';
  if (slot === 'shoes') return 'Shoes';
  if (slot === 'accessory') return 'Accessory';
  return 'Profile frame';
};

const ItemCard = ({
  item,
  coins,
  isOwned,
  isEquipped,
  onBuy,
  onEquip,
}: {
  item: AvatarItem;
  coins: number;
  isOwned: boolean;
  isEquipped: boolean;
  onBuy: (itemId: string) => void;
  onEquip: (itemId: string) => void;
}) => {
  const canBuy = coins >= item.cost;
  const colorA = item.palette.primary;
  const colorB = item.palette.secondary ?? item.palette.primary;
  const colorC = item.palette.accent ?? item.palette.secondary ?? item.palette.primary;

  return (
    <article className="rounded-2xl border border-primary/15 bg-white p-4 flex flex-col gap-3 soft-shadow">
      <div
        className="h-20 rounded-xl border border-black/10"
        style={{
          background: `linear-gradient(135deg, ${colorA} 0%, ${colorB} 60%, ${colorC} 100%)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink leading-tight">{item.name}</p>
          <p className="text-xs text-ink/55 mt-1">{item.description}</p>
          <p className="text-[11px] text-ink/45 mt-2 uppercase tracking-wide font-bold">{slotLabel(item.slot)}</p>
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase border ${rarityClass(item.rarity)}`}>
          {item.rarity}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 mt-auto pt-1">
        <p className="text-xs font-black text-amber-700 inline-flex items-center gap-1">
          <Coins className="w-3.5 h-3.5" />
          {item.cost}
        </p>

        {isOwned ? (
          <button
            onClick={() => onEquip(item.id)}
            disabled={isEquipped}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${
              isEquipped
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {isEquipped ? 'Equipped' : 'Equip'}
          </button>
        ) : (
          <button
            onClick={() => onBuy(item.id)}
            disabled={!canBuy}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${
              canBuy ? 'bg-primary text-white hover:bg-primary/90' : 'bg-ink/10 text-ink/35 cursor-not-allowed'
            }`}
          >
            {canBuy ? 'Buy' : 'Locked'}
          </button>
        )}
      </div>
    </article>
  );
};

export function ProfileHub({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    state,
    avatarCatalog,
    achievements,
    buyItem,
    equipItem,
    saveRpmAvatar,
    selectRpmAvatar,
    removeRpmAvatar,
  } = useGamification();
  const { themes, themeId, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [shopCategory, setShopCategory] = useState<AvatarCategory>('outfits');
  const [viewAngle, setViewAngle] = useState(0);
  const [isRpmStudioOpen, setIsRpmStudioOpen] = useState(false);
  const [rpmFrameReady, setRpmFrameReady] = useState(false);
  const [rpmLoading, setRpmLoading] = useState(false);
  const rpmFrameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('overview');
      setShopCategory('outfits');
      setViewAngle(0);
      setIsRpmStudioOpen(false);
      setRpmFrameReady(false);
      setRpmLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isRpmStudioOpen) return;

    const handleMessage = (event: MessageEvent<unknown>) => {
      const payload = parseRpmMessage(event.data);
      if (!payload || payload.source !== 'readyplayerme') return;

      if (payload.eventName === 'v1.frame.ready') {
        setRpmFrameReady(true);
        setRpmLoading(false);

        const frameWindow = rpmFrameRef.current?.contentWindow;
        if (!frameWindow) return;

        const subscribe = (eventName: string) =>
          frameWindow.postMessage(
            JSON.stringify({
              target: 'readyplayerme',
              type: 'subscribe',
              eventName,
            }),
            '*',
          );

        subscribe('v1.avatar.exported');
        subscribe('v1.user.set');
      }

      if (payload.eventName === 'v1.avatar.exported' && payload.data?.url) {
        const saved = saveRpmAvatar(payload.data.url);
        if (saved.ok) {
          setIsRpmStudioOpen(false);
          setRpmFrameReady(false);
          setRpmLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isRpmStudioOpen, saveRpmAvatar]);

  const xpPercent = Math.max(
    0,
    Math.min(100, Math.round((state.xpIntoLevel / Math.max(1, state.xpToNextLevel)) * 100)),
  );

  const unlockedAchievements = useMemo(
    () => achievements.filter((achievement) => state.unlockedAchievementIds.includes(achievement.id)),
    [achievements, state.unlockedAchievementIds],
  );

  const shopItems = useMemo(
    () => avatarCatalog.filter((item) => item.category === shopCategory),
    [avatarCatalog, shopCategory],
  );
  const activeRpmAvatarUrl = state.selectedRpmAvatarUrl;
  const isUsingRpmAvatar = Boolean(activeRpmAvatarUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130]">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
            aria-label="Close profile panel"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="absolute right-0 top-0 h-full w-[min(97vw,920px)] bg-surface border-l border-primary/10 shadow-2xl flex flex-col"
          >
            <div className="px-6 md:px-8 py-5 border-b border-primary/10 flex items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-white to-secondary/10">
              <div className="flex items-center gap-4">
                <AvatarPreview
                  equippedBySlot={state.equippedBySlot}
                  selectedBaseAvatarId={state.selectedBaseAvatarId}
                  rpmAvatarUrl={activeRpmAvatarUrl}
                  size="md"
                />
                <div>
                  <p className="text-xs uppercase tracking-widest font-black text-primary">Profile Hub</p>
                  <h2 className="text-2xl font-display font-bold text-ink">{state.username}</h2>
                  <p className="text-xs text-ink/50 font-semibold">Level {state.level} · {state.coins} coins</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl inline-flex items-center justify-center text-ink/50 hover:bg-primary/10 hover:text-primary transition-colors"
                title="Close profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 md:px-7 py-3 border-b border-primary/10 overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-2 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-primary/25'
                          : 'bg-bg text-ink/65 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6 space-y-6">
              {activeTab === 'overview' && (
                <section className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">
                    <div className="bg-white rounded-3xl border border-primary/15 p-4 flex items-center justify-center">
                      <AvatarPreview
                        equippedBySlot={state.equippedBySlot}
                        selectedBaseAvatarId={state.selectedBaseAvatarId}
                        rpmAvatarUrl={activeRpmAvatarUrl}
                        size="lg"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-3xl border border-primary/15 p-5 soft-shadow">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-xs uppercase tracking-widest font-black text-primary">Current Level</p>
                            <h3 className="text-3xl font-display font-bold text-ink">Level {state.level}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-ink/50 font-bold">XP to next level</p>
                            <p className="font-black text-primary">
                              {state.xpIntoLevel}/{state.xpToNextLevel}
                            </p>
                          </div>
                        </div>

                        <div className="h-3 rounded-full bg-primary/10 p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                            style={{ width: `${xpPercent}%` }}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-black text-sm">
                            <Coins className="w-4 h-4" /> {state.coins} coins
                          </span>
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 font-black text-sm">
                            <Flame className="w-4 h-4" /> {state.streakDays} day streak
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-2xl border border-primary/10 p-4">
                          <p className="text-xs text-ink/45 uppercase tracking-widest font-black">Tasks completed</p>
                          <p className="text-2xl font-display font-bold text-ink mt-1">{state.tasksCompleted}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-primary/10 p-4">
                          <p className="text-xs text-ink/45 uppercase tracking-widest font-black">Focus sessions</p>
                          <p className="text-2xl font-display font-bold text-ink mt-1">{state.focusSessionsCompleted}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-primary/10 p-4">
                          <p className="text-xs text-ink/45 uppercase tracking-widest font-black">Focus minutes</p>
                          <p className="text-2xl font-display font-bold text-ink mt-1">{state.focusMinutesTotal}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-primary/10 p-4">
                          <p className="text-xs text-ink/45 uppercase tracking-widest font-black">Rewards earned</p>
                          <p className="text-2xl font-display font-bold text-ink mt-1">{state.rewardsEarnedTotal}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-primary/10 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-display font-bold text-xl text-ink">Achievement Preview</h4>
                      <span className="text-xs font-black text-primary uppercase tracking-widest">
                        {unlockedAchievements.length}/{achievements.length}
                      </span>
                    </div>
                    {unlockedAchievements.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {unlockedAchievements.slice(0, 4).map((achievement) => (
                          <div key={achievement.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="text-xs font-black text-amber-700 uppercase tracking-wider">
                              {achievement.icon} {achievement.title}
                            </p>
                            <p className="text-xs text-amber-900/80 mt-0.5">{achievement.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-primary/20 bg-bg px-4 py-5 text-sm text-ink/50 font-medium">
                        No achievements unlocked yet. Complete steps and focus sessions to unlock your first badge.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'avatar' && (
                <section className="space-y-5">
                  <div className="rounded-3xl border border-primary/15 bg-white p-4 md:p-6">
                    <div className="flex flex-col items-center gap-4">
                      <AvatarPreview
                        equippedBySlot={state.equippedBySlot}
                        selectedBaseAvatarId={state.selectedBaseAvatarId}
                        rpmAvatarUrl={activeRpmAvatarUrl}
                        size="lg"
                        viewAngle={viewAngle}
                      />
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setIsRpmStudioOpen(true);
                            setRpmLoading(true);
                          }}
                          className="h-10 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 inline-flex items-center gap-2 text-sm font-bold"
                        >
                          <Plus className="w-4 h-4" /> Open 3D Avatar Studio
                        </button>
                        <a
                          href="https://readyplayer.me/"
                          target="_blank"
                          rel="noreferrer"
                          className="h-10 px-3 rounded-xl border border-primary/15 bg-bg text-ink/65 hover:bg-primary/10 hover:text-primary inline-flex items-center gap-1.5 text-xs font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Ready Player Me
                        </a>
                      </div>

                      {isUsingRpmAvatar ? (
                        <p className="text-xs text-ink/55 font-semibold text-center max-w-sm">
                          Active 3D avatar is enabled. Drag inside the preview to rotate and zoom.
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewAngle((current) => Math.max(-28, current - 12))}
                            className="h-9 w-9 rounded-xl border border-primary/15 bg-bg text-ink/65 hover:bg-primary/10 hover:text-primary inline-flex items-center justify-center"
                            title="Rotate left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <input
                            type="range"
                            min={-28}
                            max={28}
                            step={1}
                            value={viewAngle}
                            onChange={(event) => setViewAngle(Number(event.target.value))}
                            className="w-40 accent-primary"
                          />
                          <button
                            onClick={() => setViewAngle((current) => Math.min(28, current + 12))}
                            className="h-9 w-9 rounded-xl border border-primary/15 bg-bg text-ink/65 hover:bg-primary/10 hover:text-primary inline-flex items-center justify-center"
                            title="Rotate right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewAngle(0)}
                            className="h-9 px-3 rounded-xl border border-primary/15 bg-bg text-ink/65 hover:bg-primary/10 hover:text-primary inline-flex items-center gap-1.5 text-xs font-bold"
                            title="Reset angle"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/15 bg-white p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm font-black text-ink">3D Avatar Library</p>
                      <span className="text-[11px] font-bold text-ink/50">
                        {state.rpmAvatarLibrary.length}/4 saved
                      </span>
                    </div>

                    {state.rpmAvatarLibrary.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {state.rpmAvatarLibrary.map((avatarUrl, index) => {
                          const isSelected = state.selectedRpmAvatarUrl === avatarUrl;
                          return (
                            <div
                              key={avatarUrl}
                              className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-2 ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-primary/10 bg-bg/60'
                              }`}
                            >
                              <p className="text-xs font-semibold text-ink/65">3D Character {index + 1}</p>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => selectRpmAvatar(avatarUrl)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-black ${
                                    isSelected
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-primary text-white hover:bg-primary/90'
                                  }`}
                                >
                                  {isSelected ? 'Active' : 'Use'}
                                </button>
                                <button
                                  onClick={() => removeRpmAvatar(avatarUrl)}
                                  className="w-7 h-7 rounded-lg border border-primary/15 text-ink/50 hover:bg-primary/10 hover:text-primary inline-flex items-center justify-center"
                                  title="Remove avatar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-primary/25 bg-bg px-3 py-4 text-xs text-ink/55 font-semibold">
                        No 3D avatars saved yet. Open 3D Avatar Studio to generate and import your first character.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'shop' && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3">
                    <p className="font-bold text-primary">Shop balance</p>
                    <p className="font-black text-primary inline-flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {state.coins}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {shopCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setShopCategory(category)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm ${
                          shopCategory === category
                            ? 'bg-primary text-white'
                            : 'bg-white border border-primary/15 text-ink/70 hover:bg-primary/5'
                        }`}
                      >
                        {AVATAR_CATEGORY_LABELS[category]}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shopItems.map((item) => {
                      const isOwned = state.ownedItemIds.includes(item.id);
                      const isEquipped = state.equippedBySlot[item.slot] === item.id;

                      return (
                        <div key={item.id}>
                          <ItemCard
                            item={item}
                            coins={state.coins}
                            isOwned={isOwned}
                            isEquipped={isEquipped}
                            onBuy={buyItem}
                            onEquip={equipItem}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {activeTab === 'achievements' && (
                <section className="space-y-3">
                  {achievements.map((achievement) => {
                    const progress = state.achievementProgress[achievement.id] ?? 0;
                    const isUnlocked = state.unlockedAchievementIds.includes(achievement.id);
                    const progressPercent = Math.round((progress / achievement.target) * 100);

                    return (
                      <div
                        key={achievement.id}
                        className={`rounded-2xl border p-4 ${
                          isUnlocked ? 'border-amber-300 bg-amber-50' : 'border-primary/10 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="font-bold text-ink">
                              {achievement.icon} {achievement.title}
                            </p>
                            <p className="text-xs text-ink/55 mt-1">{achievement.description}</p>
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                              isUnlocked ? 'bg-amber-200 text-amber-800' : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {isUnlocked ? (
                              <span className="inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Unlocked
                              </span>
                            ) : (
                              `${progress}/${achievement.target}`
                            )}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-primary/10 p-0.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isUnlocked ? 'bg-amber-400' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.max(6, progressPercent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {activeTab === 'themes' && (
                <section className="space-y-3">
                  {themes.map((theme) => {
                    const isActive = theme.id === themeId;
                    return (
                      <div key={theme.id} className="rounded-2xl border border-primary/10 bg-white p-4">
                        <div
                          className="h-16 rounded-xl border border-black/5"
                          style={{ background: theme.previewGradient }}
                        />
                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-ink">{theme.label}</p>
                            <p className="text-xs text-ink/55 mt-1">{theme.description}</p>
                          </div>
                          <button
                            onClick={() => setTheme(theme.id)}
                            disabled={isActive}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            {isActive ? 'Applied' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-ink/65 font-medium">
                    Focus tip: switch to <strong className="text-primary">Focus Mode Theme</strong> during deep work sessions to reduce visual noise.
                  </div>
                </section>
              )}
            </div>

            <div className="px-6 py-4 border-t border-primary/10 bg-bg/60 text-xs text-ink/50 font-semibold flex items-center justify-between">
              <span className="inline-flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-primary" /> Keep your momentum alive
              </span>
              <span>{state.unlockedAchievementIds.length} badges unlocked</span>
            </div>
          </motion.aside>

          <AnimatePresence>
            {isRpmStudioOpen && (
              <div className="absolute inset-0 z-[150] flex items-center justify-center p-4">
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsRpmStudioOpen(false);
                    setRpmFrameReady(false);
                    setRpmLoading(false);
                  }}
                  className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
                  aria-label="Close 3D avatar studio"
                />

                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  className="relative w-[min(97vw,1220px)] h-[min(92vh,860px)] rounded-[2rem] border border-primary/25 bg-surface shadow-2xl overflow-hidden"
                >
                  <div className="h-14 px-5 border-b border-primary/10 flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
                    <div>
                      <p className="text-sm font-black text-ink">Ready Player Me Studio</p>
                      <p className="text-[11px] text-ink/55 font-semibold">
                        Create/export avatar and it will be saved automatically.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsRpmStudioOpen(false);
                        setRpmFrameReady(false);
                        setRpmLoading(false);
                      }}
                      className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-ink/50 hover:bg-primary/10 hover:text-primary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <iframe
                    ref={rpmFrameRef}
                    title="Ready Player Me Avatar Creator"
                    src={rpmCreatorUrl}
                    className="w-full h-[calc(100%-56px)] border-0"
                    allow="camera *; microphone *"
                    onLoad={() => {
                      setRpmLoading(true);
                    }}
                  />

                  {(rpmLoading || !rpmFrameReady) && (
                    <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
                      <div className="px-3 py-1.5 rounded-full bg-ink/80 text-white text-xs font-bold">
                        Loading 3D studio...
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
