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
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const savedTheme = localStorage.getItem('klyro-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
    }
    setMounted(true)
  }, [])
  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('klyro-theme', theme)
  }, [theme, mounted])
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
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
