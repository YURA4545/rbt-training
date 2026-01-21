
export enum UserRole {
  JUNIOR = 'Junior',
  MIDDLE = 'Middle',
  SENIOR = 'Senior',
  EXPERT = 'Expert'
}

export interface UserProfile {
  id: string;
  name: string;
  position: string;
  store: string;
  level: UserRole;
  xp: number;
  modulesCompleted: number;
  avgRating: number;
  achievements: string[];
}

export interface ObjectionScenario {
  id: string;
  objection: string;
  category: 'Price' | 'Quality' | 'Competitors' | 'Delay';
}

export interface AIAnalysis {
  persuasiveness: number;
  politeness: number;
  logic: number;
  clientOrientation: number;
  satisfaction: number;
  feedback: string;
  score: number;
}

export enum GameType {
  QUICK_REPLY = 'QUICK_REPLY',
  FIX_ERROR = 'FIX_ERROR',
  SELL_PRODUCT = 'SELL_PRODUCT'
}
