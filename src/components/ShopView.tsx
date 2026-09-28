import React, { useState } from 'react';
import { ShopItem, UserProfile, MascotSkinId } from '../types';
import { SHOP_ITEMS } from '../data/learningData';
import { soundEffects } from '../utils/audio';
import { XiaoBaoMascot } from './XiaoBaoMascot';
import {
  Coins,
  Check,
  Sparkles,
  ShoppingBag,
  Shield,
  Zap,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShopViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  userProfile,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'skins' | 'boosters'>('all');
  const [purchaseSuccessItem, setPurchaseSuccessItem] = useState<string | null>(null);

  const handleBuyOrEquipSkin = (item: ShopItem) => {
    if (!item.skinId) return;

    const isUnlocked = userProfile.unlockedSkins.includes(item.skinId);
    const isEquipped = userProfile.equippedSkin === item.skinId;

    if (isEquipped) return; // already wearing

    if (isUnlocked) {
      // Just equip
      soundEffects.playClick();
      onUpdateProfile({ equippedSkin: item.skinId });
      return;
    }

    // Need to buy
    if (userProfile.coins < item.price) {
      alert(`เหรียญของคุณไม่เพียงพอ! ต้องการอีก ${item.price - userProfile.coins} เหรียญ (ฝึกบทสนทนาและทำแบบฝึกหัดเพื่อรับเหรียญเพิ่ม)`);
      return;
    }

    // Purchase
    soundEffects.playCoin();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    const newCoins = userProfile.coins - item.price;
    const newUnlocked = [...userProfile.unlockedSkins, item.skinId];

    onUpdateProfile({
      coins: newCoins,
      unlockedSkins: newUnlocked,
      equippedSkin: item.skinId,
    });

    setPurchaseSuccessItem(item.nameTh);
    setTimeout(() => setPurchaseSuccessItem(null), 3000);
  };

  const handleBuyBooster = (item: ShopItem) => {
    if (userProfile.coins < item.price) {
      alert(`เหรียญของคุณไม่เพียงพอ! ขาดอีก ${item.price - userProfile.coins} เหรียญ`);
      return;
    }

    soundEffects.playCoin();
    confetti({ particleCount: 30, spread: 50 });

    if (item.id === 'booster_streak_freeze') {
      onUpdateProfile({
        coins: userProfile.coins - item.price,
        streakFreezeCount: userProfile.streakFreezeCount + 1,
      });
    } else {
      onUpdateProfile({
        coins: userProfile.coins - item.price,
      });
    }

    setPurchaseSuccessItem(item.nameTh);
    setTimeout(() => setPurchaseSuccessItem(null), 3000);
  };

  const filteredItems = SHOP_ITEMS.filter(it => {
    if (activeTab === 'skins') return it.category === 'skin';
    if (activeTab === 'boosters') return it.category === 'booster' || it.category === 'privilege';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md inline-flex items-center gap-1.5 mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>VANTA Privilege & Mascot Wardrobe</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            ร้านค้าสะสมเหรียญรางวัล
          </h2>
          <p className="text-xs md:text-sm text-amber-100 mt-1 max-w-md">
            นำเหรียญทองที่ได้จากการตั้งใจเรียนและฝึกพูด มาแต่งตัวให้น้องเป่าเปา และปลดล็อกสิทธิพิเศษช่วยเรียน!
          </p>
        </div>

        {/* Current Coin Balance Card */}
        <div className="bg-white/95 text-slate-800 backdrop-blur-md rounded-3xl p-4 shadow-xl flex items-center gap-4 min-w-[200px] border border-amber-200">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
            <Coins className="w-6 h-6 animate-bounce-slow" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              เหรียญของคุณ
            </p>
            <p className="text-2xl font-black text-amber-600">
              {userProfile.coins} <span className="text-xs text-slate-400 font-bold">เหรียญ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Success alert banner */}
      {purchaseSuccessItem && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>สำเร็จ! คุณได้ปลดล็อก "{purchaseSuccessItem}" เรียบร้อยแล้ว!</span>
        </div>
      )}

      {/* Mascot Preview Showcase */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            ชุดที่สวมใส่อยู่ปัจจุบัน
          </span>
          <h3 className="text-xl font-bold text-slate-800 mt-2">
            ห้องแต่งตัวน้องเป่าเปา (Xiǎo Bǎo Wardrobe)
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            เลือกเปลี่ยนชุดให้น้องเป่าเปาเพื่อความสดใสและเป็นกำลังใจในการเรียนรู้ทุกๆ วัน
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">
              โล่ Streak Freeze ที่มี: <strong className="text-blue-600">{userProfile.streakFreezeCount} อัน</strong>
            </span>
          </div>
        </div>

        {/* Mascot live avatar */}
        <div className="p-2">
          <XiaoBaoMascot
            skin={userProfile.equippedSkin}
            mood="cheering"
            speechBubbleText="ชุดนี้ใส่แล้วมั่นใจ พร้อมติวภาษาจีนให้เธอเต็มที่เลย!"
            size="md"
            showBubble={true}
          />
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-xs max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('skins')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'skins'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ชุดมาสคอต (Skins)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('boosters')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'boosters'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ไอเทมช่วยเรียน (Boosters)
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const isSkin = item.category === 'skin';
          const isUnlocked = isSkin && item.skinId && userProfile.unlockedSkins.includes(item.skinId);
          const isEquipped = isSkin && item.skinId && userProfile.equippedSkin === item.skinId;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Item Icon & Price */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-50 to-rose-50 text-2xl flex items-center justify-center shadow-xs">
                    {item.icon}
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{item.price === 0 ? 'ฟรี' : `${item.price} เหรียญ`}</span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 text-sm">{item.nameTh}</h4>
                <p className="text-[11px] text-slate-400 font-mono">{item.name}</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {item.descriptionTh}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2">
                {isSkin ? (
                  isEquipped ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>กำลังสวมใส่อยู่</span>
                    </button>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => handleBuyOrEquipSkin(item)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>สวมใส่ชุดนี้</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuyOrEquipSkin(item)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>แลกซื้อ ({item.price} เหรียญ)</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBuyBooster(item)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>แลกซื้อ ({item.price} เหรียญ)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
