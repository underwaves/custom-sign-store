import React from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatTHB } from '@/utils/pricing';
import { SITE_DECORATIONS } from '@/data/siteDecorations';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  code?: string;
  subtitle?: string;
  description?: string;
  priceLabel?: string | number;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  code,
  subtitle,
  description,
  priceLabel,
  onSelect,
  isSelected,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card-pastel relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-brand-brown shadow-md transition hover:bg-brand-pink-light"
          aria-label="ปิดหน้าต่างดูภาพขนาดใหญ่"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex flex-1 items-center justify-center bg-brand-cream p-6">
          <img
            src={SITE_DECORATIONS.bows.pinkBow}
            alt=""
            className="pointer-events-none absolute left-4 top-4 h-8 w-8 -rotate-6 object-contain drop-shadow-xs"
          />
          <img
            src={SITE_DECORATIONS.sparkles.starBurst}
            alt=""
            className="pointer-events-none absolute bottom-4 right-4 h-7 w-7 object-contain opacity-80"
          />
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[68vh] w-auto rounded-2xl object-contain shadow-sm"
          />
        </div>

        <div className="relative flex w-full flex-col justify-between border-t border-[#F2E6DF] p-6 md:w-80 md:border-l md:border-t-0">
          <div className="space-y-3">
            {code && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-pink-light px-3 py-1 text-xs font-bold text-brand-pink-dark">
                <Sparkles className="h-3.5 w-3.5" /> รหัส {code}
                <img src={SITE_DECORATIONS.badges.stampSquare} alt="" className="h-3.5 w-3.5 object-contain" />
              </span>
            )}
            <h3 className="pr-8 text-xl font-bold text-brand-brown">{title}</h3>
            {subtitle && <p className="text-sm font-medium text-brand-brown-soft">{subtitle}</p>}
            {description && <p className="text-sm leading-relaxed text-brand-brown-soft">{description}</p>}

            {priceLabel !== undefined && (
              <div className="relative overflow-hidden rounded-2xl border border-[#EAD9CE] bg-brand-cream p-3.5 pr-12">
                <img
                  src={SITE_DECORATIONS.mascots.rabbitCute}
                  alt=""
                  className="pointer-events-none absolute bottom-1.5 right-2 h-11 w-11 object-contain"
                />
                <p className="text-xs text-brand-brown-soft">ราคาประเมินตามสไตล์</p>
                <p className="text-lg font-bold text-brand-pink-dark">
                  {typeof priceLabel === 'number' ? formatTHB(priceLabel) : priceLabel}
                </p>
                <p className="text-xs font-semibold text-emerald-700">+ ของตกแต่งพาสเทลฟรี 0 บาททุกชิ้น</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {onSelect && (
              <button
                type="button"
                onClick={() => {
                  onSelect();
                  onClose();
                }}
                className={
                  isSelected
                    ? 'inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white'
                    : 'btn-primary w-full'
                }
              >
                <CheckCircle2 className="h-5 w-5" />
                {isSelected ? 'เลือกเทมเพลตนี้แล้ว' : 'เลือกใช้เทมเพลตนี้'}
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary w-full">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
