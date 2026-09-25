// Board color themes. Each provides CSS custom properties that the board
// component consumes. This system makes it simple to switch visual styles
// without re-rendering the entire board.

export interface BoardTheme {
  id: string
  name: string
  hint: string
  light: string
  dark: string
  surface: string
  coords: string
  // Visual indicators
  legalDot: string       // Legal move indicator
  moveHighlight: string  // Last move highlight
  checkGlow: string      // King in check
  boardInk: string       // Arrows and selection
}

export const BOARD_THEMES: Record<string, BoardTheme> = {
  nightfall: {
    id: "nightfall",
    name: "Nightfall",
    hint: "Amethyst & Obsidian",
    light: "#a294b0",
    dark: "#51425e",
    surface: "#302636",
    coords: "#c6aad6",
    legalDot: "rgba(219, 180, 255, 0.65)",
    moveHighlight: "rgba(188, 143, 230, 0.5)",
    checkGlow: "#dc7689",
    boardInk: "rgba(206, 160, 255, 0.9)",
  },
  lavender: {
    id: "lavender",
    name: "Lavender",
    hint: "Ivory & Lilac",
    light: "#e9e0ef",
    dark: "#a393b9",
    surface: "#d6c8e3",
    coords: "#7d6b90",
    legalDot: "rgba(115, 85, 184, 0.45)",
    moveHighlight: "rgba(160, 135, 201, 0.5)",
    checkGlow: "#dc8b91",
    boardInk: "rgba(115, 85, 184, 0.85)",
  },
  classic: {
    id: "classic",
    name: "Classic",
    hint: "Beige & Brown",
    light: "#f0d9b5",
    dark: "#b58863",
    surface: "#1a1410",
    coords: "#b58863",
    legalDot: "rgba(32, 32, 32, 0.35)",
    moveHighlight: "rgba(155, 199, 0, 0.41)",
    checkGlow: "#ff6b6b",
    boardInk: "rgba(255, 170, 0, 0.85)",
  },
  modern: {
    id: "modern",
    name: "Modern",
    hint: "Gray & Slate",
    light: "#e5e7eb",
    dark: "#6b7280",
    surface: "#111827",
    coords: "#6b7280",
    legalDot: "rgba(32, 32, 32, 0.35)",
    moveHighlight: "rgba(74, 222, 128, 0.35)",
    checkGlow: "#ef4444",
    boardInk: "rgba(59, 130, 246, 0.85)",
  },
  wood: {
    id: "wood",
    name: "Wood",
    hint: "Tan & Walnut",
    light: "#d4af82",
    dark: "#8b5a3c",
    surface: "#1c1410",
    coords: "#8b5a3c",
    legalDot: "rgba(32, 32, 32, 0.35)",
    moveHighlight: "rgba(155, 199, 0, 0.41)",
    checkGlow: "#ff6b6b",
    boardInk: "rgba(255, 170, 0, 0.85)",
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    hint: "Cyan & Teal",
    light: "#cffafe",
    dark: "#14b8a6",
    surface: "#042f2e",
    coords: "#14b8a6",
    legalDot: "rgba(20, 20, 20, 0.4)",
    moveHighlight: "rgba(52, 211, 153, 0.35)",
    checkGlow: "#f87171",
    boardInk: "rgba(245, 158, 11, 0.9)",
  },
  forest: {
    id: "forest",
    name: "Forest",
    hint: "Sage & Pine",
    light: "#d1fae5",
    dark: "#059669",
    surface: "#064e3b",
    coords: "#059669",
    legalDot: "rgba(20, 20, 20, 0.4)",
    moveHighlight: "rgba(134, 239, 172, 0.35)",
    checkGlow: "#f87171",
    boardInk: "rgba(251, 191, 36, 0.9)",
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    hint: "Indigo & Navy",
    light: "#c7d2fe",
    dark: "#4f46e5",
    surface: "#1e1b4b",
    coords: "#4f46e5",
    legalDot: "rgba(20, 20, 20, 0.4)",
    moveHighlight: "rgba(147, 197, 253, 0.35)",
    checkGlow: "#fca5a5",
    boardInk: "rgba(250, 204, 21, 0.9)",
  },
}

export const THEME_LIST = Object.values(BOARD_THEMES)

export type ThemeId = keyof typeof BOARD_THEMES

export function themeCssVars(theme: BoardTheme): React.CSSProperties {
  return {
    "--board-light": theme.light,
    "--board-dark": theme.dark,
    "--board-surface": theme.surface,
    "--board-coords": theme.coords,
    "--legal-dot": theme.legalDot,
    "--move-highlight": theme.moveHighlight,
    "--check-glow": theme.checkGlow,
    "--board-ink": theme.boardInk,
  } as React.CSSProperties
}
