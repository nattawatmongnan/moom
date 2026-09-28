import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, BellRing, BellOff, Sliders, ChevronDown } from 'lucide-react';
import { soundEffects, bgmPlayer } from '../utils/audio';

export const AudioControlBar: React.FC = () => {
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [isSfxEnabled, setIsSfxEnabled] = useState(soundEffects.isSfxEnabled());
  const [bgmVolume, setBgmVolume] = useState(bgmPlayer.getVolume());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleBgm = () => {
    soundEffects.playClick();
    const playing = bgmPlayer.toggle();
    setIsBgmPlaying(playing);
  };

  const handleToggleSfx = () => {
    const next = soundEffects.toggleSfx();
    setIsSfxEnabled(next);
    if (next) {
      soundEffects.playClick();
    }
  };

  const handleBgmVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBgmVolume(val);
    bgmPlayer.setVolume(val);
  };

  const isMutedOverall = !isBgmPlaying && !isSfxEnabled;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Audio Button */}
      <button
        type="button"
        onClick={() => {
          soundEffects.playClick();
          setIsOpen(!isOpen);
        }}
        className={`px-3 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer border ${
          isBgmPlaying
            ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs'
            : isSfxEnabled
            ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
            : 'bg-slate-100 text-slate-400 border-slate-200'
        }`}
        title="ตั้งค่าเสียงเพลงและเอฟเฟกต์"
      >
        {isBgmPlaying ? (
          <div className="flex items-center gap-1 text-rose-600">
            <Music className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">เพลงเปิดอยู่</span>
          </div>
        ) : isSfxEnabled ? (
          <div className="flex items-center gap-1 text-amber-600">
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">เสียงเปิด</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-slate-400">
            <VolumeX className="w-4 h-4" />
            <span className="hidden sm:inline">ปิดเสียง</span>
          </div>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Controls Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl p-4 shadow-xl border border-rose-100 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-rose-500" />
              <span>ระบบเสียง (Audio Controls)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">VANTA Sound</span>
          </div>

          {/* BGM Toggle & Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                    isBgmPlaying ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">เพลงประกอบ (BGM)</p>
                  <p className="text-[10px] text-slate-400">ดนตรีจีนร่วมสมัยผ่อนคลาย</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleBgm}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  isBgmPlaying
                    ? 'bg-rose-500 text-white shadow-xs shadow-rose-500/20'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isBgmPlaying ? 'เล่นอยู่' : 'ปิด'}
              </button>
            </div>

            {/* Volume slider for BGM */}
            {isBgmPlaying && (
              <div className="pl-9 pr-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgmVolume}
                  onChange={handleBgmVolumeChange}
                  className="w-full h-1.5 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>เบา</span>
                  <span>{Math.round(bgmVolume * 100)}%</span>
                  <span>ดัง</span>
                </div>
              </div>
            )}
          </div>

          {/* Sound Effects (SFX) Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                  isSfxEnabled ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isSfxEnabled ? <BellRing className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">เอฟเฟกต์เสียง (SFX)</p>
                <p className="text-[10px] text-slate-400">เสียงกด ถูก/ผิด และเสียงนับเวลา</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSfx}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                isSfxEnabled
                  ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {isSfxEnabled ? 'เปิด' : 'ปิด'}
            </button>
          </div>

          {/* Quick Action: Master Mute */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (!isMutedOverall) {
                  if (isBgmPlaying) bgmPlayer.stop();
                  soundEffects.setSfxEnabled(false);
                  setIsBgmPlaying(false);
                  setIsSfxEnabled(false);
                } else {
                  soundEffects.setSfxEnabled(true);
                  setIsSfxEnabled(true);
                  soundEffects.playClick();
                }
              }}
              className="w-full py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {!isMutedOverall ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                  <span>ปิดเสียงทั้งหมด (Mute All)</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เปิดเสียงทั้งหมด (Unmute)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
