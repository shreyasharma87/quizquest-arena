import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  uid: string;
  username: string;
  avatarUrl: string;
  xp: number;
  level: number;
  coins: number;
  rank: string;
  badges: string[];
  stats: {
    matchesPlayed: number;
    wins: number;
    accuracy: number;
  };
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addXP: (amount: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (username: string) => {
        set({
          user: {
            uid: Math.random().toString(36).substring(7),
            username,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=121212`,
            xp: 1500,
            level: 5,
            coins: 450,
            rank: 'Gold III',
            badges: ['First Win', 'Speedster', 'Sniper'],
            stats: { matchesPlayed: 24, wins: 12, accuracy: 84 }
          },
          isAuthenticated: true
        });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (data) => {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, ...data };
          // Call Firebase async without blocking the UI
          import('../firebase').then(({ updateProfileInFirestore }) => {
            updateProfileInFirestore(updatedUser.uid, data).catch(console.error);
          }).catch(console.warn);
          
          return { user: updatedUser };
        });
      },
      addXP: (amount) => set((state) => {
        if (!state.user) return state;
        const newXp = state.user.xp + amount;
        const newLevel = Math.floor(newXp / 1000) + 1;
        return { user: { ...state.user, xp: newXp, level: newLevel } };
      })
    }),
    { name: 'auth-storage' }
  )
);
