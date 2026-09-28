import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VocabWord, GrammarPoint } from '../types';
import { VOCAB_DATABASE, GRAMMAR_DATABASE } from '../data/learningData';
import { speakChinese, soundEffects } from '../utils/audio';
import { HanziCanvas } from './HanziCanvas';
import { ToneTrainer } from './ToneTrainer';
import { StrokeOrderTrainer } from './StrokeOrderTrainer';
import {
  Volume2,
  RotateCw,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  PenTool,
  BookmarkCheck,
  Zap,
  ListOrdered,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VocabStudyViewProps {
  masteredWordIds: string[];
  masteredGrammarIds: string[];
  onMarkWordMastered: (wordId: string) => void;
  onMarkGrammarMastered: (grammarId: string) => void;
  onEarnRewards: (xp: number, coins: number) => void;
  initialSubTab?: 'flashcard' | 'order' | 'strokes' | 'grammar' | 'tones';
}

export const VocabStudyView: React.FC<VocabStudyViewProps> = ({
  masteredWordIds,
  masteredGrammarIds,
  onMarkWordMastered,
  onMarkGrammarMastered,
  onEarnRewards,
  initialSubTab,
}) => {
  const [activeTab, setActiveTab] = useState<'flashcard' | 'order' | 'strokes' | 'grammar' | 'tones'>(initialSubTab || 'flashcard');

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slowAudio, setSlowAudio] = useState(false);
  const [grammarIdx, setGrammarIdx] = useState(0);
  const [grammarAnswerSelected, setGrammarAnswerSelected] = useState<number | null>(null);

  const currentWord = VOCAB_DATABASE[currentWordIdx];
  const isMastered = masteredWordIds.includes(currentWord.id);

  const currentGrammar = GRAMMAR_DATABASE[grammarIdx];
  const isGrammarMastered = masteredGrammarIds.includes(currentGrammar.id);

  const handleNextWord = () => {
    soundEffects.playClick();
    setIsFlipped(false);
    setCurrentWordIdx(prev => (prev + 1) % VOCAB_DATABASE.length);
  };

  const handlePrevWord = () => {
    soundEffects.playClick();
    setIsFlipped(false);
    setCurrentWordIdx(prev => (prev - 1 + VOCAB_DATABASE.length) % VOCAB_DATABASE.length);
  };

  const handleFlipCard = () => {
    soundEffects.playClick();
    setIsFlipped(prev => !prev);
  };

  const handleMasterCurrentWord = () => {
    soundEffects.playCorrect();
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#F43F5E', '#F59E0B'],
    });
    onMarkWordMastered(currentWord.id);
    onEarnRewards(15, 5);
    handleNextWord();
  };

  const handleGrammarQuiz = (optIdx: number) => {
    if (grammarAnswerSelected !== null) return;
    setGrammarAnswerSelected(optIdx);

    if (optIdx === currentGrammar.quiz.correctIndex) {
      soundEffects.playCorrect();
      confetti({ particleCount: 35, spread: 60 });
      onMarkGrammarMastered(currentGrammar.id);
      onEarnRewards(25, 8);
    } else {
      soundEffects.playClick();
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header Tabs */}
      <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('flashcard');
            }}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'flashcard'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>การ์ดคำศัพท์ (Flashcards)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('order');
            }}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'order'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>ฝึกลำดับขีด (Stroke Order)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('strokes');
            }}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'strokes'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>ฝึกคัดลายมือ (Strokes)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('tones');
            }}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'tones'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>ฝึก 4 เสียงวรรณยุกต์</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('grammar');
            }}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'grammar'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>สรุปไวยากรณ์ (Grammar)</span>
          </button>
        </div>

        {/* Speed toggle for audio */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-xs text-slate-500">
          <span>ความเร็วเสียง:</span>
          <button
            type="button"
            onClick={() => setSlowAudio(!slowAudio)}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
              slowAudio ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}
            title="คลิกเพื่อสลับความเร็วเสียง"
          >
            {slowAudio ? '0.7x ช้าชัด' : '1.0x ปกติ'}
          </button>
        </div>
      </div>

      {/* TAB 1: FLASHCARDS */}
      {activeTab === 'flashcard' && (
        <div className="max-w-xl mx-auto space-y-4">
          {/* Progress indicators */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>คำที่ {currentWordIdx + 1} จาก {VOCAB_DATABASE.length}</span>
            <span className="flex items-center gap-1">
              {isMastered ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> จำได้แล้ว
                </span>
              ) : (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> กำลังฝึกฝน
                </span>
              )}
            </span>
          </div>

          {/* 3D Interactive Flashcard */}
          <div
            onClick={handleFlipCard}
            className="w-full min-h-[340px] md:min-h-[380px] bg-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-rose-100 hover:border-rose-300 transition-all cursor-pointer relative flex flex-col justify-between select-none"
          >
            {/* Top pill badges */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                {currentWord.level} • {currentWord.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> แตะเพื่อพลิกดูคำแปล
              </span>
            </div>

            {/* Front & Back Content */}
            {!isFlipped ? (
              /* FRONT: Chinese Character & Sound */
              <div className="text-center my-auto py-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={currentWord.hanzi}
                  className="space-y-4"
                >
                  <p className="text-6xl md:text-8xl font-bold font-hanzi text-slate-800 tracking-wide">
                    {currentWord.hanzi}
                  </p>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(currentWord.hanzi, slowAudio);
                      }}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold text-sm shadow-md shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
                      title="ฟังเสียงอ่าน"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>ฟังเสียงอ่าน (发音)</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    หมวดอักษร: {currentWord.radical} • {currentWord.strokeCount} ขีด
                  </p>
                </motion.div>
              </div>
            ) : (
              /* BACK: Pinyin, Meaning, Mnemonic & Sentence */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="my-auto py-2 space-y-4"
              >
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-rose-600 tracking-wider">
                    {currentWord.pinyin}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {currentWord.thai}
                  </p>
                </div>

                {/* Mnemonic Tip */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>เทคนิคช่วยจำ (Mnemonic Hint):</span>
                  </p>
                  <p className="leading-relaxed">{currentWord.mnemonicTh}</p>
                </div>

                {/* Example sentence */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-500">ตัวอย่างประโยค:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(currentWord.exampleSentence.zh, slowAudio);
                      }}
                      className="text-rose-600 hover:text-rose-700 p-1"
                      title="ฟังประโยคตัวอย่าง"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-medium font-hanzi text-slate-800">
                    {currentWord.exampleSentence.zh}
                  </p>
                  <p className="text-xs text-rose-600 font-mono mt-0.5">
                    {currentWord.exampleSentence.pinyin}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {currentWord.exampleSentence.th}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Bottom Controls inside card */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">ระดับเสียงที่ {currentWord.tone}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMasterCurrentWord();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>จำคำนี้ได้แล้ว (+15 XP)</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between gap-3 px-2">
            <button
              type="button"
              onClick={handlePrevWord}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>คำก่อนหน้า</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsFlipped(prev => !prev);
              }}
              className="px-5 py-2.5 rounded-2xl bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              {isFlipped ? 'ดูตัวอักษรจีน' : 'ดูคำแปล & พินอิน'}
            </button>

            <button
              type="button"
              onClick={handleNextWord}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>คำถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB: STROKE ORDER TRAINER */}
      {activeTab === 'order' && (
        <StrokeOrderTrainer
          onEarnRewards={onEarnRewards}
          onNavigateToHandwriting={(idx) => {
            setCurrentWordIdx(idx);
            setActiveTab('strokes');
          }}
        />
      )}

      {/* TAB 2: STROKE CANVAS */}
      {activeTab === 'strokes' && (
        <div className="max-w-md mx-auto space-y-4">
          <HanziCanvas
            hanzi={currentWord.hanzi}
            pinyin={currentWord.pinyin}
            thai={currentWord.thai}
            strokes={currentWord.strokes}
            strokeCount={currentWord.strokeCount}
            onSuccess={() => onEarnRewards(20, 5)}
          />

          {/* Word Switcher */}
          <div className="flex items-center justify-between px-2">
            <button
              type="button"
              onClick={handlePrevWord}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> คำก่อนหน้า
            </button>
            <span className="text-xs text-slate-400">
              {currentWordIdx + 1} / {VOCAB_DATABASE.length}
            </span>
            <button
              type="button"
              onClick={handleNextWord}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              คำถัดไป <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: TONE TRAINER */}
      {activeTab === 'tones' && (
        <ToneTrainer onEarnReward={(xp, coins) => onEarnRewards(xp, coins)} />
      )}

      {/* TAB 4: GRAMMAR LESSONS */}
      {activeTab === 'grammar' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-md space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {currentGrammar.level}
                </span>
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mt-2">
                  {currentGrammar.titleTh}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{currentGrammar.title}</p>
              </div>

              {isGrammarMastered && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> ผ่านแล้ว
                </span>
              )}
            </div>

            {/* Structure Formula */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-900">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wide block mb-1">
                สูตรโครงสร้างประโยค
              </span>
              <p className="text-sm md:text-base font-bold font-mono">{currentGrammar.structure}</p>
            </div>

            {/* Explanation */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                คำอธิบายและหลักการใช้
              </h4>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                {currentGrammar.explanationTh}
              </p>
              <ul className="mt-2 space-y-1">
                {currentGrammar.usageNotesTh.map((note, idx) => (
                  <li key={idx} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Example Sentences */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                ประโยคตัวอย่างน่ารู้
              </h4>
              <div className="space-y-2">
                {currentGrammar.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-hanzi text-sm font-bold text-slate-800">{ex.zh}</p>
                      <p className="text-xs text-rose-600 font-mono">{ex.pinyin}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{ex.th}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakChinese(ex.zh, slowAudio)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-white transition-colors"
                      title="ฟังเสียงประโยคนี้"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Check Quiz */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span>🎯 แบบทดสอบความเข้าใจสั้นๆ</span>
              </h4>
              <p className="text-xs md:text-sm font-semibold text-slate-800 mb-3">
                {currentGrammar.quiz.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentGrammar.quiz.options.map((opt, optIdx) => {
                  const isSelected = grammarAnswerSelected === optIdx;
                  const isCorrect = optIdx === currentGrammar.quiz.correctIndex;

                  let style = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-rose-300';
                  if (grammarAnswerSelected !== null) {
                    if (isCorrect) {
                      style = 'bg-emerald-500 border-emerald-600 text-white font-bold';
                    } else if (isSelected) {
                      style = 'bg-rose-500 border-rose-600 text-white';
                    } else {
                      style = 'bg-slate-50 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleGrammarQuiz(optIdx)}
                      disabled={grammarAnswerSelected !== null}
                      className={`p-3 rounded-xl border text-xs text-left transition-all ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {grammarAnswerSelected !== null && (
                <div className="mt-3 p-3 rounded-xl bg-slate-100 text-xs text-slate-700">
                  <span className="font-bold">เฉลย: </span>
                  {currentGrammar.quiz.explanation}
                </div>
              )}
            </div>

            {/* Grammar Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setGrammarAnswerSelected(null);
                  setGrammarIdx(prev => (prev - 1 + GRAMMAR_DATABASE.length) % GRAMMAR_DATABASE.length);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> ไวยากรณ์ก่อนหน้า
              </button>
              <span className="text-xs text-slate-400">
                {grammarIdx + 1} / {GRAMMAR_DATABASE.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setGrammarAnswerSelected(null);
                  setGrammarIdx(prev => (prev + 1) % GRAMMAR_DATABASE.length);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                ไวยากรณ์ถัดไป <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
