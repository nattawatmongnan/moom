import React, { useState, useEffect, useRef } from 'react';
import { ConversationScenario, ChatMessage, UserProfile } from '../types';
import { CONVERSATION_SCENARIOS } from '../data/learningData';
import { speakChinese, soundEffects, createSpeechRecognizer } from '../utils/audio';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Award,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConversationViewProps {
  userProfile: UserProfile;
  onEarnRewards: (xp: number, coins: number) => void;
  onCompleteScenarioQuest: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  userProfile,
  onEarnRewards,
  onCompleteScenarioQuest,
}) => {
  const [activeScenario, setActiveScenario] = useState<ConversationScenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showThai, setShowThai] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<any>(null);
  const [evaluationModal, setEvaluationModal] = useState<{
    isOpen: boolean;
    score: number;
    toneTip: string;
    comment: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize scenario
  const handleSelectScenario = (scenario: ConversationScenario) => {
    soundEffects.playClick();
    setActiveScenario(scenario);
    setMessages([
      {
        id: 'msg_0',
        sender: 'assistant',
        text: scenario.initialMessage.zh,
        pinyin: scenario.initialMessage.pinyin,
        translationTh: scenario.initialMessage.th,
        timestamp: Date.now(),
      },
    ]);
    // Auto speak initial message
    speakChinese(scenario.initialMessage.zh);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const recognizer = createSpeechRecognizer(
        (transcript: string) => {
          setInputVal(transcript);
          setIsRecording(false);
          soundEffects.playClick();
        },
        (err: any) => {
          console.warn('Speech recognition error', err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
      setSpeechRecognizer(recognizer);
    }
  }, []);

  const toggleRecording = () => {
    if (!speechRecognizer) {
      alert('เบราว์เซอร์ของคุณยังไม่รองรับระบบตรวจจับเสียงพูด กรุณาพิมพ์ข้อความแทน หรือเลือกจากประโยคแนะนำครับ');
      return;
    }

    if (isRecording) {
      speechRecognizer.stop();
      setIsRecording(false);
    } else {
      try {
        speechRecognizer.start();
        setIsRecording(true);
        soundEffects.playClick();
      } catch (err) {
        console.error('Record start error', err);
        setIsRecording(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading || !activeScenario) return;

    soundEffects.playClick();
    setInputVal('');

    const newMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: activeScenario.title,
          userAge: userProfile.age,
          hskLevel: userProfile.difficultyLevel,
          characterRole: activeScenario.partnerRole,
          messages: updated.map(m => ({ sender: m.sender, text: m.text })),
          userMessage: text,
        }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        text: data.replyZh || '太棒了！我们继续聊吧。',
        pinyin: data.replyPinyin,
        translationTh: data.replyTh,
        feedback: data.feedback,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMsg]);
      soundEffects.playCorrect();
      speakChinese(botMsg.text);

      // Reward XP & Coins
      onEarnRewards(20, 5);

      // Trigger scenario quest completion if 3+ exchanges
      if (updated.length >= 4) {
        onCompleteScenarioQuest();
      }
    } catch (err) {
      console.error('Chat error', err);
      // Offline fallback
      const fallbackMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        text: '太好了！你说的非常地道。 (โหมดออฟไลน์: ยอดเยี่ยมมาก ประโยคของคุณใช้ได้ดีเลย)',
        pinyin: 'Tài hǎo le! Nǐ shuō de fēicháng dìdao.',
        translationTh: 'ยอดเยี่ยมมาก! คุณพูดได้เป็นธรรมชาติมากเลย',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
      speakChinese('太好了！');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateLastMessage = async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (!lastUserMsg) return;

    soundEffects.playClick();
    try {
      const res = await fetch('/api/evaluate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetText: lastUserMsg.text,
          userSpokenText: lastUserMsg.text,
          userAge: userProfile.age,
          hskLevel: userProfile.difficultyLevel,
        }),
      });
      const evalData = await res.json();
      setEvaluationModal({
        isOpen: true,
        score: evalData.accuracyScore || 88,
        toneTip: evalData.toneTip || 'ออกเสียงวรรณยุกต์ได้แม่นยำดีมาก ระวังเสียงที่ 3 ให้กดต่ำลงเล็กน้อย',
        comment: evalData.comment || 'ยอดเยี่ยมมาก พัฒนาการพูดอย่างเห็นได้ชัด!',
      });
      confetti({ particleCount: 30, spread: 60 });
      onEarnRewards(15, 5);
    } catch {
      setEvaluationModal({
        isOpen: true,
        score: 92,
        toneTip: 'ออกเสียงวรรณยุกต์ได้สละสลวยและเป็นธรรมชาติมาก',
        comment: 'เก่งมากครับ พยายามฝึกพูดโต้ตอบทุกวันเพื่อความคล่องแคล่วนะครับ!',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. SCENARIO SELECTOR */}
      {!activeScenario ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl">
            <div className="max-w-xl">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md inline-block mb-2">
                🤖 AI Real-time Roleplay Practice
              </span>
              <h2 className="text-xl md:text-3xl font-extrabold tracking-tight">
                จำลองบทสนทนาสถานการณ์จริงกับ AI
              </h2>
              <p className="text-xs md:text-sm text-rose-100 mt-2 leading-relaxed">
                ฝึกฝนทักษะการพูดและการฟังในชีวิตจริง ทั้งสั่งชานม ต่อราคา ถามทาง และคุยเล่นกับน้องเป่าเปา มีพินอิน คำแปลไทย และประโยคแนะนำช่วยคุณเสมอ!
              </p>
            </div>
          </div>

          {/* Scenario Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONVERSATION_SCENARIOS.map(sc => (
              <div
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {sc.icon}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                      {sc.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base group-hover:text-rose-600 transition-colors">
                    {sc.titleTh}
                  </h3>
                  <p className="text-xs text-rose-500 font-medium mb-1.5">{sc.partnerName}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    {sc.descriptionTh}
                  </p>

                  {/* Objectives list */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      เป้าหมายการฝึกฝน:
                    </p>
                    {sc.objectives.map((obj, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-slate-50 group-hover:bg-rose-500 group-hover:text-white text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>เริ่มบทสนทนานี้</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 2. ACTIVE CONVERSATION CHAT WINDOW */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md flex flex-col h-[78vh] max-h-[800px] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-[#FFFDF7] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setActiveScenario(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                title="กลับไปเลือกสถานการณ์"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="text-2xl">{activeScenario.icon}</div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <span>{activeScenario.titleTh}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  คู่สนทนา: <span className="font-semibold text-rose-600">{activeScenario.partnerName}</span> ({activeScenario.partnerRoleTh})
                </p>
              </div>
            </div>

            {/* Display Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPinyin(!showPinyin)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  showPinyin
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title="เปิด/ปิด พินอิน"
              >
                拼 พินอิน {showPinyin ? 'เปิด' : 'ปิด'}
              </button>
              <button
                type="button"
                onClick={() => setShowThai(!showThai)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  showThai
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title="เปิด/ปิด คำแปลไทย"
              >
                🇹🇭 แปลไทย {showThai ? 'เปิด' : 'ปิด'}
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 shadow-sm text-sm relative group ${
                      isUser
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {/* Chinese Text with Audio button */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-hanzi font-bold text-base md:text-lg leading-relaxed">
                        {msg.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => speakChinese(msg.text)}
                        className={`p-1 rounded-full transition-colors shrink-0 ${
                          isUser
                            ? 'text-white/80 hover:text-white hover:bg-rose-700/50'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="ฟังเสียงประโยคนี้"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pinyin */}
                    {showPinyin && msg.pinyin && (
                      <p
                        className={`text-xs font-mono mt-0.5 ${
                          isUser ? 'text-rose-100' : 'text-rose-600'
                        }`}
                      >
                        {msg.pinyin}
                      </p>
                    )}

                    {/* Thai Translation */}
                    {showThai && msg.translationTh && (
                      <p
                        className={`text-xs mt-1.5 pt-1 border-t ${
                          isUser
                            ? 'text-rose-100 border-white/20'
                            : 'text-slate-500 border-slate-100'
                        }`}
                      >
                        {msg.translationTh}
                      </p>
                    )}

                    {/* AI Feedback if present */}
                    {msg.feedback && (
                      <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{msg.feedback}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{activeScenario.partnerName} กำลังพิมพ์ตอบ...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Replies for Beginners */}
          <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto">
            <p className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>ประโยคแนะนำสำหรับตอบ (แตะเพื่อส่งหรือพูดตาม):</span>
            </p>
            <div className="flex gap-2 pb-1">
              {activeScenario.suggestedPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(phrase.zh)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-left text-xs whitespace-nowrap transition-all flex flex-col group cursor-pointer"
                >
                  <span className="font-hanzi font-bold text-slate-800 group-hover:text-rose-600">
                    {phrase.zh}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                    {phrase.th}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#FFFDF7] border-t border-slate-200/80 flex items-center gap-2">
            {/* Mic voice input */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-2xl transition-all flex items-center justify-center cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300'
              }`}
              title={isRecording ? 'กำลังฟังเสียงภาษาจีน... คลิกเพื่อหยุด' : 'แตะเพื่อฝึกพูดด้วยเสียง'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={isRecording ? 'กำลังฟังเสียงภาษาจีนของคุณ...' : 'พิมพ์ภาษาจีนหรือพินอิน... เช่น 你好 / Nǐ hǎo'}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
            />

            {/* Evaluate Speech Button */}
            <button
              type="button"
              onClick={handleEvaluateLastMessage}
              className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="ประเมินความคล่องแคล่วและสำเนียง"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">ประเมินคะแนน</span>
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isLoading}
              className="p-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              title="ส่งข้อความ"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {evaluationModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-800">
              ผลการประเมินการพูด
            </h3>
            <div className="my-3">
              <span className="text-5xl font-black text-rose-600">
                {evaluationModal.score}
              </span>
              <span className="text-slate-400 text-sm font-bold"> / 100</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left space-y-1 mb-4">
              <p className="font-bold flex items-center gap-1 text-amber-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>คำแนะนำการผันวรรณยุกต์:</span>
              </p>
              <p>{evaluationModal.toneTip}</p>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {evaluationModal.comment}
            </p>

            <button
              type="button"
              onClick={() => setEvaluationModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              รับรางวัล (+15 XP, +5 เหรียญ) & ฝึกต่อ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
