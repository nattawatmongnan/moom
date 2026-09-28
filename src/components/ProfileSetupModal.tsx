import React, { useState } from 'react';
import { UserProfile, AgeGroup, DifficultyLevel } from '../types';
import { Sparkles, Check, Heart, BookOpen, Clock, Target, User } from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { VantaLogo } from './VantaLogo';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => void;
  isInitialOnboarding?: boolean;
}

const INTEREST_OPTIONS = [
  { id: 'daily', label: 'ชีวิตประจำวัน & ทักทาย', icon: '💬' },
  { id: 'food', label: 'อาหาร & สั่งชานม', icon: '🧋' },
  { id: 'travel', label: 'ท่องเที่ยว & ถามทาง', icon: '✈️' },
  { id: 'business', label: 'ทำงาน & ค้าขาย', icon: '💼' },
  { id: 'drama', label: 'ซีรีส์จีน & ไอดอล', icon: '🎬' },
  { id: 'hsk', label: 'เตรียมสอบ HSK', icon: '📝' },
];

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSave,
  isInitialOnboarding = false,
}) => {
  const [name, setName] = useState(currentProfile.name || 'เพื่อนใหม่');
  const [age, setAge] = useState<number>(currentProfile.age || 20);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(currentProfile.difficultyLevel || 'hsk1');
  const [dailyGoal, setDailyGoal] = useState<number>(currentProfile.dailyGoalMinutes || 10);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentProfile.interests.length > 0 ? currentProfile.interests : ['daily', 'food']
  );

  if (!isOpen) return null;

  // Derive age group
  const getAgeGroup = (ageNum: number): AgeGroup => {
    if (ageNum <= 12) return 'kids';
    if (ageNum <= 18) return 'teens';
    if (ageNum <= 35) return 'young_adults';
    if (ageNum <= 59) return 'adults';
    return 'seniors';
  };

  const getAgeGroupLabel = (ageNum: number) => {
    if (ageNum <= 12) return 'วัยเด็ก (เน้นคำศัพท์ง่าย สนุกสนาน ผ่านภาพและเสียง)';
    if (ageNum <= 18) return 'วัยรุ่น (เน้นสื่อสาร พูดคุย วัฒนธรรมป๊อป)';
    if (ageNum <= 35) return 'วัยเริ่มทำงาน (เน้นใช้จริง สนทนาคล่องแคล่ว)';
    if (ageNum <= 59) return 'วัยทำงาน/ผู้ใหญ่ (เน้นไวยากรณ์ การสื่อสารที่แม่นยำ)';
    return 'วัยเกษียณ/ผู้สูงอายุ (จังหวะเรียนสบาย ตัวอักษรชัดเจน จำง่าย)';
  };

  const toggleInterest = (id: string) => {
    soundEffects.playClick();
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playCorrect();

    const ageGroup = getAgeGroup(age);
    onSave({
      name: name.trim() || 'เพื่อนใหม่',
      age,
      ageGroup,
      difficultyLevel: difficulty,
      dailyGoalMinutes: dailyGoal,
      interests: selectedInterests,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-rose-100 max-h-[92vh] overflow-y-auto my-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <VantaLogo size="lg" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            {isInitialOnboarding ? 'ยินดีต้อนรับสู่ VANTA Chinese' : 'ปรับแต่งการเรียนรู้ของคุณ'}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            ระบุอายุและระดับความยาก เพื่อให้น้องเป่าเปาปรับหลักสูตรให้ตรงเป้าหมายของคุณที่สุด
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Age input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-500" />
                <span>ชื่อหรือชื่อเล่นของคุณ</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="เช่น บอม, มินนี่, ณัฐ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>อายุของผู้เรียน (ปี)</span>
              </label>
              <input
                type="number"
                min={5}
                max={99}
                required
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {/* Age Group Hint */}
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
            <span className="text-base">✨</span>
            <span>
              <strong>รูปแบบการสอนที่แนะนำ:</strong> {getAgeGroupLabel(age)}
            </span>
          </div>

          {/* Difficulty Level Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-rose-500" />
              <span>เลือกระดับความยากที่ต้องการ</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'beginner_zero', title: 'เริ่มต้นจากศูนย์', desc: 'ยังไม่มีพื้นฐานเลย ปูพินอินตั้งแต่ต้น' },
                { id: 'hsk1', title: 'ระดับ HSK 1 (พื้นฐาน)', desc: '150 คำ จำเป็นในชีวิตประจำวัน' },
                { id: 'hsk2', title: 'ระดับ HSK 2 (ประถมต้น)', desc: '300 คำ สื่อสารง่ายๆ ได้คล่อง' },
                { id: 'hsk3', title: 'ระดับ HSK 3 (ระดับกลาง)', desc: '600 คำ สนทนาหลากหลายสถานการณ์' },
              ].map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setDifficulty(lvl.id as DifficultyLevel);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    difficulty === lvl.id
                      ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">{lvl.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-500" />
              <span>หัวข้อและความสนใจที่คุณชอบ (เลือกได้หลายข้อ)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INTEREST_OPTIONS.map(item => {
                const active = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      active
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>เป้าหมายเวลาฝึกฝนต่อวัน</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setDailyGoal(mins);
                  }}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                    dailyGoal === mins
                      ? 'border-rose-500 bg-rose-50 text-rose-600 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {mins} นาที
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2 flex gap-2">
            {!isInitialOnboarding && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white text-sm font-bold shadow-lg shadow-rose-500/25 hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isInitialOnboarding ? 'เริ่มต้นเรียนรู้กับน้องเป่าเปา' : 'บันทึกการตั้งค่า'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
