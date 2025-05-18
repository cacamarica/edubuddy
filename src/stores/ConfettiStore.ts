
import { create } from 'zustand';

interface ConfettiState {
  isActive: boolean;
  launch: () => void;
  stop: () => void;
}

export const useConfettiStore = create<ConfettiState>((set) => ({
  isActive: false,
  launch: () => set({ isActive: true }),
  stop: () => set({ isActive: false }),
}));
