import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { soundEffects } from '../utils/audio';
import { VantaLogo } from './VantaLogo';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Check,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  X,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenSyncModal?: () => void;
}

export const AuthRoleModal: React.FC<AuthRoleModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onOpenSyncModal,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(userProfile.role || 'student');
  const [userName, setUserName] = useState(userProfile.name || 'เพื่อนใหม่');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const roleOptions: {
    id: UserRole;
    title: string;
    zhTitle: string;
    desc: string;
    icon: string;
    accentColor: string;
    benefits: string[];
  }[] = [
    {
      id: 'teacher',
      title: 'ครู / ผู้สอน (Teacher)',
      zhTitle: '老师 (Lǎoshī)',
      desc: 'สำหรับอาจารย์หรือผู้สอนภาษาจีน สามารถสร้างห้องเรียน จัดการแข่งขันสด และควบคุมคำถามได้',
      icon: '👨‍🏫',
      accentColor: 'from-amber-500 to-rose-500 border-amber-300 text-amber-900 bg-amber-50/50',
      benefits: [
        'สร้างห้องแข่งขันออนไลน์ (Kahoot Style)',
        'กำหนดเวลาตอบข้อละ 10 - 60 วินาที',
        'สร้างห้อง Private พร้อมรหัสผ่าน & QR Code',
        'ดูสถิติและโพเดียมอันดับคะแนนของผู้เรียน',
      ],
    },
    {
      id: 'student',
      title: 'นักเรียน / ผู้เรียน (Student)',
      zhTitle: '学生 (Xuéshēng)',
      desc: 'สำหรับผู้เรียนในชั้นเรียน หรือผู้ที่ต้องการร่วมเล่นเกมตอบคำถามแข่งความเร็วกับเพื่อน',
      icon: '🎓',
      accentColor: 'from-blue-500 to-indigo-500 border-blue-300 text-blue-900 bg-blue-50/50',
      benefits: [
        'เข้าร่วมห้องเล่นด้วย Game PIN 6 หลัก',
        'ระบบคะแนนความเร็ว ยิ่งตอบเร็วยิ่งได้คะแนนสูง',
        'สะสมคะแนน Combo Streak ไฟลุก',
        'แข่งชิงอันดับ 1-3 บนโพเดียมเกียรติยศ',
      ],
    },
    {
      id: 'other',
      title: 'บุคคลทั่วไป / อื่นๆ (Self-Learner)',
      zhTitle: '自学者 (Zìxuézhě)',
      desc: 'สำหรับผู้สนใจทั่วไปที่เริ่มต้นเรียนภาษาจีนด้วยตนเอง มีอิสระในการใช้งานทุกโหมด',
      icon: '🌟',
      accentColor: 'from-emerald-500 to-teal-500 border-emerald-300 text-emerald-900 bg-emerald-50/50',
      benefits: [
        'ฝึกฝนคำศัพท์ คัดลายมือ และฝึกออกเสียง 4 วรรณยุกต์',
        'จำลองบทสนทนากับ AI เจ้าของภาษา',
        'สร้างห้องเล่นส่วนตัว หรือเข้าร่วมห้องสาธารณะได้อิสระ',
        'บันทึกสถิติและซิงค์ข้อมูลข้ามอุปกรณ์',
      ],
    },
  ];

  const handleSave = () => {
    soundEffects.playCorrect();
    confetti({ particleCount: 40, spread: 60 });
    onUpdateProfile({
      name: userName.trim() || 'เพื่อนใหม่',
      role: selectedRole,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-rose-100 max-h-[92vh] overflow-y-auto my-auto relative animate-in fade-in zoom-in-95 duration-200 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <VantaLogo size="md" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            ลงชื่อเข้าใช้ & เลือกบทบาทของคุณ
          </h2>
          <p className="text-xs text-slate-500">
            VANTA User Role & Classroom Identification
          </p>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-rose-500" />
            <span>ชื่อที่แสดงในระบบ / ในห้องแข่งขัน:</span>
          </label>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="เช่น ครูสมศรี, น้องเป้ HSK1, Xiao Ming"
            maxLength={25}
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-semibold text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Role selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            <span>เลือกบทบาทของคุณ (Role Selection):</span>
          </label>

          <div className="space-y-2.5">
            {roleOptions.map(r => {
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedRole(r.id);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? `border-rose-500 bg-rose-50/40 shadow-sm ring-2 ring-rose-500/10`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                        {r.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-800">{r.title}</h4>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-hanzi">
                            {r.zhTitle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
                      </div>
                    </div>

                    {/* Radio indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Highlights if selected */}
                  {isSelected && (
                    <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex flex-wrap gap-1.5 animate-in fade-in duration-150">
                      {r.benefits.map((b, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white border border-rose-200 text-[10px] font-semibold text-rose-700 flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-rose-500" />
                          <span>{b}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Social Link Quick Option */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              สถานะ: {userProfile.socialConnected !== 'none'
                ? `เชื่อมต่อกับ ${userProfile.socialConnected.toUpperCase()}`
                : 'ยังไม่ได้เชื่อมต่อโซเชียล'}
            </span>
          </div>

          {onOpenSyncModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSyncModal();
              }}
              className="font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
            >
              จัดการบัญชีโซเชียล
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={savedSuccess}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-80"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>บันทึกบทบาทเรียบร้อยแล้ว!</span>
              </>
            ) : (
              <>
                <span>ยืนยันบทบาท & เข้าสู่ระบบ</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
