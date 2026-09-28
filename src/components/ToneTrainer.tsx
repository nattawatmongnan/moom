import React, { useState } from 'react';
import { Volume2, Award, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { speakChinese, soundEffects } from '../utils/audio';

interface ToneTrainerProps {
  onEarnReward?: (xp: number, coins: number) => void;
}

const TONE_DATA = [
  {
    tone: 1,
    name: 'เสียงที่ 1 (阴平)',
    mark: 'ˉ (เสียงสูงราบเรียบ)',
    pitch: 'ระดับ 55 (สูงคงที่)',
    thaiAnalogy: 'คล้ายเสียงสามัญแต่คีย์สูงกังวาน (เช่น กา)',
    example: { char: '妈', pinyin: 'mā', th: 'แม่' },
    curvePath: 'M 10 20 L 90 20',
    color: '#0284C7',
  },
  {
    tone: 2,
    name: 'เสียงที่ 2 (阳平)',
    mark: 'ˊ (เสียงยกขึ้น)',
    pitch: 'ระดับ 35 (กลางขึ้นสูง)',
    thaiAnalogy: 'คล้ายเสียงจัตวาแต่สั้นกระชับ (เช่น หมา)',
    example: { char: '麻', pinyin: 'má', th: 'ป่าน / ชา' },
    curvePath: 'M 10 50 Q 50 45 90 15',
    color: '#10B981',
  },
  {
    tone: 3,
    name: 'เสียงที่ 3 (上声)',
    mark: 'ˇ (เสียงกดต่ำแล้วตวัดขึ้น)',
    pitch: 'ระดับ 214 (ต่ำสุดแล้วขึ้น)',
    thaiAnalogy: 'คล้ายเสียงเอกที่กดต่ำลึกก่อนแล้วสะบัดขึ้น',
    example: { char: '马', pinyin: 'mǎ', th: 'ม้า' },
    curvePath: 'M 10 40 Q 45 68 90 25',
    color: '#F59E0B',
  },
  {
    tone: 4,
    name: 'เสียงที่ 4 (去声)',
    mark: 'ˋ (เสียงสั้นหนัก ทิ้งลงต่ำ)',
    pitch: 'ระดับ 51 (สูงดิ่งลงต่ำสุด)',
    thaiAnalogy: 'คล้ายเสียงโทกระแทกหนักและเด็ดขาด (เช่น ม่า / ไม่)',
    example: { char: '骂', pinyin: 'mà', th: 'ด่า / ว่ากล่าว' },
    curvePath: 'M 10 15 L 90 65',
    color: '#E11D48',
  },
];

const QUIZ_QUESTIONS = [
  { syllable: 'bā', char: '八', meaning: 'แปด (8)', tone: 1 },
  { syllable: 'chá', char: '茶', meaning: 'ชา', tone: 2 },
  { syllable: 'nǐ', char: '你', meaning: 'คุณ / เธอ', tone: 3 },
  { syllable: 'xiè', char: '谢', meaning: 'ขอบคุณ', tone: 4 },
  { syllable: 'shuǐ', char: '水', meaning: 'น้ำ', tone: 3 },
  { syllable: 'bù', char: '不', meaning: 'ไม่', tone: 4 },
];

export const ToneTrainer: React.FC<ToneTrainerProps> = ({ onEarnReward }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'quiz'>('visual');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  const currentQ = QUIZ_QUESTIONS[quizIndex];

  const handlePlayQuizSound = () => {
    speakChinese(currentQ.char, true);
  };

  const handleSelectAnswer = (toneNumber: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(toneNumber);

    if (toneNumber === currentQ.tone) {
      soundEffects.playCorrect();
      setFeedback('correct');
      setQuizScore(prev => prev + 1);
      if (onEarnReward) onEarnReward(10, 3);
    } else {
      soundEffects.playClick();
      setFeedback('wrong');
    }
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    setFeedback(null);
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizIndex(0);
      setQuizScore(0);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">🎶</span>
            <span>เครื่องมือฝึก 4 เสียงวรรณยุกต์ (Tone Trainer)</span>
          </h3>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            กุญแจสำคัญที่สุดในการออกเสียงภาษาจีนให้ถูกต้องและสื่อสารไม่ผิดเพี้ยน
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'visual'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เส้นเสียงและตัวอย่าง
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('quiz');
              handlePlayQuizSound();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            แบบฝึกฟังทายเสียง ({quizScore}/{QUIZ_QUESTIONS.length})
          </button>
        </div>
      </div>

      {/* Visual Tone Curves */}
      {activeTab === 'visual' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {TONE_DATA.map(t => (
            <div
              key={t.tone}
              className="p-4 rounded-2xl border border-slate-100 bg-[#FFFDF7] hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: t.color }}
                  >
                    เสียง {t.tone}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{t.mark}</span>
                </div>

                {/* Pitch SVG curve visualization */}
                <div className="h-20 bg-white rounded-xl border border-slate-100 p-2 flex items-center justify-center relative mb-3">
                  <svg viewBox="0 0 100 70" className="w-full h-full">
                    {/* Background pitch guide lines */}
                    <line x1="0" y1="15" x2="100" y2="15" stroke="#E2E8F0" strokeDasharray="2,2" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="#E2E8F0" strokeDasharray="2,2" />
                    <line x1="0" y1="65" x2="100" y2="65" stroke="#E2E8F0" strokeDasharray="2,2" />
                    {/* Tone Curve */}
                    <path
                      d={t.curvePath}
                      fill="none"
                      stroke={t.color}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute bottom-1 right-2 text-[10px] text-slate-400">
                    {t.pitch}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                  <span className="font-semibold text-slate-700">เทียบเสียงไทย: </span>
                  {t.thaiAnalogy}
                </p>
              </div>

              {/* Example char & audio button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-hanzi text-lg font-bold text-slate-800 mr-1.5">
                    {t.example.char}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: t.color }}>
                    {t.example.pinyin}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5">({t.example.th})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    speakChinese(t.example.char);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors"
                  title="กดฟังเสียง"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tone Listening Quiz */
        <div className="max-w-md mx-auto py-2">
          <div className="bg-rose-50/60 rounded-3xl p-6 border border-rose-100 text-center">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
              ข้อที่ {quizIndex + 1} จาก {QUIZ_QUESTIONS.length}
            </span>

            <div className="my-5">
              <button
                type="button"
                onClick={handlePlayQuizSound}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25 mx-auto flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                title="กดฟังคำนี้อีกครั้ง"
              >
                <Volume2 className="w-8 h-8" />
              </button>
              <p className="text-xs text-slate-500 mt-2">แตะปุ่มเพื่อฟังเสียงคำศัพท์</p>
            </div>

            <p className="text-sm font-medium text-slate-700 mb-4">
              คำว่า <span className="font-bold text-rose-600 font-hanzi text-base">"{currentQ.char}"</span> ({currentQ.meaning}) เป็นเสียงวรรณยุกต์ใด?
            </p>

            {/* 4 Tone choices */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[1, 2, 3, 4].map(num => {
                const isSelected = selectedAnswer === num;
                const isCorrect = currentQ.tone === num;

                let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:border-rose-300';
                if (selectedAnswer !== null) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500 border-emerald-600 text-white shadow-md';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500 border-rose-600 text-white';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSelectAnswer(num)}
                    disabled={selectedAnswer !== null}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${btnStyle}`}
                  >
                    <span>เสียงที่ {num}</span>
                    <span className="text-xs opacity-75">
                      {num === 1 ? 'ˉ' : num === 2 ? 'ˊ' : num === 3 ? 'ˇ' : 'ˋ'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation & Feedback */}
            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center justify-center gap-2 ${
                  feedback === 'correct'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {feedback === 'correct' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ถูกต้องแล้วครับ! {currentQ.syllable} คือเสียงที่ {currentQ.tone} (+10 XP)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>ยังไม่ถูกต้อง คำตอบคือเสียงที่ {currentQ.tone} ({currentQ.syllable})</span>
                  </>
                )}
              </div>
            )}

            {selectedAnswer !== null && (
              <button
                type="button"
                onClick={handleNextQuiz}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-all cursor-pointer"
              >
                {quizIndex < QUIZ_QUESTIONS.length - 1 ? 'ข้อถัดไป ➔' : 'เริ่มฝึกใหม่ ↺'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
