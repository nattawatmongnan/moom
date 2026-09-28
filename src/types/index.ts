export type AgeGroup = 'kids' | 'teens' | 'young_adults' | 'adults' | 'seniors';

export type DifficultyLevel = 'beginner_zero' | 'hsk1' | 'hsk2' | 'hsk3';

export type MascotSkinId = 'scholar' | 'chef' | 'dragon' | 'cyberpunk' | 'tea_master';

export interface DailyQuest {
  id: string;
  title: string;
  titleTh: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
  type: 'words' | 'conversation' | 'stroke' | 'quiz' | 'streak';
}

export type UserRole = 'teacher' | 'student' | 'other';
export type GenderType = 'male' | 'female' | 'non_binary' | 'unspecified';

export interface UserProfile {
  name: string;
  role: UserRole;
  age: number;
  ageGroup: AgeGroup;
  difficultyLevel: DifficultyLevel;
  dailyGoalMinutes: number;
  interests: string[];
  streak: number;
  lastActiveDate: string;
  xp: number;
  level: number;
  coins: number;
  streakFreezeCount: number;
  equippedSkin: MascotSkinId;
  unlockedSkins: MascotSkinId[];
  wordsMastered: string[];
  wordsReviewQueue: string[];
  grammarMastered: string[];
  dailyQuests: DailyQuest[];
  remindersEnabled: boolean;
  reminderTime: string;
  todayMinutesLearned: number;
  todayWordsLearned: number;
  socialConnected: 'none' | 'google' | 'wechat' | 'apple' | 'facebook';
  socialAccountName?: string;
  avatarUrl?: string;
  bio?: string;
  gender?: GenderType;
  caption?: string;
  equippedFrame?: string;
  unlockedFrames?: string[];
  eventPoints?: number;
  claimedEventMilestones?: number[];
}

export interface AvatarFrame {
  id: string;
  nameTh: string;
  nameZh: string;
  desc: string;
  price: number;
  icon: string;
  borderClass: string;
  glowClass: string;
  badge: string;
  isLimited?: boolean;
}

export interface EventQuest {
  id: string;
  titleTh: string;
  titleZh: string;
  descTh: string;
  points: number;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  type: 'vocab' | 'conversation' | 'stroke' | 'arena' | 'login';
}

export interface EventMilestone {
  pointsRequired: number;
  rewardType: 'coins' | 'streak_freeze' | 'frame' | 'badge';
  rewardValue: string | number;
  rewardName: string;
  icon: string;
}

export interface SeasonalEvent {
  id: string;
  titleTh: string;
  titleZh: string;
  subtitle: string;
  bannerImage?: string;
  startDate: string;
  endDate: string;
  themeColor: string;
  quests: EventQuest[];
  milestones: EventMilestone[];
}

export type GameMode = 'fill_blank' | 'translation' | 'pinyin_match' | 'mixed';
export type TimePerQuestion = 10 | 15 | 20 | 30 | 45 | 60;

export interface RoomQuestionOption {
  id: string;
  text: string;
  pinyin?: string;
  thai?: string;
  color: 'rose' | 'sky' | 'amber' | 'emerald';
}

export interface RoomQuestion {
  id: string;
  type: 'fill_blank' | 'translation' | 'pinyin_match';
  questionZh: string;
  questionPinyin: string;
  questionTh: string;
  options: RoomQuestionOption[];
  correctOptionId: string;
  explanation: string;
}

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  score: number;
  streak: number;
  isHost: boolean;
  answeredCurrent: boolean;
  lastAnswerCorrect?: boolean;
  lastAnswerScore?: number;
}

export interface GameRoom {
  id: string;
  pin: string;
  title: string;
  hostId: string;
  hostName: string;
  isPrivate: boolean;
  password?: string;
  qrCodeUrl?: string;
  inviteUrl?: string;
  mode: GameMode;
  timePerQuestion: TimePerQuestion;
  difficulty: 'hsk1' | 'hsk2' | 'hsk3' | 'mixed';
  status: 'lobby' | 'countdown' | 'question' | 'feedback' | 'leaderboard' | 'finished';
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: RoomQuestion[];
  players: RoomPlayer[];
  questionStartTime?: number;
}

export interface VocabWord {
  id: string;
  hanzi: string;
  pinyin: string;
  thai: string;
  category: string;
  level: 'HSK 1' | 'HSK 2' | 'HSK 3';
  tone: 1 | 2 | 3 | 4 | 5;
  strokeCount: number;
  strokes: string[]; // stroke guide notes or paths
  radical: string;
  mnemonicTh: string;
  exampleSentence: {
    zh: string;
    pinyin: string;
    th: string;
  };
}

export interface GrammarPoint {
  id: string;
  title: string;
  titleTh: string;
  level: 'HSK 1' | 'HSK 2' | 'HSK 3';
  structure: string;
  explanationTh: string;
  usageNotesTh: string[];
  examples: {
    zh: string;
    pinyin: string;
    th: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface ConversationScenario {
  id: string;
  title: string;
  titleTh: string;
  descriptionTh: string;
  icon: string;
  difficulty: 'Beginner' | 'Elementary' | 'Intermediate';
  partnerName: string;
  partnerRole: string;
  partnerRoleTh: string;
  avatarBg: string;
  initialMessage: {
    zh: string;
    pinyin: string;
    th: string;
  };
  objectives: string[];
  suggestedPhrases: {
    zh: string;
    pinyin: string;
    th: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  pinyin?: string;
  translationTh?: string;
  feedback?: string;
  timestamp: number;
  audioPlayed?: boolean;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  league: 'Bronze' | 'Silver' | 'Gold' | 'Jade' | 'Diamond';
  xp: number;
  streak: number;
  badge: string;
  isUser?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  nameTh: string;
  descriptionTh: string;
  price: number;
  category: 'skin' | 'booster' | 'privilege' | 'frame';
  icon: string;
  skinId?: MascotSkinId;
  frameId?: string;
  previewColor: string;
}
