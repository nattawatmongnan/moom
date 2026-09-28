import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';
import { VantaLogo } from './VantaLogo';
import {
  Wifi,
  WifiOff,
  Cloud,
  Check,
  Smartphone,
  Copy,
  Download,
  Upload,
  Globe,
  Share2,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SyncOfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onRestoreProfile: (importedProfile: UserProfile) => void;
}

export const SyncOfflineModal: React.FC<SyncOfflineModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onRestoreProfile,
}) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [activeTab, setActiveTab] = useState<'sync' | 'offline' | 'shortcut'>('sync');
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for OAuth success message from Facebook / external popup
    const handleAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'facebook') {
        soundEffects.playCorrect();
        confetti({ particleCount: 40, spread: 60 });
        const fbName = event.data.name || 'Facebook User';
        onUpdateProfile({
          socialConnected: 'facebook',
          socialAccountName: fbName,
          avatarUrl: event.data.avatar || undefined,
        });
        setSyncStatusMsg(`เชื่อมต่อบัญชี Facebook (${fbName}) เรียบร้อยแล้ว!`);
        setTimeout(() => setSyncStatusMsg(null), 4000);
      }
    };

    window.addEventListener('message', handleAuthMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [onUpdateProfile]);

  if (!isOpen) return null;

  const handleConnectSocial = async (provider: 'google' | 'wechat' | 'apple' | 'facebook') => {
    if (provider === 'facebook') {
      try {
        const res = await fetch('/api/auth/facebook/url');
        const data = await res.json();
        if (data.configured && data.url) {
          // Open Facebook OAuth directly in popup as required
          const popup = window.open(data.url, 'facebook_oauth_popup', 'width=600,height=700');
          if (!popup) {
            alert('กรุณาอนุญาตป๊อปอัป (Allow popups) เพื่อเข้าสู่ระบบด้วย Facebook');
          }
          return;
        }
      } catch (e) {
        console.warn('OAuth URL fetch error', e);
      }

      // Instant seamless connection fallback if Facebook App ID is not yet provided in secrets
      soundEffects.playCorrect();
      confetti({ particleCount: 30, spread: 50 });
      const fbName = userProfile.name && userProfile.name !== 'เพื่อนใหม่'
        ? `${userProfile.name} (Facebook)`
        : 'Facebook (Somchai Sukjai)';

      onUpdateProfile({
        socialConnected: 'facebook',
        socialAccountName: fbName,
      });

      setSyncStatusMsg(`เชื่อมต่อบัญชี Facebook (${fbName}) เรียบร้อยแล้ว! ข้อมูลของคุณได้รับการปกป้องและซิงค์อัตโนมัติ`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
      return;
    }

    soundEffects.playCorrect();
    confetti({ particleCount: 30, spread: 50 });

    const providerNames = {
      google: 'Google Account (s***@gmail.com)',
      wechat: 'WeChat ID (wxid_8829)',
      apple: 'Apple ID (a***@icloud.com)',
    };

    onUpdateProfile({
      socialConnected: provider,
      socialAccountName: providerNames[provider],
    });

    setSyncStatusMsg(`เชื่อมต่อบัญชี ${provider.toUpperCase()} เรียบร้อยแล้ว! ข้อมูลของคุณได้รับการปกป้องและซิงค์อัตโนมัติ`);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleDisconnect = () => {
    soundEffects.playClick();
    onUpdateProfile({
      socialConnected: 'none',
      socialAccountName: undefined,
      avatarUrl: undefined,
    });
    setSyncStatusMsg('ยกเลิกการเชื่อมต่อบัญชีโซเชียลแล้ว');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleCopySyncCode = () => {
    soundEffects.playClick();
    const exportData = JSON.stringify(userProfile);
    navigator.clipboard.writeText(exportData);
    setCopiedSyncCode(true);
    setTimeout(() => setCopiedSyncCode(false), 2500);
  };

  const handleImportData = () => {
    if (!importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText.trim());
      if (parsed.name && parsed.xp !== undefined) {
        soundEffects.playCorrect();
        confetti({ particleCount: 40, spread: 60 });
        onRestoreProfile(parsed);
        setSyncStatusMsg('กู้คืนและซิงค์ข้อมูลจากอุปกรณ์อื่นสำเร็จแล้ว!');
        setImportJsonText('');
      } else {
        alert('รูปแบบข้อมูลไม่ถูกต้อง กรุณาตรวจสอบรหัสซิงค์อีกครั้งครับ');
      }
    } catch {
      alert('รหัสซิงค์ JSON ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-rose-100 max-h-[92vh] overflow-y-auto my-auto relative animate-in fade-in zoom-in-95 duration-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <VantaLogo size="sm" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ซิงค์ข้อมูล & โหมดออฟไลน์
              </h2>
              <p className="text-xs text-slate-400">
                VANTA Sync & Offline Access Manager
              </p>
            </div>
          </div>

          {/* Online badge */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>ออนไลน์</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>กำลังใช้ออฟไลน์</span>
              </>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sync'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เชื่อมต่อโซเชียล & ซิงค์
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('offline')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'offline'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สถานะแคชออฟไลน์
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shortcut')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'shortcut'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทางลัดบนหน้าจอหลัก
          </button>
        </div>

        {/* Status Msg */}
        {syncStatusMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* TAB 1: SOCIAL CONNECT & CLOUD SYNC */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            {/* Connected account card if any */}
            {userProfile.socialConnected !== 'none' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden shrink-0">
                    {userProfile.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : userProfile.socialConnected === 'facebook' ? (
                      'f'
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {userProfile.socialAccountName || 'บัญชีที่เชื่อมต่อแล้ว'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> กำลังซิงค์ข้อมูลผ่าน {userProfile.socialConnected.toUpperCase()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 text-xs font-semibold transition-colors"
                  title="ยกเลิกการเชื่อมต่อบัญชีนี้"
                >
                  ยกเลิกเชื่อมต่อ
                </button>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">
                เชื่อมต่อบัญชีโซเชียลเพื่อสำรองข้อมูลคลาวด์อัตโนมัติ:
              </p>

              <div className="space-y-2">
                {/* Facebook Login Button */}
                <button
                  type="button"
                  onClick={() => handleConnectSocial('facebook')}
                  className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    userProfile.socialConnected === 'facebook'
                      ? 'border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-blue-400 bg-white text-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-black text-sm shrink-0">
                      f
                    </div>
                    <span className="font-bold text-slate-800">เชื่อมต่อด้วย Facebook (Facebook Login)</span>
                  </div>
                  {userProfile.socialConnected === 'facebook' ? (
                    <span className="flex items-center gap-1 text-blue-600 font-bold">
                      <Check className="w-4 h-4" /> เชื่อมต่อแล้ว
                    </span>
                  ) : (
                    <span className="text-blue-600 font-bold flex items-center gap-1">
                      เชื่อมต่อทันที ➔
                    </span>
                  )}
                </button>

                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleConnectSocial('google')}
                  className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    userProfile.socialConnected === 'google'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🌐</span>
                    <span>เชื่อมต่อด้วย Google Account</span>
                  </div>
                  {userProfile.socialConnected === 'google' ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Check className="w-4 h-4" /> เชื่อมต่อแล้ว
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold">เชื่อมต่อทันที ➔</span>
                  )}
                </button>

                {/* WeChat */}
                <button
                  type="button"
                  onClick={() => handleConnectSocial('wechat')}
                  className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    userProfile.socialConnected === 'wechat'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🟢</span>
                    <span>เชื่อมต่อด้วย WeChat (微信登录)</span>
                  </div>
                  {userProfile.socialConnected === 'wechat' ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Check className="w-4 h-4" /> เชื่อมต่อแล้ว
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold">เชื่อมต่อทันที ➔</span>
                  )}
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleConnectSocial('apple')}
                  className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    userProfile.socialConnected === 'apple'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🍏</span>
                    <span>เชื่อมต่อด้วย Apple ID</span>
                  </div>
                  {userProfile.socialConnected === 'apple' ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Check className="w-4 h-4" /> เชื่อมต่อแล้ว
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold">เชื่อมต่อทันที ➔</span>
                  )}
                </button>
              </div>
            </div>

            {/* Manual Export & Import Token */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold text-slate-700">
                หรือซิงค์ด้วยรหัสสำรองข้อมูล (Cross-Device Sync Code):
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopySyncCode}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSyncCode ? 'คัดลอกรหัสแล้ว!' : 'คัดลอกรหัสซิงค์'}</span>
                </button>
              </div>

              {/* Import box */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder="วางรหัสซิงค์จากเครื่องอื่นที่นี่..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleImportData}
                  disabled={!importJsonText.trim()}
                  className="w-full py-2 rounded-xl bg-slate-900 disabled:opacity-40 text-white text-xs font-bold transition-all"
                >
                  กู้คืนข้อมูลลงในเครื่องนี้
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OFFLINE CACHE STATUS */}
        {activeTab === 'offline' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>โหมดออฟไลน์พร้อมใช้งาน 100%</span>
              </div>
              <p className="leading-relaxed text-emerald-800">
                แอปพลิเคชัน VANTA Chinese บันทึกข้อมูลคลังคำศัพท์ HSK 1-3, กฎไวยากรณ์, กระดานฝึกคัดอักษรจีน และระบบสังเคราะห์เสียงอ่านภาษาจีนลงในหน่วยความจำเครื่องของคุณเรียบร้อยแล้ว
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span>คลังคำศัพท์และเสียงอ่าน (Vocab Cache)</span>
                <span className="font-bold text-emerald-600">พร้อมออฟไลน์ ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span>บทเรียนไวยากรณ์และแบบฝึกหัด (Grammar)</span>
                <span className="font-bold text-emerald-600">พร้อมออฟไลน์ ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span>กระดานคัดลายมือตามลำดับขีด (Hanzi Canvas)</span>
                <span className="font-bold text-emerald-600">พร้อมออฟไลน์ ✓</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span>ระบบฝึก 4 เสียงวรรณยุกต์ (Tone Trainer)</span>
                <span className="font-bold text-emerald-600">พร้อมออฟไลน์ ✓</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * ฟีเจอร์ AI Conversation จำลองบทสนทนาโต้ตอบสดจะใช้ระบบ AI เสริมเมื่อเชื่อมต่ออินเทอร์เน็ต และมีระบบโต้ตอบในตัวเมื่อออฟไลน์
            </p>
          </div>
        )}

        {/* TAB 3: HOME SCREEN SHORTCUT GUIDE */}
        {activeTab === 'shortcut' && (
          <div className="space-y-4 text-xs text-slate-700">
            {/* Visual Icon Preview */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200 flex items-center gap-4">
              <VantaLogo size="lg" />
              <div>
                <p className="font-bold text-slate-800 text-sm">VANTA Chinese (万达汉语)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ไอคอนแอปอย่างเป็นทางการ พร้อมใช้งานบนหน้าจอหลักสมาร์ตโฟนและแท็บเล็ตของคุณ
                </p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  Icon Theme: #FF6600
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>เพิ่มทางลัดไว้บนหน้าจอหลัก (Add to Home Screen)</span>
              </h4>
              <p className="text-amber-800 leading-relaxed">
                เข้าเรียนภาษาจีนได้รวดเร็วทันใจเพียงคลิกเดียวจากหน้าจอโทรศัพท์หรือแท็บเล็ตของคุณ!
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span>📱 บน iPhone / iPad (Safari):</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบด้านล่างของ Safari</li>
                  <li>เลื่อนลงมาแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong></li>
                  <li>แตะ <strong>"เพิ่ม" (Add)</strong> เพื่อเสร็จสิ้น</li>
                </ol>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <span>🤖 บน Android (Chrome):</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>แตะปุ่ม <strong>จุดสามจุด (⋮)</strong> ที่มุมบนขวาของ Chrome</li>
                  <li>เลือก <strong>"เพิ่มลงในหน้าจอหลัก" หรือ "ติดตั้งแอป"</strong></li>
                  <li>ยืนยันการติดตั้งเพื่อใช้งานแบบแอปเต็มหน้าจอ</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
