import { create } from 'zustand'

type ModalType = 'deposit' | 'withdraw' | 'split' | 'merge' | null

interface ModalState {
  isOpen: boolean
  type: ModalType
  data?: unknown
  openModal: (type: ModalType, data?: unknown) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: null,
  data: null,
  openModal: (type, data) => set({ isOpen: true, type, data }),
  closeModal: () => set({ isOpen: false, type: null, data: null }),
}))
