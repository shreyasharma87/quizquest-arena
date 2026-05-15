export type Role = 'host' | 'moderator' | 'player' | 'spectator';

export type QuestionType = 'mcq' | 'boolean' | 'short_answer' | 'long_answer' | 'minigame';
export type MinigameType = 'clicker' | 'typing_race' | 'reaction' | 'memory_sequence' | 'math_blitz' | 'target_smash';
export type PowerupType = 'freeze' | 'bomb' | 'steal_coins' | 'shield' | 'double_points';
export type GameMode = 'live' | 'assignment';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  score: number;
  health: number;
  streak: number;
  coins: number;
  role: Role;
  status: 'lobby' | 'ready' | 'playing' | 'eliminated';
  powerupsInventory: PowerupType[];
  activeEffects: {
    frozenUntil?: number;
    shieldActive?: boolean;
    doublePointsActive?: boolean;
  };
  team?: string;
  hasAnswered?: boolean;
  isCorrect?: boolean;
  warnings: number;
  isReady: boolean;
  currentQuestionIndex?: number;
  assignmentFinished?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctOptionIndex?: number;
  correctTextAnswer?: string;
  minigameType?: MinigameType;
  timeLimit: number;
  points: number;
  imageUrl?: string;
}

export interface GameState {
  status: 'waiting' | 'starting' | 'question' | 'leaderboard' | 'finished' | 'paused';
  currentQuestionIndex: number;
  timer: number;
  isPaused: boolean;
}

export interface RoomSettings {
  antiCheatEnabled: boolean;
  powerupsEnabled: boolean;
  teamMode: boolean;
  maxCapacity: number;
  gameMode: GameMode;
  assignmentDeadline?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  type: 'blur' | 'fullscreen_exit' | 'system' | 'warning' | 'combat';
  description: string;
}

export interface Room {
  roomId: string;
  hostId: string;
  players: Record<string, Player>;
  gameState: GameState;
  settings: RoomSettings;
  questions: Question[];
  activityLogs: ActivityLog[];
  chatMessages: ChatMessage[];
}

export interface MatchRecord {
  id: string;
  roomId: string;
  date: number;
  gameMode: GameMode;
  leaderboard: { username: string; score: number; team?: string }[];
}

export interface AnswerPayload {
  roomId: string;
  questionIndex: number;
  selectedOptionIndex?: number;
  textAnswer?: string;
  minigameScore?: number;
  timeTaken: number;
}

export interface UsePowerupPayload {
  roomId: string;
  powerup: PowerupType;
  targetId?: string;
}
