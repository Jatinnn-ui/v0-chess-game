"use client"

import type { Square } from "chess.js"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Lightbulb,
  Minimize2,
  RotateCcw,
  RotateCw,
  Undo2,
  X,
} from "lucide-react"
import { useEffect, useMemo } from "react"

import { ChessBoard } from "@/components/chess-board"
import { GameOverDialog } from "@/components/game-over-dialog"
import { MoveHistory } from "@/components/move-history"
import { PlayerCard } from "@/components/player-card"
import { SettingsDialog } from "@/components/settings-dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useSettings } from "@/hooks/use-settings"
import type { GameStatus, HintMove, MoveRecord } from "@/hooks/use-chess-game"
import type { Difficulty } from "@/lib/api"
import { themeCssVars } from "@/lib/themes"

interface FullscreenGameProps {
  fen: string
  viewedFen: string
  history: MoveRecord[]
  viewIndex: number | null
  isLive: boolean
  thinking: boolean
  sideToMove: "w" | "b"
  playerColor: "w" | "b"
  difficulty: Difficulty
  lastMove: { from: Square; to: Square } | null
  hint: HintMove | null
  gameOver: boolean
  status: GameStatus
  onMove: (
    from: Square,
    to: Square,
    promotion?: "q" | "r" | "b" | "n",
  ) => void | Promise<unknown>
  legalMovesFrom: (sq: Square) => {
    to: Square
    capture: boolean
    promotion?: string
  }[]
  onClose: () => void
  onFlip: () => void
  orientation: "w" | "b"
  onGoto: (index: number | null) => void
  onTakeBack: () => void
  onHint: () => void
  onResign: () => void
  onNewGame: () => void
  onDifficulty: (d: Difficulty) => void
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  casual: "Casual",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
}

export function FullscreenGame(props: FullscreenGameProps) {
  const {
    viewedFen,
    history,
    viewIndex,
    isLive,
    thinking,
    sideToMove,
    playerColor,
    difficulty,
    lastMove,
    hint,
    gameOver,
    status,
    onMove,
    legalMovesFrom,
    onClose,
    onFlip,
    orientation,
    onGoto,
    onTakeBack,
    onHint,
    onResign,
    onNewGame,
    onDifficulty,
  } = props

  const { theme } = useSettings()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement | null)?.tagName === "INPUT" ||
        (e.target as HTMLElement | null)?.tagName === "TEXTAREA"
      )
        return
      if (e.key === "Escape") onClose()
      else if (e.key === "f" || e.key === "F") onFlip()
      else if (e.key === "[") onTakeBack()
      else if (e.key === "]") onHint()
      else if (e.key === "ArrowLeft") {
        const next =
          viewIndex === null
            ? history.length - 2
            : Math.max(-1, viewIndex - 1)
        onGoto(next < 0 ? -1 : next)
      } else if (e.key === "ArrowRight") {
        const cur = viewIndex === null ? history.length - 1 : viewIndex
        if (cur < history.length - 1) onGoto(cur + 1)
        else onGoto(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [
    onClose,
    onFlip,
    onGoto,
    onHint,
    onTakeBack,
    history.length,
    viewIndex,
  ])

  const interactive =
    isLive && !gameOver && !thinking && sideToMove === playerColor

  const statusText = useMemo(() => {
    if (status === "checkmate")
      return sideToMove === playerColor
        ? "Checkmate — you lost"
        : "Checkmate — you won"
    if (status === "stalemate") return "Stalemate"
    if (status === "draw") return "Draw"
    if (status === "resigned") return "Resigned"
    if (thinking) return "AI is thinking…"
    if (status === "check")
      return sideToMove === playerColor ? "You are in check" : "Check"
    return sideToMove === playerColor ? "Your move" : "Opponent's move"
  }, [status, thinking, sideToMove, playerColor])

  const aiCard = (
    <PlayerCard
      kind="ai"
      name="Gambit Engine"
      subtitle={`${DIFFICULTY_LABEL[difficulty]} · α/β minimax`}
      color={playerColor === "w" ? "b" : "w"}
      active={isLive && sideToMove !== playerColor}
      thinking={thinking}
      history={history}
    />
  )
  const humanCard = (
    <PlayerCard
      kind="human"
      name="You"
      subtitle={playerColor === "w" ? "Playing White" : "Playing Black"}
      color={playerColor}
      active={isLive && sideToMove === playerColor && !thinking}
      history={history}
    />
  )

  return (
    <div
      className="fs-enter fixed inset-0 z-50 flex flex-col"
      style={{
        ...themeCssVars(theme),
        background:
          "radial-gradient(ellipse at top, var(--board-surface) 0%, #050505 100%)",
      }}
    >
      {/* Game Over Dialog */}
      <GameOverDialog
        status={status}
        playerColor={playerColor}
        sideToMove={sideToMove}
        onNewGame={onNewGame}
      />

      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border/60 bg-black/30 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Exit fullscreen"
          >
            <Minimize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-serif text-sm text-foreground">Focus Mode</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Press F to flip · Esc to exit
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground sm:inline">
            {statusText}
          </span>
          <Select
            value={difficulty}
            onValueChange={(v) => onDifficulty(v as Difficulty)}
          >
            <SelectTrigger className="h-8 w-[140px] bg-card/60 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                [
                  "beginner",
                  "casual",
                  "intermediate",
                  "advanced",
                  "expert",
                ] as Difficulty[]
              ).map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {DIFFICULTY_LABEL[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SettingsDialog />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close fullscreen"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex min-h-0 flex-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:p-6">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3">
          <div className="fs-board-track">
            {orientation === "w" ? aiCard : humanCard}
          </div>

          <div className="fs-board-area">
            <ChessBoard
              fen={viewedFen}
              orientation={orientation}
              interactive={interactive}
              lastMove={isLive ? lastMove : null}
              bestMoveHint={hint}
              legalMovesFrom={legalMovesFrom}
              onMove={onMove}
              playerColor={playerColor}
              sideToMove={sideToMove}
            />
          </div>

          <div className="fs-board-track">
            {orientation === "w" ? humanCard : aiCard}
          </div>
        </div>

        {/* Right rail */}
        <aside className="hidden w-[320px] shrink-0 flex-col gap-3 lg:flex">
          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border/60 bg-card/60 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Move List
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {Math.ceil(history.length / 2)} moves
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <MoveHistory
                moves={history}
                viewIndex={viewIndex}
                onGoto={onGoto}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-1 border-t border-border/60 pt-2">
              <Button
                variant="ghost"
                size="sm"
                aria-label="First"
                onClick={() => onGoto(-1)}
                disabled={history.length === 0}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Previous"
                onClick={() => {
                  const next =
                    viewIndex === null
                      ? history.length - 2
                      : Math.max(-1, viewIndex - 1)
                  onGoto(next)
                }}
                disabled={history.length === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Next"
                onClick={() => {
                  const cur =
                    viewIndex === null ? history.length - 1 : viewIndex
                  if (cur < history.length - 1) onGoto(cur + 1)
                  else onGoto(null)
                }}
                disabled={history.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Latest"
                onClick={() => onGoto(null)}
                disabled={history.length === 0}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onTakeBack}
              disabled={history.length === 0 || thinking}
            >
              <Undo2 className="h-4 w-4" />
              Take back
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onHint}
              disabled={!interactive}
            >
              <Lightbulb className="h-4 w-4" />
              Hint
            </Button>
            <Button variant="secondary" size="sm" onClick={onFlip}>
              <RotateCw className="h-4 w-4" />
              Flip
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onResign}
              disabled={gameOver}
            >
              <Flag className="h-4 w-4" />
              Resign
            </Button>
            <Button className="col-span-2" onClick={onNewGame}>
              <RotateCcw className="h-4 w-4" />
              New Game
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
