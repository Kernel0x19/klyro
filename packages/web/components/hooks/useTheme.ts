'use client'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  createElement,
} from 'react'
type Theme = 'dark' | 'light'
interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}
const ThemeContext = createContext<ThemeContextValue | null>(null)
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('klyro-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('klyro-theme', nextTheme)
    setTheme(nextTheme)
  }

  return createElement(
    ThemeContext.Provider,
    { value: { theme, toggleTheme } },
    children
  )
}
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
