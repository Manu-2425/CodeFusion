import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// { user, checking, signIn, signUp, signOut }
export function useAuth() {
  return useContext(AuthContext)
}
