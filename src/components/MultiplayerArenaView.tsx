import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  UserRole,
  GameRoom,
  RoomQuestion,
  RoomPlayer,
  GameMode,
  TimePerQuestion,
} from '../types';
import { soundEffects, speakChinese } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Users,
  Play,
  Copy,
  Check,
  Lock,
  Globe,
  Clock,
  Sparkles,
  Flame,
  Award,
  Trophy,
  ArrowRight,
  RotateCcw,
  Volume2,
  QrCode,
  Share2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Crown,
  KeyRound,
  LogIn,
} from 'lucide-react';

interface MultiplayerArenaViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenRoleModal: () => void;
  onEarnRewards: (xp: number, coins: number) => void;
}

export const MultiplayerArenaView: React.FC<MultiplayerArenaViewProps> = ({
  userProfile,
  onUpdateProfile,
  onOpenRoleModal,
  onEarnRewards,
}) => {
  // Screen state
  const [activeView, setActiveView] = useState<'hub' | 'create' | 'join' | 'room'>('hub');
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Create room state
  const [createTitle, setCreateTitle] = useState(`${userProfile.name}'s Arena`);
  const [createMode, setCreateMode] = useState<GameMode>('mixed');
  const [createTime, setCreateTime] = useState<TimePerQuestion>(20);
  const [createQuestionCount, setCreateQuestionCount] = useState<number>(5);
  const [createIsPrivate, setCreateIsPrivate] = useState(false);
  const [createPassword, setCreatePassword] = useState('');

  // Join room state
  const [joinPin, setJoinPin] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinNickname, setJoinNickname] = useState(userProfile.name || 'เพื่อนใหม่');

  // In-Game state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const timerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load public rooms on mount
  useEffect(() => {
    fetchPublicRooms();
    const interval = setInterval(fetchPublicRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check URL query param for join code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get('join');
      if (joinParam && joinParam.length === 6) {
        setJoinPin(joinParam);
        setActiveView('join');
      }
    }
  }, []);

  const fetchPublicRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data);
      }
    } catch (e) {
      console.warn('Failed to fetch rooms', e);
    }
  };

  // Connect WebSocket to room
  const connectToRoomSocket = (roomId: string, pin: string, isHost: boolean) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          roomId,
          pin,
          player: {
            id: userProfile.name + '_' + (isHost ? 'host' : Date.now().toString(36)),
            name: joinNickname.trim() || userProfile.name,
            avatar: userProfile.role === 'teacher' ? '👨‍🏫' : '🎓',
            role: userProfile.role,
            isHost,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ROOM_UPDATE') {
          const room: GameRoom = data.room;
          setCurrentRoom(room);
          setActiveView('room');

          // Sound triggers based on room status
          if (room.status === 'question' && room.currentQuestionIndex === 0 && !timerRef.current) {
            soundEffects.playCountdown(0);
          } else if (room.status === 'finished') {
            soundEffects.playVictoryFanfare();
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
            onEarnRewards(60, 15);
          }
        } else if (data.type === 'ERROR') {
          setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
      } catch (e) {
        console.warn('WS parse error', e);
      }
    };

    ws.onerror = (e) => {
      console.warn('WS error', e);
    };
  };

  // Timer countdown hook for question stage
  useEffect(() => {
    if (!currentRoom || currentRoom.status !== 'question') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Reset selection for new question
    setSelectedOptionId(null);
    setTimeLeft(currentRoom.timePerQuestion);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;

          // Time's up sound
          soundEffects.playWrong();

          // Auto-submit if not answered
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'SUBMIT_ANSWER',
                roomId: currentRoom.id,
                playerId: userProfile.name + '_player',
                optionId: 'TIMEOUT',
                timeRemainingSeconds: 0,
              })
            );
          }
          return 0;
        }

        // Timer ticking sound
        if (prev <= 6) {
          soundEffects.playTimerTick(true);
        } else if (prev % 2 === 0) {
          soundEffects.playTimerTick(false);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentRoom?.status, currentRoom?.currentQuestionIndex]);

  // Handle Create Room
  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    soundEffects.playClick();

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          hostId: userProfile.name + '_host',
          hostName: userProfile.name,
          role: userProfile.role,
          isPrivate: createIsPrivate,
          password: createIsPrivate ? createPassword : '',
          mode: createMode,
          timePerQuestion: createTime,
          questionCount: createQuestionCount,
          difficulty: 'mixed',
        }),
      });

      if (!res.ok) throw new Error('ไม่สามารถสร้างห้องได้');
      const room: GameRoom = await res.json();
      setCurrentRoom(room);
      connectToRoomSocket(room.id, room.pin, true);
    } catch (e: any) {
      setErrorMsg(e.message || 'เกิดข้อผิดพลาดในการสร้างห้อง');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async (overridePin?: string) => {
    const targetPin = overridePin || joinPin;
    if (!targetPin || targetPin.trim().length < 6) {
      setErrorMsg('กรุณากรอกรหัส Game PIN 6 หลักให้ครบถ้วน');
      return;
    }

    setIsConnecting(true);
    setErrorMsg(null);
    soundEffects.playClick();

    try {
      const verifyRes = await fetch('/api/rooms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: targetPin.trim(),
          password: joinPassword,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'ไม่สามารถเข้าร่วมห้องได้');
      }

      connectToRoomSocket(verifyData.room.id, targetPin.trim(), false);
    } catch (e: any) {
      setErrorMsg(e.message || 'รหัสห้องไม่ถูกต้อง หรือรหัสผ่านไม่ตรงกัน');
    } finally {
      setIsConnecting(false);
    }
  };

  // Submit Answer
  const handleSelectOption = (optionId: string) => {
    if (selectedOptionId || !currentRoom || currentRoom.status !== 'question') return;

    setSelectedOptionId(optionId);
    soundEffects.playClick();

    const currentQ = currentRoom.questions[currentRoom.currentQuestionIndex];
    const isCorrect = currentQ && currentQ.correctOptionId === optionId;

    if (isCorrect) {
      soundEffects.playCorrect();
      soundEffects.playStreakFlame();
    } else {
      soundEffects.playWrong();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SUBMIT_ANSWER',
          roomId: currentRoom.id,
          playerId: userProfile.name + '_' + (currentRoom.hostName === userProfile.name ? 'host' : 'player'),
          optionId,
          timeRemainingSeconds: timeLeft,
        })
      );
    }
  };

  // Host: Start Game
  const handleHostStartGame = () => {
    if (!currentRoom || !wsRef.current) return;
    soundEffects.playCountdown(3);
    wsRef.current.send(
      JSON.stringify({
        type: 'START_GAME',
        roomId: currentRoom.id,
      })
    );
  };

  // Host: Next Question
  const handleHostNextQuestion = () => {
    if (!currentRoom || !wsRef.current) return;
    soundEffects.playClick();
    wsRef.current.send(
      JSON.stringify({
        type: 'NEXT_QUESTION',
        roomId: currentRoom.id,
      })
    );
  };

  // Host: Show Leaderboard
  const handleHostShowLeaderboard = () => {
    if (!currentRoom || !wsRef.current) return;
    soundEffects.playClick();
    wsRef.current.send(
      JSON.stringify({
        type: 'SHOW_LEADERBOARD',
        roomId: currentRoom.id,
      })
    );
  };

  // Host: Play Again
  const handleHostRestart = () => {
    if (!currentRoom || !wsRef.current) return;
    soundEffects.playClick();
    wsRef.current.send(
      JSON.stringify({
        type: 'RESTART_GAME',
        roomId: currentRoom.id,
      })
    );
  };

  const handleCopyLink = () => {
    if (!currentRoom) return;
    soundEffects.playClick();
    navigator.clipboard.writeText(currentRoom.inviteUrl || window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = () => {
    if (!currentRoom) return;
    soundEffects.playClick();
    navigator.clipboard.writeText(currentRoom.pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // Current Question
  const currentQuestion: RoomQuestion | undefined =
    currentRoom && currentRoom.questions ? currentRoom.questions[currentRoom.currentQuestionIndex] : undefined;

  // Sorted Leaderboard
  const sortedPlayers = currentRoom
    ? [...currentRoom.players].sort((a, b) => b.score - a.score)
    : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Role Banner & Mode Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>VANTA Live Classroom (Kahoot & Blooket Style)</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-400 text-slate-900 flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-600 fill-red-600" />
                <span>แข่งสดออนไลน์</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              ห้องเรียนแข่งขันภาษาจีนออนไลน์
            </h1>
            <p className="text-xs md:text-sm text-blue-100 max-w-xl">
              สร้างห้องเรียนตอบคำถามแข่งความเร็วแบบเรียลไทม์ เลือกระยะเวลาต่อข้อ 10-60 วินาที
              รองรับห้องส่วนตัวด้วย QR Code & รหัสผ่าน ชิงแชมป์บนโพเดียมเกียรติยศ!
            </p>
          </div>

          {/* User Role Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-800 flex items-center justify-center text-2xl shadow-md font-bold">
              {userProfile.role === 'teacher' ? '👨‍🏫' : userProfile.role === 'student' ? '🎓' : '🌟'}
            </div>
            <div className="text-left">
              <p className="text-xs text-blue-200 font-medium">บทบาทของคุณ</p>
              <p className="text-sm font-extrabold text-white">
                {userProfile.role === 'teacher'
                  ? 'ครู / ผู้สอน'
                  : userProfile.role === 'student'
                  ? 'นักเรียน'
                  : 'บุคคลทั่วไป'}
              </p>
              <button
                type="button"
                onClick={onOpenRoleModal}
                className="text-[11px] text-yellow-300 hover:text-yellow-200 underline font-bold mt-0.5 cursor-pointer"
              >
                เปลี่ยนบทบาท
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-xs text-rose-500 hover:underline">
            ปิด
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HUB VIEW: Options to Create, Join, or browse Public Rooms */}
      {/* ========================================================= */}
      {activeView === 'hub' && (
        <div className="space-y-6">
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Room Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl shadow-xs">
                  👨‍🏫
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  สร้างห้องแข่งขันใหม่ (Host Game)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  สำหรับคุณครูหรือหัวหน้าห้อง เลือกโหมดเติมคำ, คำแปล, พินอิน และกำหนดเวลาตอบข้อละ 10-60 วินาที
                  พร้อมระบบ QR Code และรหัสห้อง Private
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setActiveView('create');
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>ตั้งค่า & สร้างห้องแข่งขัน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Join Room by PIN Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shadow-xs">
                  🎯
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  เข้าร่วมห้องด้วยรหัส Game PIN
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  มีรหัส 6 หลักจากคุณครูหรือเพื่อนใช่ไหม? กรอกรหัส Game PIN ด้านล่างเพื่อเข้าร่วมแข่งขันทันที!
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="PIN 6 หลัก เช่น 849201"
                    maxLength={6}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-center font-mono font-extrabold text-base tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleJoinRoom()}
                    disabled={isConnecting || joinPin.length < 6}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>เข้าร่วม</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Public Rooms list */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  ห้องแข่งขันสาธารณะที่เปิดอยู่ขณะนี้ ({publicRooms.length} ห้อง)
                </h3>
              </div>
              <button
                type="button"
                onClick={fetchPublicRooms}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเฟรช</span>
              </button>
            </div>

            {publicRooms.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">ยังไม่มีห้องสาธารณะที่เปิดอยู่</p>
                <p className="text-[11px] text-slate-400">
                  คุณสามารถเป็นผู้สร้างห้องคนแรกแล้วชวนเพื่อนๆ มาร่วมสนุกได้เลย!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {publicRooms.map((rm) => (
                  <div
                    key={rm.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          PIN: {rm.pin}
                        </span>
                        <h4 className="font-bold text-xs text-slate-800">{rm.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        ผู้สร้าง: {rm.hostName} • โหมด:{' '}
                        {rm.mode === 'fill_blank'
                          ? 'เติมคำ'
                          : rm.mode === 'translation'
                          ? 'คำแปล'
                          : rm.mode === 'pinyin_match'
                          ? 'พินอิน'
                          : 'รวมทุกโหมด'}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" /> ข้อละ {rm.timePerQuestion} วินาที
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-500" /> {rm.playerCount} ผู้เล่น
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleJoinRoom(rm.pin)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      เข้าร่วม
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CREATE ROOM VIEW: Settings, Modes, Timer (10,15,20,30,45,60s), Private & QR */}
      {/* ========================================================= */}
      {activeView === 'create' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>ตั้งค่าห้องแข่งขันใหม่ (Create Game Room)</span>
              </h2>
              <p className="text-xs text-slate-500">
                ปรับแต่งโหมดการแข่งขัน, เวลาตอบแต่ละข้อ และระดับความเป็นส่วนตัว
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('hub')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ย้อนกลับ
            </button>
          </div>

          <div className="space-y-5 text-xs">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">ชื่อห้องเรียน / ห้องแข่งขัน:</label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="เช่น ห้องเรียนจีน ม.4, Quiz ชานม HSK1"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm font-semibold text-slate-800"
              />
            </div>

            {/* Game Mode */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700">เลือกโหมดคำถาม (Game Mode):</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'fill_blank',
                    title: 'เติมคำในช่องว่าง',
                    desc: 'เลือกลักษณนามและคำศัพท์เติมในประโยค',
                    icon: '🧩',
                  },
                  {
                    id: 'translation',
                    title: 'เลือกคำแปลที่ถูกต้อง',
                    desc: 'ทายความหมายประโยคและคำสั่งภาษาจีน',
                    icon: '📖',
                  },
                  {
                    id: 'pinyin_match',
                    title: 'จับคู่อักษรจีน & พินอิน',
                    desc: 'จับคู่ตัวอักษรจีนกับเสียงอ่านพินอิน',
                    icon: '🀄',
                  },
                  {
                    id: 'mixed',
                    title: 'รวมทุกโหมด (Mixed)',
                    desc: 'สุ่มคำถามหลากหลายรูปแบบเพื่อความสนุกสูงสุด',
                    icon: '🎲',
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setCreateMode(m.id as GameMode);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      createMode === m.id
                        ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{m.icon}</span>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{m.title}</p>
                        <p className="text-[11px] text-slate-500">{m.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Per Question (10, 15, 20, 30, 45, 60 วินาที) */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>เวลาในการตอบแต่ละข้อ (Time Limit Per Question):</span>
                </span>
                <span className="text-rose-600 font-extrabold">{createTime} วินาที</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {([10, 15, 20, 30, 45, 60] as TimePerQuestion[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setCreateTime(t);
                    }}
                    className={`py-2.5 rounded-2xl border text-center font-bold font-mono transition-all cursor-pointer ${
                      createTime === t
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    {t} วิ
                  </button>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700">จำนวนคำถามในเกม:</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setCreateQuestionCount(c);
                    }}
                    className={`flex-1 py-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      createQuestionCount === c
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-slate-200 text-slate-700 bg-white'
                    }`}
                  >
                    {c} ข้อ
                  </button>
                ))}
              </div>
            </div>

            {/* Room Privacy (Public vs Private with Password & QR) */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    {createIsPrivate ? <Lock className="w-4 h-4 text-rose-500" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                    <span>ระดับความเป็นส่วนตัวของห้อง</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {createIsPrivate
                      ? 'ห้องส่วนตัว: ผู้เล่นต้องกรอกรหัสผ่าน หรือสแกน QR Code เพื่อเข้าห้อง'
                      : 'ห้องสาธารณะ: แสดงในรายชื่อห้องแข่งขัน ผู้เล่นทั่วไปเข้าร่วมได้ทันที'}
                  </p>
                </div>

                <div className="flex bg-slate-200 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCreateIsPrivate(false)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      !createIsPrivate ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    สาธารณะ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateIsPrivate(true)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      createIsPrivate ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    ส่วนตัว (Private)
                  </button>
                </div>
              </div>

              {/* Private Room Password */}
              {createIsPrivate && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5 animate-in fade-in">
                  <label className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                    <span>ตั้งรหัสผ่านเข้าห้อง (Room Password):</span>
                  </label>
                  <input
                    type="password"
                    placeholder="เช่น 1234 หรือ wan-da"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-xs font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">
                    ระบบจะสร้าง QR Code และลิ้งก์เชิญอัตโนมัติเมื่อห้องถูกสร้าง
                  </p>
                </div>
              )}
            </div>

            {/* Action Submit Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isConnecting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>เปิดห้องแข่งขันทันที (Launch Arena)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. JOIN VIEW: Dedicated PIN & Password Screen */}
      {/* ========================================================= */}
      {activeView === 'join' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-blue-100 shadow-sm max-w-md mx-auto space-y-5 animate-in fade-in">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto shadow-xs">
              🎯
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              เข้าร่วมห้องแข่งขัน
            </h2>
            <p className="text-xs text-slate-500">กรอก Game PIN 6 หลักจากหน้าจอโฮสต์</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">ชื่อของคุณในเกม:</label>
              <input
                type="text"
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Game PIN (6 หลัก):</label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-2xl border-2 border-blue-300 text-center font-mono font-black text-2xl tracking-widest text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">รหัสผ่านห้อง (เฉพาะห้อง Private):</label>
              <input
                type="password"
                placeholder="เว้นว่างไว้หากเป็นห้องสาธารณะ"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => handleJoinRoom()}
              disabled={isConnecting || joinPin.length < 6}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าห้องแข่งขัน</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('hub')}
              className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ย้อนกลับหน้าหลัก
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ACTIVE ROOM VIEW: Lobby, Questions, Feedback, Podium */}
      {/* ========================================================= */}
      {activeView === 'room' && currentRoom && (
        <div className="space-y-6">
          {/* LOBBY STAGE */}
          {currentRoom.status === 'lobby' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              {/* Room Banner */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      {currentRoom.isPrivate ? '🔒 ห้องส่วนตัว (Private)' : '🌐 ห้องสาธารณะ'}
                    </span>
                    <span className="text-xs text-slate-400">
                      ข้อละ {currentRoom.timePerQuestion} วิ • ทั้งหมด {currentRoom.totalQuestions} ข้อ
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">{currentRoom.title}</h2>
                  <p className="text-xs text-slate-500">โฮสต์: {currentRoom.hostName}</p>
                </div>

                {/* Big Game PIN Card */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white text-center shadow-lg min-w-[200px] space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    GAME PIN สำหรับเข้าร่วม
                  </p>
                  <p className="text-3xl font-black font-mono tracking-widest text-yellow-400">
                    {currentRoom.pin}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 mx-auto font-medium"
                  >
                    {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPin ? 'คัดลอก PIN แล้ว' : 'คัดลอกรหัส PIN'}</span>
                  </button>
                </div>
              </div>

              {/* Private Room QR Code & Invite Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {currentRoom.qrCodeUrl && (
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                      <img src={currentRoom.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="font-extrabold text-slate-800 flex items-center gap-1">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        <span>สแกน QR Code เข้าห้อง</span>
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        ผู้เรียนสามารถใช้กล้องมือถือสแกนเพื่อเข้าสู่ห้องนี้ได้ทันทีโดยไม่ต้องพิมพ์รหัส!
                      </p>
                      {currentRoom.isPrivate && currentRoom.password && (
                        <p className="text-[11px] font-bold text-rose-600">
                          รหัสผ่านห้อง: {currentRoom.password}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-slate-700 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>ลิ้งก์เชิญเพื่อน (Invite Link):</span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentRoom.inviteUrl || ''}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Joined Players List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>ผู้เล่นที่เข้าร่วมแล้ว ({currentRoom.players.length} คน):</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-medium">รอผู้จัดเริ่มเกม...</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentRoom.players.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5 animate-in zoom-in-95 duration-150"
                    >
                      <span className="text-2xl">{p.avatar || '🎓'}</span>
                      <div className="overflow-hidden">
                        <p className="font-bold text-xs text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {p.isHost ? '👑 โฮสต์' : 'ผู้เล่น'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Host Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (wsRef.current) wsRef.current.close();
                    setCurrentRoom(null);
                    setActiveView('hub');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold"
                >
                  ออกจากห้อง
                </button>

                {currentRoom.players.some((p) => p.name === userProfile.name && p.isHost) ? (
                  <button
                    type="button"
                    onClick={handleHostStartGame}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-black text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>เริ่มการแข่งขัน (Start Game)</span>
                  </button>
                ) : (
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span>กำลังรอคุณครูหรือโฮสต์กดเริ่มเกม...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* QUESTION STAGE (Kahoot / Blooket Speed Question View) */}
          {/* ========================================================= */}
          {currentRoom.status === 'question' && currentQuestion && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-md space-y-6 animate-in zoom-in-95">
              {/* Question Header & Timer Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    คำถามข้อที่ {currentRoom.currentQuestionIndex + 1} จาก {currentRoom.totalQuestions}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="font-mono text-base font-black">{timeLeft} วินาที</span>
                  </div>
                </div>

                {/* Animated progress bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timeLeft > 10 ? 'bg-emerald-500' : timeLeft > 5 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                    }`}
                    style={{
                      width: `${(timeLeft / (currentRoom.timePerQuestion || 20)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white text-center shadow-lg space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold text-amber-300">
                    {currentQuestion.type === 'fill_blank'
                      ? '🧩 เติมคำในช่องว่าง'
                      : currentQuestion.type === 'translation'
                      ? '📖 เลือกคำแปลที่ถูกต้อง'
                      : '🀄 จับคู่พินอิน'}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakChinese(currentQuestion.questionZh)}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                    title="ฟังเสียงอ่านภาษาจีน"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-2xl md:text-4xl font-black font-hanzi tracking-wide text-white leading-relaxed">
                  {currentQuestion.questionZh}
                </h3>
                <p className="text-sm font-mono text-rose-300">{currentQuestion.questionPinyin}</p>
                <p className="text-xs md:text-sm text-slate-300 font-medium">{currentQuestion.questionTh}</p>
              </div>

              {/* 4 Kahoot-Style Colorful Answer Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  const shapes = ['🔺', '🔷', '🟡', '🟩'];
                  const colorStyles = [
                    'bg-rose-600 hover:bg-rose-700 text-white border-rose-700',
                    'bg-blue-600 hover:bg-blue-700 text-white border-blue-700',
                    'bg-amber-500 hover:bg-amber-600 text-white border-amber-600',
                    'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
                  ];

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={Boolean(selectedOptionId) || timeLeft === 0}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-5 rounded-2xl text-left border-b-4 font-bold text-sm md:text-base transition-all transform flex items-center justify-between cursor-pointer ${
                        colorStyles[idx % 4]
                      } ${isSelected ? 'ring-4 ring-white ring-offset-2 scale-[1.02] shadow-lg' : ''} ${
                        selectedOptionId && !isSelected ? 'opacity-50' : 'hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{shapes[idx % 4]}</span>
                        <div>
                          <p className="font-extrabold">{opt.text}</p>
                          {opt.thai && <p className="text-xs text-white/80 font-normal">{opt.thai}</p>}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status footer during question */}
              <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
                <span>
                  {selectedOptionId ? '✓ คุณได้ส่งคำตอบแล้ว กำลังรอผู้เล่นอื่น...' : 'แตะที่คำตอบเพื่อส่งคะแนน ยิ่งเร็วยิ่งได้คะแนนสูง!'}
                </span>

                {/* Host Force Next Button */}
                {currentRoom.players.some((p) => p.name === userProfile.name && p.isHost) && (
                  <button
                    type="button"
                    onClick={handleHostShowLeaderboard}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    เฉลย & ดูคะแนน ➔
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* FEEDBACK & ANSWER EXPLANATION STAGE */}
          {/* ========================================================= */}
          {currentRoom.status === 'feedback' && currentQuestion && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-in zoom-in-95">
              <div className="text-center space-y-2">
                {selectedOptionId === currentQuestion.correctOptionId ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
                    <XCircle className="w-10 h-10" />
                  </div>
                )}

                <h3 className="text-2xl font-black text-slate-800">
                  {selectedOptionId === currentQuestion.correctOptionId ? 'ตอบถูกต้องยอดเยี่ยม! 🎉' : 'ยังไม่ถูกต้องนะ ✍️'}
                </h3>
              </div>

              {/* Correct answer card with explanation */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                <p className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>
                    คำตอบที่ถูกต้องคือ:{' '}
                    {currentQuestion.options.find((o) => o.id === currentQuestion.correctOptionId)?.text}
                  </span>
                </p>
                <p className="text-amber-800 font-medium leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>

              {/* Action Buttons for Next step */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleHostShowLeaderboard}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>ดูตารางคะแนนสด (Live Leaderboard)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LIVE LEADERBOARD STAGE */}
          {/* ========================================================= */}
          {currentRoom.status === 'leaderboard' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
                  🏆
                </div>
                <h3 className="text-2xl font-black text-slate-800">ตารางคะแนนสด (Live Leaderboard)</h3>
                <p className="text-xs text-slate-500">
                  ข้อที่ {currentRoom.currentQuestionIndex + 1} จาก {currentRoom.totalQuestions}
                </p>
              </div>

              {/* Leaderboard list */}
              <div className="space-y-2.5">
                {sortedPlayers.map((player, idx) => (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      idx === 0
                        ? 'border-yellow-400 bg-yellow-50/60 shadow-xs'
                        : idx === 1
                        ? 'border-slate-300 bg-slate-50/60'
                        : idx === 2
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-yellow-400 text-slate-900 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xl">{player.avatar || '🎓'}</span>
                        <div>
                          <p className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {player.streak >= 2 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold inline-flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                                <span>{player.streak} Streak!</span>
                              </span>
                            )}
                          </p>
                          {player.lastAnswerScore ? (
                            <p className="text-[10px] text-emerald-600 font-semibold">
                              +{player.lastAnswerScore} คะแนนความเร็ว
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-base text-slate-900">
                        {player.score.toLocaleString()}
                      </span>
                      <p className="text-[10px] text-slate-400">คะแนน</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Host Next Question Button */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleHostNextQuestion}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>
                    {currentRoom.currentQuestionIndex + 1 < currentRoom.totalQuestions
                      ? 'คำถามข้อถัดไป'
                      : 'ดูโพเดียมผู้ชนะ (Final Podium)'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* FINAL VICTORY PODIUM STAGE (1st, 2nd, 3rd) */}
          {/* ========================================================= */}
          {currentRoom.status === 'finished' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-yellow-200 shadow-xl space-y-8 animate-in zoom-in-95 text-center">
              <div className="space-y-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 inline-flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
                  <span>บทสรุปการแข่งขัน</span>
                </span>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                  โพเดียมผู้ชนะเลิศ (Hall of Champions)
                </h2>
                <p className="text-xs text-slate-500">
                  ยินดีด้วยกับผู้ทำคะแนนความเร็วและความแม่นยำสูงสุดประจำรอบนี้!
                </p>
              </div>

              {/* 3D Olympic Podium */}
              <div className="flex items-end justify-center gap-3 pt-6 max-w-md mx-auto">
                {/* 2nd Place */}
                {sortedPlayers[1] && (
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-3xl mb-1">{sortedPlayers[1].avatar || '🎓'}</span>
                    <p className="font-extrabold text-xs text-slate-800 truncate max-w-[90px]">
                      {sortedPlayers[1].name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 font-bold mb-2">
                      {sortedPlayers[1].score.toLocaleString()}
                    </p>
                    <div className="w-full h-24 rounded-t-2xl bg-gradient-to-t from-slate-400 to-slate-200 flex flex-col items-center justify-center text-slate-700 shadow-md">
                      <span className="text-2xl font-black">2</span>
                      <span className="text-[10px] font-bold uppercase">Silver</span>
                    </div>
                  </div>
                )}

                {/* 1st Place (Champion) */}
                {sortedPlayers[0] && (
                  <div className="flex-1 flex flex-col items-center -mt-6">
                    <div className="relative mb-1">
                      <Crown className="w-6 h-6 text-yellow-500 fill-yellow-400 mx-auto animate-bounce" />
                      <span className="text-4xl">{sortedPlayers[0].avatar || '👨‍🏫'}</span>
                    </div>
                    <p className="font-black text-sm text-slate-900 truncate max-w-[100px]">
                      {sortedPlayers[0].name}
                    </p>
                    <p className="text-xs font-mono text-yellow-700 font-black mb-2">
                      {sortedPlayers[0].score.toLocaleString()}
                    </p>
                    <div className="w-full h-36 rounded-t-2xl bg-gradient-to-t from-yellow-500 via-yellow-400 to-amber-300 flex flex-col items-center justify-center text-yellow-950 shadow-lg border-2 border-yellow-200">
                      <span className="text-3xl font-black">1</span>
                      <span className="text-xs font-black uppercase">Champion</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {sortedPlayers[2] && (
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-3xl mb-1">{sortedPlayers[2].avatar || '🎓'}</span>
                    <p className="font-extrabold text-xs text-slate-800 truncate max-w-[90px]">
                      {sortedPlayers[2].name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 font-bold mb-2">
                      {sortedPlayers[2].score.toLocaleString()}
                    </p>
                    <div className="w-full h-18 rounded-t-2xl bg-gradient-to-t from-amber-700 to-amber-500 flex flex-col items-center justify-center text-amber-100 shadow-md">
                      <span className="text-xl font-black">3</span>
                      <span className="text-[10px] font-bold uppercase">Bronze</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rewards Earned Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-900 max-w-md mx-auto">
                <span>รางวัลการมีส่วนร่วมในเกม:</span>
                <span className="font-black text-emerald-700">+60 XP • +15 เหรียญทอง 🪙</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleHostRestart}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>เล่นอีกครั้ง (Play Again)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (wsRef.current) wsRef.current.close();
                    setCurrentRoom(null);
                    setActiveView('hub');
                  }}
                  className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
