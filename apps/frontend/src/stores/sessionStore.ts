import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface SessionState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  logout: () => Promise<void>
  initializeAuth: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setSession: (session) => {
    set({ 
      session, 
      user: session?.user || null, 
      isAuthenticated: !!session?.user,
      isLoading: false
    })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, isAuthenticated: false })
  },

  initializeAuth: () => {
    set({ isLoading: true })
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      get().setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      get().setSession(session)
    })

    return () => subscription.unsubscribe()
  },
}))

