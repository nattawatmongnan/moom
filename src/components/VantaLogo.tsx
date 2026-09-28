import React, { useState } from 'react';

interface VantaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withText?: boolean;
  textColor?: 'dark' | 'light';
}

export const VantaLogo: React.FC<VantaLogoProps> = ({
  size = 'md',
  className = '',
  withText = false,
  textColor = 'dark',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    xs: { icon: 'w-7 h-7 rounded-xl text-base', img: 28, text: 'text-sm' },
    sm: { icon: 'w-9 h-9 rounded-2xl text-lg', img: 36, text: 'text-base' },
    md: { icon: 'w-11 h-11 rounded-2xl text-xl', img: 44, text: 'text-lg' },
    lg: { icon: 'w-16 h-16 rounded-3xl text-3xl', img: 64, text: 'text-2xl' },
    xl: { icon: 'w-24 h-24 rounded-3xl text-5xl', img: 96, text: 'text-3xl' },
  };

  const selectedSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon Squircle */}
      <div
        className={`${selectedSize.icon} relative overflow-hidden shadow-md shadow-orange-500/20 flex items-center justify-center shrink-0 border border-orange-200/60 bg-[#FF6600]`}
      >
        {!imageError ? (
          <img
            src="/vanta-logo.png"
            alt="VANTA Chinese App Icon"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-[inherit]"
            onError={() => setImageError(true)}
          />
        ) : (
          /* High-fidelity Vector Fallback with exact easyappicon #ff6600 theme */
          <div className="w-full h-full bg-gradient-to-tr from-[#FF5500] via-[#FF6600] to-[#FF8800] flex items-center justify-center text-white font-black font-hanzi drop-shadow">
            万
          </div>
        )}
      </div>

      {/* Brand Text */}
      {withText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${
                textColor === 'light' ? 'text-white' : 'text-slate-800'
              } ${selectedSize.text}`}
            >
              VANTA
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 font-bold border border-rose-200/60">
              汉语
            </span>
          </div>
          <span
            className={`text-[10px] font-medium tracking-wide ${
              textColor === 'light' ? 'text-orange-100' : 'text-slate-400'
            }`}
          >
            เรียนภาษาจีนสำหรับผู้เริ่มต้น
          </span>
        </div>
      )}
    </div>
  );
};
