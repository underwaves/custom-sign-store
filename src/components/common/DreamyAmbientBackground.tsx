import React from 'react';
import { SITE_DECORATIONS } from '@/data/siteDecorations';

/**
 * Dreamy ambient background layer ("ฟุ้งๆ" soft pastel aura + gentle floating accents).
 * Fixed behind the storefront content with pointer-events-none so it never blocks clicks.
 */
export const DreamyAmbientBackground: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Ultra-soft blurred pastel aura blobs ("แสงฟุ้งพาสเทลแบบโปร่งเบา") */}
      <div
        className="animate-blob-drift absolute -left-24 -top-20 h-96 w-96 rounded-full opacity-35 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 198, 219, 0.6) 0%, rgba(255, 228, 238, 0.25) 55%, transparent 75%)',
        }}
      />
      <div
        className="animate-blob-drift-delayed absolute -right-24 top-16 h-[26rem] w-[26rem] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 218, 193, 0.55) 0%, rgba(235, 224, 255, 0.3) 55%, transparent 75%)',
        }}
      />
      <div
        className="animate-blob-drift absolute -bottom-24 left-10 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(234, 222, 255, 0.55) 0%, rgba(255, 214, 230, 0.25) 58%, transparent 75%)',
        }}
      />

      {/* 2. Soft floating pastel clouds along viewport outer edges (subtle & unobtrusive) */}
      <img
        src={SITE_DECORATIONS.sparkles.skyCloudLarge}
        alt=""
        className="animate-float-slow absolute left-6 top-32 hidden h-10 w-10 object-contain opacity-30 xl:block"
      />
      <img
        src={SITE_DECORATIONS.sparkles.mintSparkleCluster}
        alt=""
        className="animate-twinkle absolute right-8 top-40 hidden h-8 w-8 object-contain opacity-35 lg:block"
      />
      <img
        src={SITE_DECORATIONS.sparkles.skyCloudMedium}
        alt=""
        className="animate-float-slow absolute right-10 bottom-32 hidden h-9 w-9 object-contain opacity-30 xl:block"
      />
    </div>
  );
};
