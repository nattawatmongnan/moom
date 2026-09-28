import React, { useState, useEffect } from 'react';
import { UserProfile, DailyQuest } from './types';
import { INITIAL_DAILY_QUESTS } from './data/learningData';
import { DashboardView } from './components/DashboardView';
import { VocabStudyView } from './components/VocabStudyView';
import { ConversationView } from './components/ConversationView';
import { LeaderboardView } from './components/LeaderboardView';
import { ShopView } from './components/ShopView';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { SyncOfflineModal } from './components/SyncOfflineModal';
import { AuthRoleModal } from './components/AuthRoleModal';
import { MultiplayerArenaView } from './components/MultiplayerArenaView';
import { AudioControlBar } from './components/AudioControlBar';
import { VantaLogo } from './components/VantaLogo';
import { soundEffects } from './utils/audio';
import {
  Flame,
  Coins,
  Cloud,
  Settings,
  Sparkles,
  BookOpen,
  MessageSquare,
  Trophy,
  ShoppingBag,
  LayoutDashboard,
  Smartphone,
  Users,
} from 'lucide-react';

const STORAGE_KEY = 'vanta_chinese_user_profile_v1';

const DEFAULT_PROFILE: UserProfile = {
  name: 'เพื่อนใหม่',
  role: 'student',
  age: 20,
  ageGroup: 'young_adults',
  difficultyLevel: 'hsk1',
  dailyGoalMinutes: 10,
  interests: ['daily', 'food', 'travel'],
  streak: 5,
  lastActiveDate: new Date().toISOString().split('T')[0],
  xp: 820,
  level: 4,
  coins: 180,
  streakFreezeCount: 1,
  equippedSkin: 'scholar',
  unlockedSkins: ['scholar'],
  wordsMastered: ['v1', 'v2'],
  wordsReviewQueue: ['v3', 'v4'],
  grammarMastered: ['g1'],
  dailyQuests: INITIAL_DAILY_QUESTS,
  remindersEnabled: true,
  reminderTime: '20:00',
  todayMinutesLearned: 7,
  todayWordsLearned: 2,
  socialConnected: 'none',
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.role) parsed.role = 'student';
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load profile from storage', e);
    }
    return DEFAULT_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'vocab' | 'conversation' | 'multiplayer' | 'leaderboard' | 'shop'>('dashboard');
  const [vocabSubTab, setVocabSubTab] = useState<'flashcard' | 'order' | 'strokes' | 'grammar' | 'tones'>('flashcard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Failed to save profile to storage', e);
    }
  }, [userProfile]);

  // First time prompt check
  useEffect(() => {
    const hasLaunched = localStorage.getItem('vanta_chinese_launched');
    if (!hasLaunched) {
      setIsFirstLaunch(true);
      setIsProfileModalOpen(true);
      localStorage.setItem('vanta_chinese_launched', 'true');
    }
  }, []);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUserProfile(prev => ({
      ...prev,
      ...updated,
    }));
  };

  const handleEarnRewards = (earnedXp: number, earnedCoins: number) => {
    setUserProfile(prev => {
      const newXp = prev.xp + earnedXp;
      const newCoins = prev.coins + earnedCoins;
      const newLevel = Math.floor(newXp / 250) + 1;

      // Update quests progress
      const updatedQuests = prev.dailyQuests.map(q => {
        if (q.type === 'words' && !q.completed) {
          const current = Math.min(q.target, q.current + 1);
          return { ...q, current, completed: current >= q.target };
        }
        return q;
      });

      return {
        ...prev,
        xp: newXp,
        coins: newCoins,
        level: newLevel,
        dailyQuests: updatedQuests,
      };
    });
  };

  const handleMarkWordMastered = (wordId: string) => {
    setUserProfile(prev => {
      if (prev.wordsMastered.includes(wordId)) return prev;
      return {
        ...prev,
        wordsMastered: [...prev.wordsMastered, wordId],
        todayWordsLearned: prev.todayWordsLearned + 1,
      };
    });
  };

  const handleMarkGrammarMastered = (grammarId: string) => {
    setUserProfile(prev => {
      if (prev.grammarMastered.includes(grammarId)) return prev;
      return {
        ...prev,
        grammarMastered: [...prev.grammarMastered, grammarId],
      };
    });
  };

  const handleCompleteScenarioQuest = () => {
    setUserProfile(prev => {
      const updatedQuests = prev.dailyQuests.map(q => {
        if (q.type === 'conversation') {
          return { ...q, current: q.target, completed: true };
        }
        return q;
      });
      return {
        ...prev,
        dailyQuests: updatedQuests,
      };
    });
  };

  const handleClaimQuest = (questId: string) => {
    setUserProfile(prev => {
      const quest = prev.dailyQuests.find(q => q.id === questId);
      if (!quest || !quest.completed) return prev;

      const newQuests = prev.dailyQuests.filter(q => q.id !== questId);
      return {
        ...prev,
        coins: prev.coins + quest.rewardCoins,
        xp: prev.xp + quest.rewardXp,
        dailyQuests: newQuests,
      };
    });
  };

  const handleRestoreProfile = (imported: UserProfile) => {
    setUserProfile(imported);
    setIsSyncModalOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'vocab', label: 'คำศัพท์ & ไวยากรณ์', icon: BookOpen },
    { id: 'conversation', label: 'จำลองบทสนทนา AI', icon: MessageSquare },
    { id: 'multiplayer', label: 'ห้องแข่งออนไลน์', icon: Users },
    { id: 'leaderboard', label: 'อันดับผู้เล่น', icon: Trophy },
    { id: 'shop', label: 'ร้านค้าเหรียญ', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col selection:bg-rose-500 selection:text-white">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2.5">
          {/* Logo & Brand */}
          <div
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('dashboard');
            }}
            className="cursor-pointer select-none group hover:opacity-90 transition-opacity shrink-0"
          >
            <VantaLogo size="sm" withText={true} />
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab(item.id as any);
                  }}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 text-rose-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Top User Status & Quick Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Audio Control Bar (BGM Music & Sound Effects) */}
            <AudioControlBar />

            {/* User Role Badge & Sign In Trigger */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsRoleModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              title="ลงชื่อเข้าใช้ & เลือกบทบาท (ครู/นักเรียน/อื่นๆ)"
            >
              <span className="text-sm">
                {userProfile.role === 'teacher' ? '👨‍🏫' : userProfile.role === 'student' ? '🎓' : '🌟'}
              </span>
              <span className="hidden sm:inline max-w-[85px] truncate">
                {userProfile.role === 'teacher' ? 'ครู' : userProfile.role === 'student' ? 'นักเรียน' : 'ทั่วไป'}: {userProfile.name}
              </span>
            </button>

            {/* Streak */}
            <div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold"
              title={`Streak ต่อเนื่อง ${userProfile.streak} วัน`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{userProfile.streak}</span>
            </div>

            {/* Coins */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('shop');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-amber-800 border border-amber-300 text-xs font-extrabold transition-colors cursor-pointer"
              title="เหรียญรางวัลของคุณ (คลิกเพื่อเข้าร้านค้า)"
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span>{userProfile.coins}</span>
            </button>

            {/* Sync & Offline Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsSyncModalOpen(true);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="ซิงค์ข้อมูลข้ามอุปกรณ์ & โหมดออฟไลน์"
            >
              <Cloud className="w-4 h-4" />
            </button>

            {/* Profile Setup Trigger */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsProfileModalOpen(true);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="ตั้งค่าอายุและระดับความยาก"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            onNavigateTab={(tab, subTab) => {
              setActiveTab(tab as any);
              if (subTab) setVocabSubTab(subTab as any);
            }}
            onOpenProfileSetup={() => setIsProfileModalOpen(true)}
            onClaimQuest={handleClaimQuest}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'vocab' && (
          <VocabStudyView
            initialSubTab={vocabSubTab}
            masteredWordIds={userProfile.wordsMastered}
            masteredGrammarIds={userProfile.grammarMastered}
            onMarkWordMastered={handleMarkWordMastered}
            onMarkGrammarMastered={handleMarkGrammarMastered}
            onEarnRewards={handleEarnRewards}
          />
        )}

        {activeTab === 'conversation' && (
          <ConversationView
            userProfile={userProfile}
            onEarnRewards={handleEarnRewards}
            onCompleteScenarioQuest={handleCompleteScenarioQuest}
          />
        )}

        {activeTab === 'multiplayer' && (
          <MultiplayerArenaView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onOpenRoleModal={() => setIsRoleModalOpen(true)}
            onEarnRewards={handleEarnRewards}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView userProfile={userProfile} />
        )}

        {activeTab === 'shop' && (
          <ShopView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab(item.id as any);
              }}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition-all ${
                isActive ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] truncate max-w-[55px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sign In & User Role Modal */}
      <AuthRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Profile & Onboarding Setup Modal */}
      <ProfileSetupModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setIsFirstLaunch(false);
        }}
        currentProfile={userProfile}
        onSave={handleUpdateProfile}
        isInitialOnboarding={isFirstLaunch}
      />

      {/* Sync, Social Login & Offline Modal */}
      <SyncOfflineModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        onRestoreProfile={handleRestoreProfile}
      />
    </div>
  );
}
