import React, { useState, useEffect, useRef } from 'react';
import { VocabWord } from '../types';
import { VOCAB_DATABASE } from '../data/learningData';
import { soundEffects, speakChinese } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sparkles,
  BookOpen,
  Award,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  PenTool,
  Compass,
} from 'lucide-react';

interface StrokeOrderTrainerProps {
  onEarnRewards: (xp: number, coins: number) => void;
  onNavigateToHandwriting?: (wordIdx: number) => void;
}

// 7 Fundamental Chinese Stroke Order Rules
const STROKE_RULES = [
  {
    id: 'rule-1',
    nameZh: '从上到下',
    pinyin: 'Cóng shàng dào xià',
    nameTh: 'จากบนลงล่าง',
    desc: 'เมื่อตัวอักษรมีการแบ่งชั้นบน-ล่าง ให้ลากส่วนบนก่อน แล้วจึงเขียนส่วนล่าง',
    examples: ['三', '言', '早', '字'],
    demoChar: '三',
    demoPinyin: 'sān',
    steps: ['1. ขีดแนวนอนบนสุด (一)', '2. ขีดแนวนอนตรงกลาง (二)', '3. ขีดแนวนอนล่างสุดที่ยาวที่สุด (三)'],
  },
  {
    id: 'rule-2',
    nameZh: '从左到右',
    pinyin: 'Cóng zuǒ dào yòu',
    nameTh: 'จากซ้ายไปขวา',
    desc: 'เมื่อตัวอักษรมีส่วนประกอบซ้าย-ขวา ให้เขียนฝั่งซ้ายให้เสร็จก่อน แล้วจึงเขียนฝั่งขวา',
    examples: ['你', '明', '朋', '他'],
    demoChar: '明',
    demoPinyin: 'míng',
    steps: ['1. เขียนตัว 日 (ดวงอาทิตย์) ฝั่งซ้าย', '2. เขียนตัว 月 (ดวงจันทร์) ฝั่งขวา'],
  },
  {
    id: 'rule-3',
    nameZh: '先横后竖',
    pinyin: 'Xiān héng hòu shù',
    nameTh: 'แนวนอนก่อนแนวตั้ง',
    desc: 'เมื่อมีเส้นแนวนอนตัดกับเส้นแนวตั้ง ให้ลากเส้นแนวนอนก่อน แล้วจึงลากเส้นแนวตั้งตัดลงมา',
    examples: ['十', '干', '土', '木'],
    demoChar: '十',
    demoPinyin: 'shí',
    steps: ['1. ขีดแนวนอน (一 横)', '2. ขีดแนวตั้งตัดลงมา (丨 竖)'],
  },
  {
    id: 'rule-4',
    nameZh: '先撇后捺',
    pinyin: 'Xiān piě hòu nà',
    nameTh: 'ตวัดซ้ายก่อนตวัดขวา',
    desc: 'เมื่อมีเส้นตวัดซ้าย (撇) และตวัดขวา (捺) ตัดกันหรือไขว้กัน ให้ตวัดซ้ายก่อนเสมอ',
    examples: ['人', '八', '大', '天'],
    demoChar: '人',
    demoPinyin: 'rén',
    steps: ['1. เส้นตวัดเฉียงซ้าย (丿 撇)', '2. เส้นตวัดเฉียงขวาลงมา (乀 捺)'],
  },
  {
    id: 'rule-5',
    nameZh: '先外后内',
    pinyin: 'Xiān wài hòu nèi',
    nameTh: 'ด้านนอกก่อนด้านใน',
    desc: 'สำหรับตัวอักษรที่มีกรอบล้อมรอบแบบเปิด ให้เขียนโครงสร้างภายนอกก่อน แล้วจึงเขียนไส้ข้างใน',
    examples: ['月', '同', '问', '风'],
    demoChar: '同',
    demoPinyin: 'tóng',
    steps: ['1. ขีดกรอบด้านนอก (冂)', '2. เขียนไส้ข้างในตัว 一 และ 口'],
  },
  {
    id: 'rule-6',
    nameZh: '先进后关',
    pinyin: 'Xiān jìn hòu guān',
    nameTh: 'เข้าก่อนแล้วค่อยปิดประตู',
    desc: 'สำหรับตัวอักษรที่มีกรอบสี่เหลี่ยมปิดมิดชิด ให้ลากกรอบ 3 ด้าน -> เขียนข้างในให้เสร็จ -> แล้วขีดปิดประตูล่างสุด',
    examples: ['回', '国', '四', '田'],
    demoChar: '回',
    demoPinyin: 'huí',
    steps: ['1. ลากกรอบนอก 3 ด้าน (冂)', '2. เขียนตัว 口 ข้างในให้เสร็จสมบูรณ์', '3. ขีดเส้นแนวนอนปิดประตูกรอบนอก (一)'],
  },
  {
    id: 'rule-7',
    nameZh: '先中间后两边',
    pinyin: 'Xiān zhōngjiān hòu liǎngbiān',
    nameTh: 'ตรงกลางก่อนซ้ายขวา',
    desc: 'สำหรับตัวอักษรที่มีความสมมาตรและมีแกนกลาง ให้เขียนแกนกลางก่อน แล้วจึงเติมปีกซ้ายและขวา',
    examples: ['小', '水', '山', '木'],
    demoChar: '小',
    demoPinyin: 'xiǎo',
    steps: ['1. ขีดแนวตั้งตะขอกลาง (亅 竖钩)', '2. จุดตวัดซ้าย (丶 点)', '3. ขีดตวัดขวา (丿 撇)'],
  },
];

// Basic 8 Strokes in Chinese (永字八法)
const BASIC_STROKE_TYPES = [
  { nameZh: '横', pinyin: 'Héng', nameTh: 'แนวนอน', symbol: '一', dir: 'ลากจากซ้ายไปขวา', example: '三, 十' },
  { nameZh: '竖', pinyin: 'Shù', nameTh: 'แนวตั้ง', symbol: '丨', dir: 'ลากจากบนลงล่าง', example: '十, 中' },
  { nameZh: '撇', pinyin: 'Piě', nameTh: 'ตวัดซ้าย', symbol: '丿', dir: 'ลากจากขวาบนเฉียงลงซ้ายล่าง', example: '八, 人' },
  { nameZh: '捺', pinyin: 'Nà', nameTh: 'ตวัดขวา', symbol: '㇏', dir: 'ลากจากซ้ายบนเฉียงลงขวาล่าง', example: '大, 天' },
  { nameZh: '点', pinyin: 'Diǎn', nameTh: 'จุด', symbol: '丶', dir: 'กดจุดจากซ้ายบนลงขวาล่าง', example: '六, 主' },
  { nameZh: '提', pinyin: 'Tí', nameTh: 'ตวัดขึ้น', symbol: '㇀', dir: 'ตวัดจากซ้ายล่างขึ้นขวาบน', example: '地, 冷' },
  { nameZh: '折', pinyin: 'Zhé', nameTh: 'หักมุม', symbol: '𠃍', dir: 'ลากเส้นแล้วหักเลี้ยว 90 องศา', example: '口, 日' },
  { nameZh: '钩', pinyin: 'Gōu', nameTh: 'ตะขอ', symbol: '亅', dir: 'ลากเส้นแล้วตวัดขอเกี่ยวขึ้น', example: '小, 了' },
];

export const StrokeOrderTrainer: React.FC<StrokeOrderTrainerProps> = ({
  onEarnRewards,
  onNavigateToHandwriting,
}) => {
  const [subSection, setSubSection] = useState<'trainer' | 'rules' | 'quiz'>('trainer');
  const [selectedWordIdx, setSelectedWordIdx] = useState(0);
  const [currentStrokeStep, setCurrentStrokeStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per stroke
  const [selectedRuleId, setSelectedRuleId] = useState<string>('rule-1');

  // Quiz State
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  const currentWord = VOCAB_DATABASE[selectedWordIdx] || VOCAB_DATABASE[0];
  const charStrokes = currentWord.strokes || ['撇', '竖', '横', '捺'];
  const totalStrokes = charStrokes.length;
  const targetChar = currentWord.hanzi[0] || currentWord.hanzi;

  // Auto-play timer
  useEffect(() => {
    let timer: number | null = null;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setCurrentStrokeStep((prev) => {
          if (prev >= totalStrokes) {
            setIsPlaying(false);
            soundEffects.playCorrect();
            return totalStrokes;
          }
          soundEffects.playClick();
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, totalStrokes, playbackSpeed]);

  // Reset stroke step when word changes
  useEffect(() => {
    setCurrentStrokeStep(1);
    setIsPlaying(false);
  }, [selectedWordIdx]);

  const handleNextStroke = () => {
    soundEffects.playClick();
    if (currentStrokeStep < totalStrokes) {
      setCurrentStrokeStep((prev) => prev + 1);
    }
  };

  const handlePrevStroke = () => {
    soundEffects.playClick();
    if (currentStrokeStep > 1) {
      setCurrentStrokeStep((prev) => prev - 1);
    }
  };

  const handleResetStrokes = () => {
    soundEffects.playClick();
    setIsPlaying(false);
    setCurrentStrokeStep(1);
  };

  const handleTogglePlay = () => {
    soundEffects.playClick();
    if (currentStrokeStep >= totalStrokes) {
      setCurrentStrokeStep(1);
    }
    setIsPlaying(!isPlaying);
  };

  // QUIZ QUESTIONS
  const QUIZ_LIST = [
    {
      question: `ตามกฎการเขียนอักษรจีน ตัวอักษร "十" (shí) ต้องเขียนเส้นใดก่อน?`,
      options: ['ขีดแนวนอน (一) ก่อน', 'ขีดแนวตั้ง (丨) ก่อน', 'เขียนพร้อมกัน', 'ตวัดจากล่างขึ้นบน'],
      correctIndex: 0,
      explanation: 'ตามกฎเหล็ก "先横后竖" (แนวนอนก่อนแนวตั้ง) ต้องลากเส้นแนวนอน 一 ก่อน แล้วจึงลากแนวตั้ง 丨 ตัดลงมา',
    },
    {
      question: `ตัวอักษร "人" (rén) ประกอบด้วย 2 ขีด ต้องเขียนขีดใดก่อน?`,
      options: ['ขีดตวัดซ้าย (丿 撇) ก่อน', 'ขีดตวัดขวา (乀 捺) ก่อน', 'ขีดจุดก่อน', 'ลากจากขวาไปซ้าย'],
      correctIndex: 0,
      explanation: 'ตามกฎเหล็ก "先撇后捺" (ตวัดซ้ายก่อนตวัดขวา) ต้องลากเส้นเฉียงซ้าย 丿 ก่อน แล้วจึงลากเส้นขวา 乀',
    },
    {
      question: `ตัวอักษร "回" (huí) และ "国" (guó) มีกรอบล้อมรอบ ต้องเขียนอย่างไรตามกฎ?`,
      options: [
        'ขีดปิดประตูล่างสุดก่อน แล้วค่อยเขียนข้างใน',
        'เขียนกรอบนอก 3 ด้าน -> เขียนข้างใน -> ขีดปิดประตูล่างสุด',
        'เขียนข้างในให้เสร็จก่อน แล้วค่อยตีกรอบสี่เหลี่ยมทีหลัง',
        'เขียนจากขวาไปซ้าย',
      ],
      correctIndex: 1,
      explanation: 'ตามกฎ "先进后关" (เข้าก่อนแล้วค่อยปิดประตู) ให้ลากกรอบ 3 ด้านก่อน นำไส้ข้างในใส่ให้เรียบร้อย แล้วจึงขีดปิดประตูเส้นล่างสุด',
    },
    {
      question: `ตัวอักษร "小" (xiǎo) และ "水" (shuǐ) ที่มีความสมมาตร ควรเขียนส่วนใดก่อน?`,
      options: ['ส่วนตรงกลางก่อน แล้วค่อยเติมซ้ายขวา', 'ส่วนข้างซ้ายก่อน', 'ส่วนข้างขวาก่อน', 'เขียนจากล่างขึ้นบน'],
      correctIndex: 0,
      explanation: 'ตามกฎ "先中间后两边" (ตรงกลางก่อนซ้ายขวา) ต้องลากแกนกลางก่อน แล้วจึงเติมปีกซ้ายและขวา',
    },
  ];

  const handleQuizAnswer = (optIdx: number) => {
    if (quizSelectedOption !== null) return;
    setQuizSelectedOption(optIdx);

    const isCorrect = optIdx === QUIZ_LIST[quizIdx].correctIndex;
    if (isCorrect) {
      soundEffects.playCorrect();
      confetti({ particleCount: 35, spread: 60 });
      setQuizScore((prev) => prev + 1);
      onEarnRewards(20, 5);
    } else {
      soundEffects.playWrong();
    }
  };

  const handleNextQuiz = () => {
    soundEffects.playClick();
    setQuizSelectedOption(null);
    setQuizIdx((prev) => (prev + 1) % QUIZ_LIST.length);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Segmented Navigation */}
      <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSubSection('trainer');
            }}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subSection === 'trainer'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>จำลองการเขียนทีละขีด (Step-by-Step)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSubSection('rules');
            }}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subSection === 'rules'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>กฎเหล็ก 7 ประการของลำดับขีด</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSubSection('quiz');
            }}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subSection === 'quiz'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>แบบทดสอบทายลำดับขีด (Quiz)</span>
          </button>
        </div>

        {/* Quick word jumper */}
        <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 rounded-xl text-xs text-slate-500">
          <span>คำที่:</span>
          <select
            value={selectedWordIdx}
            onChange={(e) => {
              soundEffects.playClick();
              setSelectedWordIdx(Number(e.target.value));
            }}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {VOCAB_DATABASE.slice(0, 15).map((w, i) => (
              <option key={w.id} value={i}>
                {w.hanzi} ({w.pinyin})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. INTERACTIVE STEP-BY-STEP STROKE TRAINER */}
      {/* ======================================================== */}
      {subSection === 'trainer' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Main Visualizer (Left Col) */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm space-y-5">
            {/* Character Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 font-hanzi font-bold text-2xl flex items-center justify-center border border-rose-100 shadow-2xs">
                  {targetChar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-base">{currentWord.hanzi}</h3>
                    <span className="text-xs font-mono font-bold text-rose-500">{currentWord.pinyin}</span>
                    <button
                      type="button"
                      onClick={() => speakChinese(currentWord.hanzi)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                      title="ฟังเสียงอ่าน"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">ความหมาย: {currentWord.thai}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                  ทั้งหมด {totalStrokes} ขีด
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">หมวดคำ: {currentWord.radical}</p>
              </div>
            </div>

            {/* Tian Zi Ge Grid Simulation (米字格) */}
            <div className="relative w-64 h-64 mx-auto bg-[#FFFDF7] rounded-3xl border-4 border-amber-300 shadow-inner flex items-center justify-center overflow-hidden">
              {/* Traditional Grid Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Horizontal Center line */}
                <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-amber-200" />
                {/* Vertical Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-amber-200" />
                {/* Diagonal lines */}
                <svg className="absolute inset-0 w-full h-full text-amber-100" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4">
                  <line x1="0" y1="0" x2="100%" y2="100%" />
                  <line x1="100%" y1="0" x2="0" y2="100%" />
                </svg>
              </div>

              {/* Chinese Character with stroke progression */}
              <div className="relative z-10 flex flex-col items-center select-none">
                <span className="font-hanzi text-8xl font-black text-slate-800 drop-shadow-sm transition-all duration-300">
                  {targetChar}
                </span>

                {/* Step badge overlay */}
                <div className="absolute -bottom-3 px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1">
                  <span>ขีดที่ {currentStrokeStep} / {totalStrokes}:</span>
                  <span className="text-yellow-300">{charStrokes[currentStrokeStep - 1] || 'ขีด'}</span>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePrevStroke}
                  disabled={currentStrokeStep <= 1}
                  className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-700 transition-colors cursor-pointer"
                  title="ขีดก่อนหน้า"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white font-black text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>หยุดชั่วคราว</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>เล่นลำดับขีดอัตโนมัติ</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNextStroke}
                  disabled={currentStrokeStep >= totalStrokes}
                  className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-700 transition-colors cursor-pointer"
                  title="ขีดถัดไป"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleResetStrokes}
                  className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                  title="เริ่มใหม่อีกครั้ง"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <span>ความเร็วแอนิเมชัน:</span>
                {[
                  { label: 'ช้า', val: 1500 },
                  { label: 'ปกติ', val: 900 },
                  { label: 'เร็ว', val: 500 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setPlaybackSpeed(s.val)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      playbackSpeed === s.val ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jump to Handwriting Practice Canvas */}
            {onNavigateToHandwriting && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">เข้าใจลำดับขีดแล้วใช่ไหม?</span>
                <button
                  type="button"
                  onClick={() => onNavigateToHandwriting(selectedWordIdx)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>ลองเขียนด้วยพู่กันในกระดานคัดลายมือ ➔</span>
                </button>
              </div>
            )}
          </div>

          {/* Stroke Sequence Breakdown (Right Col) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-500" />
                <span>ขั้นตอนลำดับขีดของ "{targetChar}"</span>
              </h4>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {charStrokes.map((stName, idx) => {
                  const stepNum = idx + 1;
                  const isCurrent = currentStrokeStep === stepNum;
                  const isPast = currentStrokeStep > stepNum;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        soundEffects.playClick();
                        setCurrentStrokeStep(stepNum);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-2 ring-rose-500/20'
                          : isPast
                          ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isCurrent
                              ? 'bg-rose-500 text-white'
                              : isPast
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {stepNum}
                        </div>
                        <div>
                          <p className={`font-bold text-xs ${isCurrent ? 'text-rose-900' : 'text-slate-800'}`}>
                            ขีดที่ {stepNum}: {stName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {stName.includes('撇')
                              ? 'ตวัดลงทางซ้าย'
                              : stName.includes('竖')
                              ? 'ลากตรงจากบนลงล่าง'
                              : stName.includes('横')
                              ? 'ลากขนานจากซ้ายไปขวา'
                              : stName.includes('捺')
                              ? 'ตวัดลงทางขวา'
                              : stName.includes('点')
                              ? 'กดแต้มจุด'
                              : 'ลากเส้นตามโครงสร้าง'}
                          </p>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] font-extrabold text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                          กำลังดู
                        </span>
                      ) : isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Basic Stroke Cards */}
            <div className="bg-amber-50/60 rounded-3xl p-4 border border-amber-200/80 space-y-2">
              <h5 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>จำง่าย: 8 ขีดพื้นฐานของอักษรจีน (永字八法)</span>
              </h5>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {BASIC_STROKE_TYPES.map((b) => (
                  <div key={b.nameZh} className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                    <span className="text-base font-hanzi font-bold text-slate-800 block">{b.symbol}</span>
                    <span className="text-[11px] font-bold text-amber-900 block">{b.nameZh}</span>
                    <span className="text-[9px] text-slate-500 block truncate">{b.nameTh}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. THE 7 STROKE ORDER RULES (กฎ 7 ข้อของลำดับขีด) */}
      {/* ======================================================== */}
      {subSection === 'rules' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>กฎเหล็ก 7 ข้อของการเขียนลำดับขีดจีน (Seven Stroke Order Rules)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              การเขียนอักษรจีนให้ถูกต้องและสวยงาม ไม่ใช่การวาดภาพ แต่ต้องมีลำดับขั้นตอนตามกฎโบราณ
              หากจำกฎ 7 ข้อนี้ได้ จะสามารถเขียนอักษรจีนได้ถูกต้องทุกตัวอย่างเป็นธรรมชาติ!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STROKE_RULES.map((rule, idx) => {
              const isSelected = selectedRuleId === rule.id;
              return (
                <div
                  key={rule.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedRuleId(rule.id);
                  }}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-rose-500 bg-white shadow-md ring-2 ring-rose-500/10'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-800">{rule.nameTh}</h4>
                          <span className="font-hanzi text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {rule.nameZh}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{rule.pinyin}</p>
                      </div>
                    </div>

                    {/* Demo Character */}
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-slate-900 font-hanzi font-bold text-xl flex items-center justify-center shrink-0">
                      {rule.demoChar}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{rule.desc}</p>

                  {/* Steps Breakdown */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                      ตัวอย่างการเขียนตัว "{rule.demoChar}" ({rule.demoPinyin}):
                    </p>
                    {rule.steps.map((st, i) => (
                      <p key={i} className="text-xs font-medium text-slate-700">
                        {st}
                      </p>
                    ))}
                  </div>

                  {/* Other Examples */}
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                    <span>ตัวอย่างอื่นๆ:</span>
                    {rule.examples.map((ex) => (
                      <span
                        key={ex}
                        onClick={(e) => {
                          e.stopPropagation();
                          speakChinese(ex);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-hanzi font-bold text-slate-800 hover:border-rose-300 transition-colors"
                        title="คลิกเพื่อฟังเสียงอ่าน"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. STROKE ORDER QUIZ (แบบทดสอบทายลำดับขีด) */}
      {/* ======================================================== */}
      {subSection === 'quiz' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                คำถามข้อที่ {quizIdx + 1} จาก {QUIZ_LIST.length}
              </span>
              <h3 className="text-base md:text-lg font-bold text-slate-800 mt-2">
                แบบทดสอบความเข้าใจลำดับขีดอักษรจีน
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-medium">คะแนนสะสม</p>
              <p className="text-lg font-black text-rose-600 font-mono">
                {quizScore} / {QUIZ_LIST.length}
              </p>
            </div>
          </div>

          {/* Question Text */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
            <p className="text-sm md:text-base font-bold text-slate-800 leading-relaxed">
              {QUIZ_LIST[quizIdx].question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {QUIZ_LIST[quizIdx].options.map((optText, optIdx) => {
              const isSelected = quizSelectedOption === optIdx;
              const isCorrect = optIdx === QUIZ_LIST[quizIdx].correctIndex;
              const hasAnswered = quizSelectedOption !== null;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleQuizAnswer(optIdx)}
                  disabled={hasAnswered}
                  className={`w-full p-4 rounded-2xl border text-left text-xs md:text-sm font-semibold transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    hasAnswered
                      ? isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                        : isSelected
                        ? 'border-rose-500 bg-rose-50 text-rose-900'
                        : 'border-slate-200 bg-white text-slate-400'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{optText}</span>
                  {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {hasAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if answered */}
          {quizSelectedOption !== null && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs text-slate-800">คำอธิบายไวยากรณ์ลำดับขีด:</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {QUIZ_LIST[quizIdx].explanation}
              </p>

              <button
                type="button"
                onClick={handleNextQuiz}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ข้อถัดไป</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
