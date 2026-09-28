import React, { useState } from 'react';
import { LeaderboardUser, UserProfile } from '../types';
import { INITIAL_LEADERBOARD } from '../data/learningData';
import { Trophy, Flame, Shield, ArrowUp, Crown, Sparkles, Clock } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface LeaderboardViewProps {
  userProfile: UserProfile;
}

const LEAGUES = [
  { name: 'Diamond', nameTh: 'ลีกเพชร (สูงสุด)', color: 'from-cyan-400 to-blue-600', icon: '💎' },
  { name: 'Jade', nameTh: 'ลีกหยกจักรพรรดิ', color: 'from-emerald-400 to-teal-600', icon: '🟢' },
  { name: 'Gold', nameTh: 'ลีกทองคำ', color: 'from-amber-400 to-yellow-600', icon: '🥇' },
  { name: 'Silver', nameTh: 'ลีกเงิน', color: 'from-slate-300 to-slate-500', icon: '🥈' },
  { name: 'Bronze', nameTh: 'ลีกทองแดง', color: 'from-amber-700 to-orange-800', icon: '🥉' },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ userProfile }) => {
  const [selectedLeague, setSelectedLeague] = useState<string>('Diamond');

  // Insert or update current user into leaderboard
  const list: LeaderboardUser[] = INITIAL_LEADERBOARD.map(u => {
    if (u.isUser) {
      return {
        ...u,
        name: `${userProfile.name} (คุณ)`,
        xp: userProfile.xp,
        streak: userProfile.streak,
      };
    }
    return u;
  }).sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-orange-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md inline-flex items-center gap-1.5 mb-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-300" />
              <span>การแข่งขันประจำสัปดาห์ (Weekly League)</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              ตารางจัดอันดับผู้เรียนยอดเยี่ยม
            </h2>
            <p className="text-xs md:text-sm text-amber-100 mt-1 max-w-md">
              สะสม XP จากการเรียนคำศัพท์ ทบทวนไวยากรณ์ และพูดคุยกับ AI เพื่อเลื่อนสู่ลีกถัดไปและรับเหรียญรางวัลพิเศษ!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center self-start md:self-auto min-w-[130px]">
            <span className="text-[11px] text-amber-200 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> รีเซ็ตในอีก
            </span>
            <p className="text-lg font-bold mt-0.5">2 วัน 14 ชม.</p>
          </div>
        </div>

        {/* Decorative background ornament */}
        <div className="absolute -right-8 -bottom-10 text-8xl opacity-15 select-none pointer-events-none">
          🏆
        </div>
      </div>

      {/* League Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs overflow-x-auto gap-1">
        {LEAGUES.map(league => (
          <button
            key={league.name}
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSelectedLeague(league.name);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              selectedLeague === league.name
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>{league.icon}</span>
            <span>{league.name}</span>
          </button>
        ))}
      </div>

      {/* Promotion Zone Hint */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUp className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>โซนเลื่อนชั้น (Promotion Zone):</strong> อันดับ 1-3 จะได้เลื่อนชั้นสู่ลีกถัดไป และรับเหรียญ <strong>+50 Coins</strong>!
          </span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {list.map((u, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const isUser = u.isUser;

            return (
              <div
                key={u.id}
                className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                  isUser
                    ? 'bg-rose-50/80 font-bold border-l-4 border-rose-500'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Left Rank & Avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-8 flex items-center justify-center font-bold text-sm">
                    {rank === 1 ? (
                      <span className="text-xl">🥇</span>
                    ) : rank === 2 ? (
                      <span className="text-xl">🥈</span>
                    ) : rank === 3 ? (
                      <span className="text-xl">🥉</span>
                    ) : (
                      <span className="text-slate-400">#{rank}</span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-100 to-rose-100 text-xl flex items-center justify-center shadow-xs">
                    {u.avatar}
                  </div>

                  <div>
                    <p className={`text-sm flex items-center gap-1.5 ${isUser ? 'text-rose-700' : 'text-slate-800'}`}>
                      <span>{u.name}</span>
                      {isUser && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                          ฉัน
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 font-normal">
                      {u.badge}
                    </p>
                  </div>
                </div>

                {/* Right Stats */}
                <div className="flex items-center gap-3 text-right">
                  <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{u.streak} วัน</span>
                  </div>

                  <div className="min-w-[70px]">
                    <span className="text-sm font-extrabold text-slate-800">{u.xp}</span>
                    <span className="text-[10px] text-slate-400 ml-1">XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
