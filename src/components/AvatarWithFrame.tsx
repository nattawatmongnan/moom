import React from 'react';
import { AVATAR_FRAMES } from '../data/profileAndEventData';

interface AvatarWithFrameProps {
  avatarUrl?: string;
  frameId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

export const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  avatarUrl,
  frameId = 'frame_none',
  size = 'md',
  className = '',
  showBadge = true,
}) => {
  const frame = AVATAR_FRAMES.find((f) => f.id === frameId) || AVATAR_FRAMES[0];

  const sizeClasses = {
    xs: { box: 'w-7 h-7 text-sm', badge: 'text-[9px] -bottom-1 -right-1' },
    sm: { box: 'w-9 h-9 text-lg', badge: 'text-[11px] -bottom-1 -right-1' },
    md: { box: 'w-12 h-12 text-2xl', badge: 'text-sm -bottom-1.5 -right-1.5' },
    lg: { box: 'w-20 h-20 text-4xl', badge: 'text-lg -bottom-2 -right-2' },
    xl: { box: 'w-28 h-28 text-5xl', badge: 'text-2xl -bottom-2.5 -right-2.5' },
  }[size];

  const isImage = avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:image'));

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer Framed Avatar Circle */}
      <div
        className={`rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-rose-50 transition-all ${
          sizeClasses.box
        } ${frame.borderClass} ${frame.glowClass}`}
      >
        {isImage ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="select-none">{avatarUrl || '🥟'}</span>
        )}
      </div>

      {/* Frame Badge Emoji (e.g. 🏮, 🐉, 👑, 🌸, 🥮) */}
      {showBadge && frame.badge && (
        <span
          className={`absolute ${sizeClasses.badge} select-none drop-shadow-md z-10 animate-bounce duration-1000`}
          title={frame.nameTh}
        >
          {frame.badge}
        </span>
      )}
    </div>
  );
};
