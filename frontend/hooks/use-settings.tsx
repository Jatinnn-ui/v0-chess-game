"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { setSoundEnabled } from "@/lib/sounds"
import { BOARD_THEMES, type BoardTheme, type ThemeId } from "@/lib/themes"

export interface Settings {
  themeId: ThemeId
  soundEnabled: boolean
  showCoordinates: boolean
  showLegalMoves: boolean
  highlightLastMove: boolean
  autoQueen: boolean
  animationsEnabled: boolean
  confirmResign: boolean
}

const DEFAULTS: Settings = {
  themeId: "lavender",
  soundEnabled: true,
  showCoordinates: true,
  showLegalMoves: true,
  highlightLastMove: true,
  autoQueen: true,
  animationsEnabled: true,
  confirmResign: true,
}

const STORAGE_KEY = "gambit:settings:v1"

interface SettingsContextValue {
  settings: Settings
  theme: BoardTheme
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount (UI preferences only — not app data).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  // Persist & sync to the sound engine whenever settings change.
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore
    }
    setSoundEnabled(settings.soundEnabled)
  }, [settings, hydrated])

  const value = useMemo<SettingsContextValue>(() => {
    const theme = BOARD_THEMES[settings.themeId] ?? BOARD_THEMES.classic
    return {
      settings,
      theme,
      update: (key, val) => setSettings((prev) => ({ ...prev, [key]: val })),
      reset: () => setSettings(DEFAULTS),
    }
  }, [settings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error("useSettings must be used inside <SettingsProvider>")
  }
  return ctx
}
