import React, { useState } from 'react';
import { UserProfile, DailyQuest } from '../types';
import { VOCAB_DATABASE, GRAMMAR_DATABASE } from '../data/learningData';
import { XiaoBaoMascot } from './XiaoBaoMascot';
import { VantaLogo } from './VantaLogo';
import { soundEffects } from '../utils/audio';
import {
  Flame,
  Clock,
  BookOpen,
  CheckCircle2,
  Award,
  Bell,
  BellRing,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Zap,
  Shield,
  MessageSquare,
  PenTool,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  userProfile: UserProfile;
  onNavigateTab: (tab: 'vocab' | 'conversation' | 'multiplayer' | 'leaderboard' | 'shop', subTab?: string) => void;
  onOpenProfileSetup: () => void;
  onClaimQuest: (questId: string) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  onNavigateTab,
  onOpenProfileSetup,
  onClaimQuest,
  onUpdateProfile,
}) => {
  const [notificationTestSent, setNotificationTestSent] = useState(false);

  // Derived progress stats
  const totalVocabCount = VOCAB_DATABASE.length;
  const masteredVocabCount = userProfile.wordsMastered.length;
  const vocabPercent = Math.min(100, Math.round((masteredVocabCount / totalVocabCount) * 100));

  const totalGrammarCount = GRAMMAR_DATABASE.length;
  const masteredGrammarCount = userProfile.grammarMastered.length;

  const dailyGoalMinutes = userProfile.dailyGoalMinutes || 10;
  const todayMinutes = userProfile.todayMinutesLearned || 8;
  const timeProgressPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  // Request browser notification
  const handleToggleNotifications = async () => {
    soundEffects.playClick();
    if (!userProfile.remindersEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          onUpdateProfile({ remindersEnabled: true });
          new Notification('VANTA Chinese - แจ้งเตือนทบทวนบทเรียน', {
            body: `สวัสดีครับคุณ ${userProfile.name}! น้องเป่าเปาพร้อมพาคุณทบทวนคำศัพท์ภาษาจีนประจำวันแล้วนะ!`,
            icon: '/favicon.ico',
          });
          setNotificationTestSent(true);
          setTimeout(() => setNotificationTestSent(false), 4000);
        } else {
          onUpdateProfile({ remindersEnabled: true });
        }
      } else {
        onUpdateProfile({ remindersEnabled: true });
      }
    } else {
      onUpdateProfile({ remindersEnabled: false });
    }
  };

  const handleTestNotification = () => {
    soundEffects.playCorrect();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('VANTA Chinese - ถึงเวลาทบทวนภาษาจีนแล้ว!', {
        body: 'มีคำศัพท์ 4 คำรอให้คุณทบทวนเพื่อความจำระยะยาวครับ มาเริ่มกันเลย!',
      });
    }
    setNotificationTestSent(true);
    setTimeout(() => setNotificationTestSent(false), 4000);
  };

  const handleClaim = (quest: DailyQuest) => {
    if (!quest.completed) return;
    soundEffects.playCoin();
    confetti({ particleCount: 35, spread: 60 });
    onClaimQuest(quest.id);
  };

  // Personalized greeting based on age group
  const getGreetingText = () => {
    const name = userProfile.name;
    if (userProfile.ageGroup === 'kids') {
      return `สวัสดีคนเก่ง ${name}! วันนี้พร้อมผจญภัยกับภาษาจีนหรือยัง? 🐼`;
    }
    if (userProfile.ageGroup === 'teens') {
      return `ฮัลโหล ${name}! วันนี้มาลุยบทสนทนาและคำศัพท์ใหม่กันเลย ⚡`;
    }
    if (userProfile.ageGroup === 'seniors') {
      return `สวัสดีครับคุณ ${name} ยินดีที่ได้พบกันในการฝึกภาษาจีนวันนี้ครับ 🌿`;
    }
    return `ยินดีต้อนรับกลับมาครับคุณ ${name}! พร้อมฝึกฝนภาษาจีนวันนี้หรือยัง? ✨`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. HERO BANNER WITH MASCOT & DAILY STREAK */}
      <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <VantaLogo size="xs" />
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>แดชบอร์ดความก้าวหน้ารายวัน</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md">
                ระดับ: {userProfile.difficultyLevel.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={onOpenProfileSetup}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-400 text-amber-950 font-bold hover:bg-amber-300 transition-colors"
                title="แก้ไขอายุและระดับความยาก"
              >
                ปรับแต่งข้อมูล ⚙️
              </button>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {getGreetingText()}
            </h1>

            <p className="text-xs md:text-sm text-rose-100 max-w-lg leading-relaxed">
              เป้าหมายวันนี้: ฝึกฝนอย่างน้อย {dailyGoalMinutes} นาที เพื่อรักษาไฟ Streak และอัปเลเวลความสามารถภาษาจีน!
            </p>

            {/* Streak & Freeze Status */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <div className="px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
                <div>
                  <p className="text-[10px] text-rose-100 uppercase tracking-wider font-semibold">
                    Streak ต่อเนื่อง
                  </p>
                  <p className="text-base font-black">{userProfile.streak} วัน</p>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-300" />
                <div>
                  <p className="text-[10px] text-rose-100 uppercase tracking-wider font-semibold">
                    โล่ป้องกัน Streak
                  </p>
                  <p className="text-base font-black">{userProfile.streakFreezeCount} ครั้ง</p>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <div>
                  <p className="text-[10px] text-rose-100 uppercase tracking-wider font-semibold">
                    คะแนน XP
                  </p>
                  <p className="text-base font-black">{userProfile.xp} XP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Mascot Companion */}
          <div className="shrink-0 p-2">
            <XiaoBaoMascot
              skin={userProfile.equippedSkin}
              mood="cheering"
              speechBubbleText="ยินดีต้อนรับ! วันนี้มีคำศัพท์ใหม่ๆ รอให้เธอมาพิชิตอยู่นะ!"
              size="lg"
              showBubble={true}
            />
          </div>
        </div>

        {/* Background decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-amber-400/10 pointer-events-none" />
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's study time */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              เวลาเรียนวันนี้
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">{todayMinutes}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {dailyGoalMinutes} นาที</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${timeProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Words Mastered */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              คำศัพท์จำได้แม่น
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">{masteredVocabCount}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {totalVocabCount} คำ</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${vocabPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Grammar Mastery */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ไวยากรณ์ผ่านแล้ว
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">{masteredGrammarCount}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {totalGrammarCount} บท</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(masteredGrammarCount / totalGrammarCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Accuracy & Fluency */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ความแม่นยำเฉลี่ย
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">95%</span>
              <span className="text-xs text-emerald-600 font-bold">+4% จากสัปดาห์ก่อน</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              วรรณยุกต์ & ออกเสียง
            </p>
          </div>
        </div>
      </div>

      {/* 3. DAILY QUESTS & REWARD SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Quests */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>🎯</span>
                <span>ภารกิจประจำวัน (Daily Quests)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ทำภารกิจให้ครบเพื่อรับเหรียญรางวัลและคะแนนประสบการณ์พิเศษ
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">
              รีเซ็ตทุกเที่ยงคืน
            </span>
          </div>

          <div className="space-y-3">
            {userProfile.dailyQuests.map(quest => {
              const progressPct = Math.min(100, Math.round((quest.current / quest.target) * 100));
              return (
                <div
                  key={quest.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-[#FFFDF7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-200 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <p className="font-bold text-sm text-slate-800">{quest.titleTh}</p>
                      <span className="text-xs text-slate-400">
                        ({quest.current}/{quest.target})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          quest.completed ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward & Claim button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        +{quest.rewardCoins} เหรียญ
                      </span>
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        +{quest.rewardXp} XP
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (quest.completed) {
                          handleClaim(quest);
                        } else {
                          soundEffects.playClick();
                          if (quest.type === 'words') {
                            onNavigateTab('vocab', 'flashcard');
                          } else if (quest.type === 'stroke') {
                            onNavigateTab('vocab', 'order');
                          } else if (quest.type === 'conversation') {
                            onNavigateTab('conversation');
                          } else if (quest.type === 'quiz') {
                            onNavigateTab('multiplayer');
                          } else {
                            onNavigateTab('vocab', 'flashcard');
                          }
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        quest.completed
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 hover:border-rose-300'
                      }`}
                      title={quest.completed ? 'กดรับรางวัล XP และเหรียญ' : `ไปยังภารกิจ: ${quest.titleTh}`}
                    >
                      {quest.completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>กดรับรางวัล</span>
                        </>
                      ) : (
                        <>
                          <span>ไปยัง</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Review Reminders & Spaced Repetition */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-rose-500" />
                <span>การแจ้งเตือนทบทวนสม่ำเสมอ</span>
              </h3>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  userProfile.remindersEnabled ? 'bg-rose-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    userProfile.remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              ระบบทบทวนแบบเว้นระยะ (Spaced Repetition) จะแจ้งเตือนในเวลาที่คุณเลือก เพื่อไม่ให้ลืมคำศัพท์ที่เคยเรียน
            </p>

            {/* Time Picker */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-3 text-xs">
              <span className="font-semibold text-slate-600">เวลาแจ้งเตือนทุกวัน:</span>
              <input
                type="time"
                value={userProfile.reminderTime || '20:00'}
                onChange={e => onUpdateProfile({ reminderTime: e.target.value })}
                className="font-bold text-slate-800 bg-transparent focus:outline-none"
              />
            </div>

            {/* Test Notification Button */}
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>ทดสอบส่งการแจ้งเตือนตัวอย่าง</span>
            </button>

            {notificationTestSent && (
              <p className="text-[11px] text-emerald-600 text-center font-medium mt-1">
                ✓ ส่งการแจ้งเตือนสำเร็จแล้ว!
              </p>
            )}
          </div>

          {/* Quick Spaced Repetition SRS box */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200 text-amber-900">
            <p className="text-xs font-bold flex items-center gap-1.5 mb-1 text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ถึงเวลาทบทวน 4 คำศัพท์!</span>
            </p>
            <p className="text-[11px] text-amber-700 leading-relaxed mb-3">
              ตามหลักการจำของสมอง การทบทวนคำว่า <strong>你好, 谢谢, 多少钱</strong> วันนี้จะช่วยย้ายไปสู่ความจำระยะยาว
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('vocab')}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>เริ่มทบทวนทันที</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. QUICK SHORTCUT ACCESS TILES */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          ทางลัดเข้าสู่บทเรียนยอดนิยม (Quick Access)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => onNavigateTab('conversation')}
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                🧋
              </div>
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-rose-600 transition-colors">
                จำลองบทสนทนา AI
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                สั่งชานม ต่อราคาตลาด และถามทาง
              </p>
            </div>
            <div className="pt-3 flex items-center text-xs font-semibold text-rose-500 gap-1">
              <span>เริ่มคุย</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('vocab')}
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                📖
              </div>
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-rose-600 transition-colors">
                การ์ดจำคำศัพท์ HSK
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                พร้อมพินอินและเทคนิคช่วยจำ
              </p>
            </div>
            <div className="pt-3 flex items-center text-xs font-semibold text-amber-600 gap-1">
              <span>ดูคำศัพท์</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('vocab')}
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                ✍️
              </div>
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-rose-600 transition-colors">
                ฝึกเขียนตามลำดับขีด
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                กระดานตารางจีนโบราณ 米字格
              </p>
            </div>
            <div className="pt-3 flex items-center text-xs font-semibold text-emerald-600 gap-1">
              <span>ฝึกคัด</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('leaderboard')}
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                🏆
              </div>
              <h4 className="font-bold text-sm text-slate-800 group-hover:text-rose-600 transition-colors">
                ตารางลีกผู้เรียน
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                อันดับ {userProfile.name} ในลีกหยก
              </p>
            </div>
            <div className="pt-3 flex items-center text-xs font-semibold text-purple-600 gap-1">
              <span>ดูอันดับ</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
