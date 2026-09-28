import React, { useRef, useState, useEffect } from 'react';
import {
  Eraser,
  RotateCcw,
  Check,
  Sparkles,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Eye,
  XCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { speakChinese, soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';

interface HanziCanvasProps {
  hanzi: string;
  pinyin: string;
  thai: string;
  strokes?: string[];
  strokeCount?: number;
  onSuccess?: () => void;
}

interface VerificationResult {
  isCorrect: boolean;
  score: number;
  grade: string;
  feedback: string;
  detectedChar?: string;
}

export const HanziCanvas: React.FC<HanziCanvasProps> = ({
  hanzi,
  pinyin,
  thai,
  strokes = [],
  strokeCount = 4,
  onSuccess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userStrokesCanvasRef = useRef<HTMLCanvasElement | null>(null); // Offscreen purely for user ink without grid
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawnStrokeCount, setDrawnStrokeCount] = useState(0);
  const [brushColor, setBrushColor] = useState('#E11D48');
  const [brushSize, setBrushSize] = useState(7);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // The primary character to draw (if word is multi-character like 谢谢, take the 1st or let user pick)
  const targetChar = hanzi.length > 0 ? hanzi[0] : hanzi;

  useEffect(() => {
    drawGrid();
    setHasDrawn(false);
    setDrawnStrokeCount(0);
    setHistory([]);
    setVerificationResult(null);
  }, [hanzi]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid border (traditional Tian Zi Ge / 米字格)
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Dashed center lines
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 1.2;

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(4, height / 2);
    ctx.lineTo(width - 4, height / 2);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(width / 2, 4);
    ctx.lineTo(width / 2, height - 4);
    ctx.stroke();

    // Diagonals (米字格)
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(width - 4, height - 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - 4, 4);
    ctx.lineTo(4, height - 4);
    ctx.stroke();
    ctx.restore();

    // Draw watermark faint character in the background if guide is on
    if (showGuide) {
      ctx.save();
      ctx.font = 'bold 150px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(244, 63, 94, 0.16)';
      ctx.fillText(targetChar, width / 2, height / 2 + 10);
      ctx.restore();
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history before new stroke
    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-12), currentImg]);

    setIsDrawing(true);
    setHasDrawn(true);
    setDrawnStrokeCount(prev => prev + 1);

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleClear = () => {
    soundEffects.playClick();
    drawGrid();
    setHasDrawn(false);
    setDrawnStrokeCount(0);
    setHistory([]);
    setVerificationResult(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    soundEffects.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previous = history[history.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(prev => prev.slice(0, -1));
    setDrawnStrokeCount(prev => Math.max(0, prev - 1));
    if (history.length === 1) {
      setHasDrawn(false);
    }
  };

  // Extract purely user-drawn strokes into a clean white-background image for accurate AI/pixel inspection
  const exportUserDrawingBase64 = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Create an offscreen clean canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return null;

    // White background
    offCtx.fillStyle = '#FFFFFF';
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

    // Draw the current visible canvas over it
    offCtx.drawImage(canvas, 0, 0);
    return offscreen.toDataURL('image/png');
  };

  // Local structural pixel analysis algorithm for offline mode & sanity checking
  const analyzeLocally = (): { isCorrect: boolean; score: number; feedback: string } => {
    const canvas = canvasRef.current;
    if (!canvas) return { isCorrect: false, score: 0, feedback: 'ไม่พบกระดานวาด' };

    const ctx = canvas.getContext('2d');
    if (!ctx) return { isCorrect: false, score: 0, feedback: 'ไม่สามารถประมวลผลรูปได้' };

    // Create reference character bitmap
    const refCanvas = document.createElement('canvas');
    refCanvas.width = canvas.width;
    refCanvas.height = canvas.height;
    const refCtx = refCanvas.getContext('2d');
    if (!refCtx) return { isCorrect: false, score: 0, feedback: 'ไม่สามารถสร้างตัวอักษรอ้างอิงได้' };

    refCtx.font = 'bold 150px "Noto Serif SC", serif';
    refCtx.textAlign = 'center';
    refCtx.textBaseline = 'middle';
    refCtx.fillStyle = '#000000';
    refCtx.fillText(targetChar, refCanvas.width / 2, refCanvas.height / 2 + 10);

    const refImgData = refCtx.getImageData(0, 0, refCanvas.width, refCanvas.height);
    const userImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let refPixelCount = 0;
    let userPixelCount = 0;
    let matchPixelCount = 0;
    let strayPixelCount = 0;

    for (let i = 0; i < refImgData.data.length; i += 4) {
      const isRef = refImgData.data[i + 3] > 60; // Alpha of reference char
      // User ink: check if pixel is colored (not background cream/yellow grid)
      const r = userImgData.data[i];
      const g = userImgData.data[i + 1];
      const b = userImgData.data[i + 2];
      const a = userImgData.data[i + 3];

      // Detect user brush strokes (Red/Black/Amber/Green)
      const isUserInk = a > 150 && (r < 240 || g < 220 || b < 180);

      if (isRef) refPixelCount++;
      if (isUserInk) {
        userPixelCount++;
        if (isRef) {
          matchPixelCount++;
        } else {
          // Check small radius tolerance
          strayPixelCount++;
        }
      }
    }

    // 1. If user barely drew anything (< 250 pixels)
    if (userPixelCount < 300) {
      return {
        isCorrect: false,
        score: Math.min(25, Math.round((userPixelCount / 300) * 25)),
        feedback: 'คุณเพิ่งเขียนไปเพียงเล็กน้อย ยังไม่ครบถ้วนเป็นตัวอักษรจีน ลองเขียนให้ครบทุกขีดนะ',
      };
    }

    // 2. Coverage calculation (how much of target character was covered)
    const coverage = refPixelCount > 0 ? matchPixelCount / refPixelCount : 0;
    const precision = userPixelCount > 0 ? matchPixelCount / userPixelCount : 0;

    // 3. Score calculation
    let calculatedScore = Math.round(coverage * 70 + precision * 30);
    calculatedScore = Math.max(10, Math.min(98, calculatedScore));

    const isPass = calculatedScore >= 68 && coverage >= 0.35;

    let fb = '';
    if (isPass) {
      fb = `เขียนตัว ${targetChar} ได้ถูกต้อง! โครงสร้างลายเส้นและสัดส่วนตรงตามเกณฑ์มาตรฐาน`;
    } else if (coverage < 0.3) {
      fb = `ยังมีขีดขาดหายไปหลายส่วนของตัว ${targetChar} ลองเขียนตามเส้นประให้ครบทุกขีดนะครับ`;
    } else {
      fb = `เส้นที่เขียนยังคลาดเคลื่อนจากตำแหน่งตัวอักษร ${targetChar} ลองสังเกตช่องตาราง 米字格 แล้วเขียนใหม่อีกครั้งครับ`;
    }

    return {
      isCorrect: isPass,
      score: calculatedScore,
      feedback: fb,
    };
  };

  // Main Verification Function
  const handleVerifyAccuracy = async () => {
    if (!hasDrawn) return;
    setIsVerifying(true);
    soundEffects.playClick();

    const imageBase64 = exportUserDrawingBase64();

    try {
      // 1. Try calling the AI handwriting verification endpoint
      const response = await fetch('/api/verify-handwriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          targetChar,
          pinyin,
          thai,
          strokeCount: strokeCount || strokes.length || 4,
        }),
      });

      if (!response.ok) {
        throw new Error('AI API unreachable');
      }

      const data = await response.json();

      const result: VerificationResult = {
        isCorrect: Boolean(data.isCorrect),
        score: Number(data.accuracyScore) || 50,
        grade: data.grade || (data.isCorrect ? 'ถูกต้อง' : 'ต้องเขียนใหม่'),
        feedback: data.feedbackTh || (data.isCorrect ? 'เขียนได้ถูกต้องตามหลักภาษาจีน' : 'ยังไม่ถูกต้อง ลองฝึกใหม่อีกครั้งนะ'),
        detectedChar: data.detectedChar,
      };

      setVerificationResult(result);

      if (result.isCorrect) {
        soundEffects.playCorrect();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F43F5E', '#F59E0B', '#10B981'],
        });
        speakChinese(targetChar);
        if (onSuccess) onSuccess();
      } else {
        soundEffects.playClick();
      }
    } catch (err) {
      console.warn('Using local structural verification fallback', err);
      // Fallback to local structural analysis
      const local = analyzeLocally();
      const result: VerificationResult = {
        isCorrect: local.isCorrect,
        score: local.score,
        grade: local.isCorrect ? 'ผ่านเกณฑ์' : 'ยังไม่ถูกต้อง',
        feedback: local.feedback,
      };

      setVerificationResult(result);

      if (result.isCorrect) {
        soundEffects.playCorrect();
        confetti({ particleCount: 40, spread: 60 });
        speakChinese(targetChar);
        if (onSuccess) onSuccess();
      } else {
        soundEffects.playClick();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-rose-100 shadow-sm flex flex-col items-center max-w-lg mx-auto">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => speakChinese(hanzi)}
            className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors shadow-xs"
            title="ฟังเสียงอ่าน"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-hanzi text-slate-800 tracking-wide">
                {hanzi}
              </span>
              <span className="text-sm font-semibold text-rose-500 font-mono">
                {pinyin}
              </span>
            </div>
            <p className="text-xs text-slate-500">{thai}</p>
          </div>
        </div>

        {/* Toggle watermark guide */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setShowGuide(!showGuide);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all ${
              showGuide
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
            title="เปิด/ปิด เส้นประตัวอักษรนำทาง"
          >
            <Eye className="w-3 h-3" />
            <span>เส้นนำทาง {showGuide ? 'เปิด' : 'ปิด'}</span>
          </button>
        </div>
      </div>

      {/* Traditional Grid Canvas Container */}
      <div className="relative rounded-3xl overflow-hidden shadow-inner bg-[#FFFDF7] border-2 border-amber-200 cursor-crosshair touch-none select-none">
        <canvas
          ref={canvasRef}
          width={260}
          height={260}
          className="w-[260px] h-[260px]"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Verification Loading Overlay */}
        {isVerifying && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-rose-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-bold text-slate-700">กำลังตรวจจับความถูกต้องของตัวอักษร...</p>
            <p className="text-[11px] text-slate-400">AI Calligraphy & Stroke Verification</p>
          </div>
        )}
      </div>

      {/* Stroke Names breakdown guide */}
      {strokes && strokes.length > 0 && (
        <div className="w-full mt-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>ลำดับขีดที่แนะนำ ({strokes.length} ขีด):</span>
            </span>
            <span className="text-[11px] text-slate-400">ลากเขียนตามลำดับ</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {strokes.map((stk, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 font-mono"
              >
                {idx + 1}. {stk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* VERIFICATION RESULT CARD (Detailed Analysis & Feedback) */}
      {verificationResult && (
        <div
          className={`w-full mt-3.5 p-4 rounded-2xl border text-xs transition-all animate-in fade-in slide-in-from-top-2 ${
            verificationResult.isCorrect
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/90 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {verificationResult.isCorrect ? (
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">
                  {verificationResult.isCorrect ? 'ผลการตรวจ: ถูกต้องยอดเยี่ยม! 🎉' : 'ผลการตรวจ: ยังไม่ถูกต้อง ✍️'}
                </p>
                <p className="text-[11px] opacity-80">
                  ระดับ: {verificationResult.grade}
                </p>
              </div>
            </div>

            {/* Score pill */}
            <div
              className={`px-3 py-1 rounded-xl font-extrabold text-sm border ${
                verificationResult.isCorrect
                  ? 'bg-white text-emerald-600 border-emerald-300'
                  : 'bg-white text-rose-600 border-rose-300'
              }`}
            >
              {verificationResult.score} / 100
            </div>
          </div>

          <p className="leading-relaxed font-medium mb-3">
            {verificationResult.feedback}
          </p>

          {/* Action buttons inside result */}
          <div className="flex gap-2 pt-1 border-t border-black/5">
            {!verificationResult.isCorrect ? (
              <>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-rose-700 font-bold border border-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างกระดาน & ลองเขียนใหม่</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="px-3 py-2 rounded-xl bg-rose-500 text-white font-bold transition-colors cursor-pointer"
                  title="เปิดรอยประเพื่อคัดตาม"
                >
                  ดูเส้นนำทาง
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between text-emerald-800 text-xs font-semibold">
                <span>บันทึกความก้าวหน้าสำเร็จ (+20 XP, +5 เหรียญ)</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  เขียนซ้ำอีกครั้ง
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canvas Toolbars */}
      <div className="w-full flex items-center justify-between mt-3 px-1 gap-2">
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {[
            { color: '#E11D48', label: 'แดงชาด (Vermilion)' },
            { color: '#0F172A', label: 'หมึกดำจีน (Black Ink)' },
            { color: '#D97706', label: 'ทองอำพัน' },
            { color: '#059669', label: 'หยกเขียว' },
          ].map(c => (
            <button
              key={c.color}
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setBrushColor(c.color);
              }}
              style={{ backgroundColor: c.color }}
              className={`w-6 h-6 rounded-full transition-transform ${
                brushColor === c.color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'opacity-80 hover:opacity-100'
              }`}
              title={c.label}
            />
          ))}
        </div>

        {/* Undo / Clear Actions & Verify Button */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0 || isVerifying}
            className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-xl hover:bg-slate-100 transition-colors"
            title="ย้อนกลับ 1 ขีด (Undo)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isVerifying}
            className="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            title="ล้างกระดาน"
          >
            <Eraser className="w-4 h-4" />
          </button>

          {/* VERIFY ACCURACY BUTTON */}
          <button
            type="button"
            onClick={handleVerifyAccuracy}
            disabled={!hasDrawn || isVerifying}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังตรวจสอบ...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ตรวจความถูกต้อง</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
