import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Player, Room, ActivityLog, Question, PowerupType, RoomSettings, MatchRecord } from '../../../shared/types';
import { API_URL } from '../config/api';

interface AppState {
  socket: Socket | null;
  roomId: string | null;
  me: Player | null;
  room: Room | null;
  connected: boolean;
  timer: number;
  cheatWarning: string | null;
  history: MatchRecord[];
  joinError: { message: string; suggestedUsername: string } | null;
  clearJoinError: () => void;
  connect: (roomId: string, username: string, forceRole?: string) => void;
  disconnect: () => void;
  startGame: () => void;
  endGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  kickPlayer: (targetId: string) => void;
  submitAnswer: (payload: { questionIndex: number; selectedOptionIndex?: number; textAnswer?: string; minigameScore?: number }) => void;
  nextQuestion: () => void;
  reportSuspicious: (type: string, description: string) => void;
  clearWarning: () => void;
  addQuestion: (question: Omit<Question, 'id'>) => void;
  deleteQuestion: (questionId: string) => void;
  usePowerup: (powerup: PowerupType, targetId?: string) => void;
  toggleReady: () => void;
  sendChatMessage: (text: string) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  assignTeams: () => void;
  fetchHistory: () => void;
  updatePlayerProfile: (profile: Partial<Player>) => void;
}

export const useGameStore = create<AppState>((set, get) => ({
  socket: null,
  roomId: null,
  me: null,
  room: null,
  connected: false,
  timer: 0,
  cheatWarning: null,
  history: [],

  joinError: null,
  clearJoinError: () => set({ joinError: null }),

  connect: (roomId: string, username: string, forceRole?: string) => {
    set({ joinError: null });
    const socket = io(API_URL, { autoConnect: false });
    socket.connect();

    socket.on('connect', () => {
      set({ connected: true, roomId, socket });
      socket.emit('joinRoom', { roomId, username, forceRole });
    });

    socket.on('joinError', ({ message, suggestedUsername }) => {
      socket.disconnect();
      set({
        connected: false,
        socket: null,
        roomId: null,
        me: null,
        room: null,
        joinError: { message, suggestedUsername }
      });
    });

    socket.on('roomState', (room: Room) => {
      set({ room, timer: room.gameState.timer });
      const me = room.players[socket.id];
      if (me) set({ me });
    });

    socket.on('timerUpdate', (time: number) => {
      set({ timer: time });
    });

    socket.on('kicked', () => {
      alert('You have been kicked by the host.');
      window.location.href = '/';
    });

    socket.on('cheatWarning', (msg: string) => {
      set({ cheatWarning: msg });
    });

    socket.on('historyData', (data: MatchRecord[]) => {
      set({ history: data.sort((a,b) => b.date - a.date) });
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ socket: null, roomId: null, me: null, room: null, connected: false, joinError: null });
  },

  startGame: () => get().socket?.emit('startGame', get().roomId),
  endGame: () => get().socket?.emit('endGame', get().roomId),
  pauseGame: () => get().socket?.emit('pauseGame', get().roomId),
  resumeGame: () => get().socket?.emit('resumeGame', get().roomId),
  kickPlayer: (targetId: string) => get().socket?.emit('kickPlayer', { roomId: get().roomId, targetId }),
  nextQuestion: () => get().socket?.emit('nextQuestion', get().roomId),
  
  submitAnswer: (payload) => {
    const { socket, roomId, timer } = get();
    socket?.emit('submitAnswer', { roomId, timeTaken: timer, ...payload });
  },

  reportSuspicious: (type: string, description: string) => {
    const { socket, roomId } = get();
    socket?.emit('reportSuspicious', { roomId, type, description });
  },

  clearWarning: () => set({ cheatWarning: null }),

  addQuestion: (question) => {
    get().socket?.emit('addQuestion', { roomId: get().roomId, question });
  },

  deleteQuestion: (questionId) => {
    get().socket?.emit('deleteQuestion', { roomId: get().roomId, questionId });
  },

  usePowerup: (powerup, targetId) => {
    const { socket, roomId } = get();
    socket?.emit('usePowerup', { roomId, powerup, targetId });
  },

  toggleReady: () => {
    get().socket?.emit('toggleReady', get().roomId);
  },

  sendChatMessage: (text) => {
    get().socket?.emit('sendChatMessage', { roomId: get().roomId, text });
  },

  updateSettings: (settings) => {
    get().socket?.emit('updateSettings', { roomId: get().roomId, settings });
  },

  assignTeams: () => {
    get().socket?.emit('assignTeams', get().roomId);
  },

  fetchHistory: () => {
    get().socket?.emit('getHistory');
  },

  updatePlayerProfile: (profile) => {
    get().socket?.emit('updatePlayerProfile', { roomId: get().roomId, profile });
  }
}));
