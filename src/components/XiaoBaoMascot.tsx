import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MascotSkinId } from '../types';
import { speakChinese, soundEffects } from '../utils/audio';
import { Volume2, Sparkles } from 'lucide-react';

interface MascotProps {
  skin: MascotSkinId;
  mood?: 'happy' | 'cheering' | 'thinking' | 'talking' | 'sleepy';
  speechBubbleText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBubble?: boolean;
  interactive?: boolean;
  onBubbleClick?: () => void;
}

export const XiaoBaoMascot: React.FC<MascotProps> = ({
  skin = 'scholar',
  mood = 'happy',
  speechBubbleText = '你好！我是小宝，今天一起加油学中文吧！ (สวัสดี! เราคือเป่าเปา วันนี้มาตั้งใจเรียนจีนด้วยกันนะ)',
  size = 'md',
  showBubble = true,
  interactive = true,
  onBubbleClick,
}) => {
  const [isWaving, setIsWaving] = useState(false);

  const handleMascotClick = () => {
    if (!interactive) return;
    soundEffects.playClick();
    setIsWaving(true);
    speakChinese('你好！今天也要加油哦！');
    setTimeout(() => setIsWaving(false), 1200);
  };

  const sizeMap = {
    sm: { container: 'w-16 h-16', svgSize: 64, text: 'text-xs' },
    md: { container: 'w-28 h-28', svgSize: 112, text: 'text-sm' },
    lg: { container: 'w-40 h-40', svgSize: 160, text: 'text-base' },
    xl: { container: 'w-56 h-56', svgSize: 224, text: 'text-lg' },
  };

  // Color schemes for outfits
  const getSkinTheme = () => {
    switch (skin) {
      case 'chef':
        return { hat: '#FFFFFF', accent: '#F97316', robe: '#EA580C', label: 'เชฟติ่มซำ' };
      case 'dragon':
        return { hat: '#F59E0B', accent: '#EAB308', robe: '#B45309', label: 'มังกรทอง' };
      case 'cyberpunk':
        return { hat: '#06B6D4', accent: '#EC4899', robe: '#3B82F6', label: 'ไซเบอร์พังก์' };
      case 'tea_master':
        return { hat: '#10B981', accent: '#059669', robe: '#047857', label: 'ปรมาจารย์ชา' };
      case 'scholar':
      default:
        return { hat: '#1E293B', accent: '#E11D48', robe: '#BE123C', label: 'บัณฑิตน้อย' };
    }
  };

  const theme = getSkinTheme();

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Speech Bubble */}
      {showBubble && speechBubbleText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          onClick={onBubbleClick}
          className="mb-2.5 max-w-xs md:max-w-sm bg-white/95 backdrop-blur-md border-2 border-rose-200/80 shadow-lg shadow-rose-500/10 rounded-2xl px-4 py-2.5 text-slate-800 text-xs md:text-sm font-medium relative group cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </span>
            <div className="leading-snug">
              <p className="font-semibold text-rose-600 flex items-center gap-1.5">
                <span>น้องเป่าเปา 小宝</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakChinese('你好！今天一起加油学中文吧！');
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="ฟังเสียงเป่าเปา"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </p>
              <p className="text-slate-600 mt-0.5">{speechBubbleText}</p>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b-2 border-r-2 border-rose-200/80 group-hover:border-rose-400 transition-colors" />
        </motion.div>
      )}

      {/* Mascot Graphic Avatar */}
      <motion.div
        whileHover={interactive ? { scale: 1.06, rotate: [0, -3, 3, 0] } : {}}
        whileTap={interactive ? { scale: 0.92 } : {}}
        animate={isWaving ? { y: [0, -8, 0], rotate: [0, -8, 8, 0] } : { y: [0, -3, 0] }}
        transition={
          isWaving
            ? { duration: 0.6, repeat: 2 }
            : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
        onClick={handleMascotClick}
        className={`${sizeMap[size].container} relative cursor-pointer filter drop-shadow-md`}
        title="แตะที่เป่าเปาเพื่อฟังเสียงทักทาย!"
      >
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow */}
          <ellipse cx="80" cy="148" rx="45" ry="9" fill="rgba(0,0,0,0.12)" />

          {/* Red Panda / Little Dragon Ears */}
          <circle cx="44" cy="42" r="22" fill="#E11D48" />
          <circle cx="44" cy="42" r="13" fill="#FFF1F2" />
          <circle cx="116" cy="42" r="22" fill="#E11D48" />
          <circle cx="116" cy="42" r="13" fill="#FFF1F2" />

          {/* Dragon horns for dragon skin */}
          {skin === 'dragon' && (
            <g>
              <path d="M 40 38 Q 30 18 42 12 Q 52 24 48 38 Z" fill="#F59E0B" />
              <path d="M 120 38 Q 130 18 118 12 Q 108 24 112 38 Z" fill="#F59E0B" />
            </g>
          )}

          {/* Head */}
          <circle cx="80" cy="74" r="46" fill="#FB7185" />
          {/* Face Cream Patch */}
          <ellipse cx="80" cy="80" rx="38" ry="32" fill="#FFFBEB" />

          {/* Eyes */}
          {mood === 'sleepy' ? (
            <g stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M 60 76 Q 66 82 72 76" />
              <path d="M 88 76 Q 94 82 100 76" />
            </g>
          ) : mood === 'cheering' ? (
            <g stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M 58 76 Q 66 68 74 76" />
              <path d="M 86 76 Q 94 68 102 76" />
            </g>
          ) : (
            <g>
              {/* Left Eye */}
              <circle cx="65" cy="74" r="6" fill="#1E293B" />
              <circle cx="63" cy="71" r="2.2" fill="#FFFFFF" />
              {/* Right Eye */}
              <circle cx="95" cy="74" r="6" fill="#1E293B" />
              <circle cx="93" cy="71" r="2.2" fill="#FFFFFF" />
            </g>
          )}

          {/* Cute Blush */}
          <ellipse cx="53" cy="84" rx="7" ry="4" fill="#FDA4AF" opacity="0.8" />
          <ellipse cx="107" cy="84" rx="7" ry="4" fill="#FDA4AF" opacity="0.8" />

          {/* Cute Snout & Mouth */}
          <ellipse cx="80" cy="82" rx="4.5" ry="3" fill="#BE123C" />
          {mood === 'talking' || isWaving ? (
            <path
              d="M 74 88 Q 80 97 86 88 Z"
              fill="#E11D48"
              stroke="#BE123C"
              strokeWidth="1.5"
            />
          ) : (
            <path
              d="M 74 86 Q 80 91 86 86"
              stroke="#BE123C"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Outfit / Body */}
          <path
            d="M 52 110 Q 42 144 80 144 Q 118 144 108 110 Z"
            fill={theme.robe}
          />
          {/* Robe Collar Detail */}
          <path
            d="M 64 110 L 80 130 L 96 110"
            stroke="#FEF08A"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Chef Hat */}
          {skin === 'chef' && (
            <g>
              <ellipse cx="80" cy="38" rx="26" ry="12" fill="#FFFFFF" />
              <circle cx="66" cy="28" r="14" fill="#FFFFFF" />
              <circle cx="80" cy="24" r="16" fill="#FFFFFF" />
              <circle cx="94" cy="28" r="14" fill="#FFFFFF" />
              <rect x="62" y="36" width="36" height="8" rx="2" fill="#F97316" />
            </g>
          )}

          {/* Scholar Hat */}
          {skin === 'scholar' && (
            <g>
              <rect x="58" y="28" width="44" height="12" rx="3" fill="#1E293B" />
              <polygon points="80,18 52,28 80,32 108,28" fill="#0F172A" />
              {/* Golden Tassel */}
              <circle cx="80" cy="25" r="3" fill="#F59E0B" />
              <path d="M 80 25 Q 98 28 98 42" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
              <circle cx="98" cy="43" r="3" fill="#F59E0B" />
            </g>
          )}

          {/* Cyberpunk Visor */}
          {skin === 'cyberpunk' && (
            <g>
              <rect x="54" y="68" width="52" height="15" rx="5" fill="#06B6D4" opacity="0.9" />
              <line x1="58" y1="75" x2="102" y2="75" stroke="#EC4899" strokeWidth="2" />
            </g>
          )}

          {/* Tea Master Bamboo Hat */}
          {skin === 'tea_master' && (
            <g>
              <polygon points="80,18 42,38 118,38" fill="#10B981" />
              <polygon points="80,22 48,36 112,36" fill="#34D399" />
              <circle cx="80" cy="18" r="3" fill="#059669" />
            </g>
          )}

          {/* Hands */}
          <circle
            cx={isWaving ? '42' : '52'}
            cy={isWaving ? '96' : '118'}
            r="8"
            fill="#FB7185"
            stroke="#FFFBEB"
            strokeWidth="2"
          />
          <circle cx="108" cy="118" r="8" fill="#FB7185" stroke="#FFFBEB" strokeWidth="2" />
        </svg>
      </motion.div>
    </div>
  );
};
