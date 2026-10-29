import React from 'react';
import { CardDecorPreset, SITE_DECORATIONS } from '@/data/siteDecorations';

interface CardStickerDecorProps {
  preset: CardDecorPreset;
  /** Position of the main character/sweet illustration */
  primaryPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  /** Size variant for the stickers */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a small theme pill label next to the pin */
  showThemeBadge?: boolean;
  className?: string;
}

/**
 * Clean & purposeful corner decoration for cards with gentle animation.
 * Streamlined to 1 primary sticker and a subtle mini pin to maintain breathing room and prevent visual clutter.
 */
export const CardStickerDecor: React.FC<CardStickerDecorProps> = ({
  preset,
  primaryPosition = 'top-right',
  size = 'md',
  className = '',
}) => {
  const primarySizeClass =
    size === 'lg'
      ? 'h-11 w-11 sm:h-12 sm:w-12'
      : size === 'sm'
      ? 'h-7 w-7 sm:h-8 sm:w-8'
      : 'h-9 w-9 sm:h-10 sm:w-10';

  const pinSizeClass =
    size === 'lg' ? 'h-4 w-4 sm:h-5 sm:w-5' : size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4';

  const primaryPosClass = {
    'top-right': 'right-3 top-3',
    'bottom-right': 'bottom-3 right-3',
    'top-left': 'left-3 top-3',
    'bottom-left': 'bottom-3 left-3',
  }[primaryPosition];

  const pinPosClass = {
    'top-right': 'right-11 top-2',
    'bottom-right': 'right-11 bottom-2.5',
    'top-left': 'left-11 top-2',
    'bottom-left': 'left-11 bottom-2.5',
  }[primaryPosition];

  return (
    <div
      className={`pointer-events-none select-none z-10 ${className}`}
      aria-hidden="true"
    >
      {/* Subtle soft glow accent behind the primary sticker */}
      <div
        className={`animate-pulse-glow absolute ${primaryPosClass} h-12 w-12 -translate-x-1 -translate-y-1 rounded-full opacity-25 blur-lg`}
        style={{
          background:
            'radial-gradient(circle, rgba(255, 192, 215, 0.6) 0%, transparent 70%)',
        }}
      />

      {/* Mini ribbon/bow pin */}
      <img
        src={preset.pin}
        alt=""
        className={`animate-wiggle-cute absolute ${pinPosClass} ${pinSizeClass} object-contain opacity-85 transition-transform duration-300 group-hover:scale-110`}
      />

      {/* Primary contextual sticker with smooth floating animation */}
      <img
        src={preset.primary}
        alt=""
        className={`animate-float-slow absolute ${primaryPosClass} ${primarySizeClass} object-contain opacity-90 drop-shadow-xs transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105`}
      />
    </div>
  );
};

interface SectionHeaderBannerDecorProps {
  leftMascot?: string;
  rightSweet?: string;
  topBow?: string;
}

/**
 * Clean & airy decorative header accent with soft pastel aura ("ฟุ้งๆ")
 * and a single tasteful mascot + bow pin that never crowds the title or buttons.
 */
export const SectionHeaderBannerDecor: React.FC<SectionHeaderBannerDecorProps> = ({
  leftMascot = SITE_DECORATIONS.mascots.bearPudding,
  topBow = SITE_DECORATIONS.bows.pinkBow,
}) => {
  return (
    <div className="pointer-events-none select-none z-0" aria-hidden="true">
      {/* Gentle pastel glow halo */}
      <div
        className="animate-pulse-glow absolute -right-6 -top-6 h-36 w-36 rounded-full opacity-35 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 196, 218, 0.7) 0%, rgba(235, 220, 255, 0.35) 55%, transparent 75%)',
        }}
      />

      {/* Top corner bow pin */}
      <img
        src={topBow}
        alt=""
        className="animate-wiggle-cute absolute right-3 top-2 h-7 w-7 object-contain opacity-90 drop-shadow-xs"
      />

      {/* Cute corner mascot */}
      <img
        src={leftMascot}
        alt=""
        className="animate-float-slow absolute right-11 top-1.5 hidden h-10 w-10 object-contain opacity-90 drop-shadow-xs md:block"
      />
    </div>
  );
};
