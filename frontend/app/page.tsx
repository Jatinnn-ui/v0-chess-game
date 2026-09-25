"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowDownToLine, ArrowRight, BarChart3, BookOpen, Bot, Box, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleHelp, Clock3, Crown, Expand, Flag, Grid2X2, Keyboard, Lightbulb, Loader2, MousePointer2, RotateCcw, RotateCw, Settings2, ShieldCheck, Shuffle, SlidersHorizontal, Sparkles, Swords, Undo2, Video, Volume2, VolumeX, X } from "lucide-react"
import { Chess } from "chess.js"
import { ChessBoard } from "@/components/chess-board"
import { AnalysisPanel } from "@/components/analysis-panel"
import { GameOverDialog } from "@/components/game-over-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useChessGame } from "@/hooks/use-chess-game"
import { useSettings } from "@/hooks/use-settings"
import { analyzePosition, classifyMove, type AnalyzeResponse, type ClassifyMoveResponse, type Difficulty } from "@/lib/api"

const ChessBoard3D = dynamic(() => import("@/components/chess-board-3d").then(m => m.ChessBoard3D), { ssr: false, loading: () => <div className="board-loading"><Loader2 className="animate-spin" /><span>Setting the scene…</span></div> })
const LEVELS: { value: Difficulty; label: string; rating: string; detail: string }[] = [
  { value: "beginner", label: "Beginner", rating: "600", detail: "A friendly place to begin." },
  { value: "casual", label: "Casual", rating: "1000", detail: "Find your rhythm, one move at a time." },
  { value: "intermediate", label: "Intermediate", rating: "1400", detail: "A balanced challenge to sharpen your skills." },
  { value: "advanced", label: "Advanced", rating: "1700", detail: "Think deeper. Find the unexpected." },
  { value: "expert", label: "Expert", rating: "1900", detail: "Bring your best. The engine will, too." },
]

function KnightMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 40 44" fill="none" aria-hidden="true"><path d="M10 35c1-9 9-10 9-17l-6 4-7-4L20 5l1-4 7 5c9 7 8 18 3 29H10Z" fill="currentColor" /><path d="M8 38h26v4H8z" fill="currentColor" /><circle cx="23" cy="12" r="1.7" fill="var(--knight-eye, white)" /><path d="m8 18 7-1" stroke="var(--knight-eye, white)" strokeWidth="1.4" /></svg>
}

export default function Page() {
  const { state, viewedFen, isLive, sideToMove, makePlayerMove, legalMovesFrom, newGame, goto, resign, annotate, takeBack, requestHint, clearHint } = useChessGame()
  const { settings, update } = useSettings()
  const [pendingColor, setPendingColor] = useState<"w" | "b" | "random">("w")
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty>("intermediate")
  const [flipped, setFlipped] = useState(false)
  const [view, setView] = useState<"3d" | "2d">("3d")
  const [focus, setFocus] = useState(false)
  const [resetView, setResetView] = useState(0)
  const [tab, setTab] = useState<"moves" | "analysis">("moves")
  const [modal, setModal] = useState<"help" | "guide" | "new" | "resign" | null>(null)
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [hinting, setHinting] = useState(false)
  const [classification, setClassification] = useState<ClassifyMoveResponse | null>(null)
  const [notice, setNotice] = useState("")
  const movesEnd = useRef<HTMLDivElement>(null)
  const analysisRequest = useRef(0)
  const gameOver = ["checkmate", "stalemate", "draw", "resigned"].includes(state.status)
  const orientation = flipped ? (state.playerColor === "w" ? "b" : "w") : state.playerColor
  const interactive = isLive && !gameOver && !state.thinking && sideToMove === state.playerColor
  const currentLevel = LEVELS.find(l => l.value === state.difficulty)!
  const pendingLevel = LEVELS.find(l => l.value === pendingDifficulty)!
  const currentIndex = state.viewIndex === null ? state.history.length - 1 : state.viewIndex
  const previous = useCallback(() => goto(Math.max(-1, currentIndex - 1)), [goto, currentIndex])
  const next = useCallback(() => goto(currentIndex >= state.history.length - 2 ? null : currentIndex + 1), [goto, currentIndex, state.history.length])

  const handleNewGame = () => {
    analysisRequest.current++
    setAnalysis(null); setClassification(null); setFlipped(false); setModal(null); setTab("moves")
    newGame({ difficulty: pendingDifficulty, playerColor: pendingColor === "random" ? (Math.random() > .5 ? "w" : "b") : pendingColor })
    setNotice("A fresh board. A world of possibilities.")
  }
  const handleAnalyze = async () => {
    setTab("analysis"); setAnalyzing(true)
    const id = ++analysisRequest.current
    try { const result = await analyzePosition(viewedFen, 3); if (id === analysisRequest.current) setAnalysis(result) }
    catch { setNotice("The engine is unavailable. Please try again shortly.") }
    finally { setAnalyzing(false) }
  }
  const handleHint = async () => {
    if (!interactive || hinting) return
    setHinting(true)
    try { await requestHint() } finally { setHinting(false) }
  }
  const downloadPgn = () => {
    const chess = new Chess()
    for (const move of state.history) chess.move({ from: move.from, to: move.to, promotion: move.promotion })
    chess.header("Event", "Gambit — Play vs Computer", "White", state.playerColor === "w" ? "You" : "Gambit Engine", "Black", state.playerColor === "b" ? "You" : "Gambit Engine")
    const url = URL.createObjectURL(new Blob([chess.pgn()], { type: "application/x-chess-pgn" }))
    const a = document.createElement("a"); a.href = url; a.download = "gambit-game.pgn"; a.click(); URL.revokeObjectURL(url)
    setNotice("Your game has been exported as PGN.")
  }
  useEffect(() => {
    const last = state.history.at(-1)
    if (!last || last.color !== state.playerColor || last.quality) return
    let cancelled = false
    classifyMove(last.fenBefore, last.fenAfter, last.uci, 2).then(result => {
      if (!cancelled) { annotate(last.ply, result.quality); setClassification(result) }
    }).catch(() => {})
    return () => { cancelled = true }
    // The existing game hook owns move state; classification is presentation metadata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.history.length])
  useEffect(() => {
    if (!state.hint) return
    const timer = window.setTimeout(clearHint, 4000)
    return () => window.clearTimeout(timer)
  }, [state.hint, clearHint])
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer) } }, [notice])
  useEffect(() => { movesEnd.current?.scrollIntoView({ block: "nearest" }) }, [state.history.length])
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest("input, textarea, select, [role='dialog']") || modal) return
      if (event.key === "Escape") setFocus(false)
      if (event.key.toLowerCase() === "f" && !event.metaKey && !event.ctrlKey) setFlipped(v => !v)
      if (event.key === "ArrowLeft") { event.preventDefault(); previous() }
      if (event.key === "ArrowRight") { event.preventDefault(); next() }
      if (event.key === "[" && !state.thinking && !gameOver) takeBack()
      if (event.key === "]" && interactive) void handleHint()
    }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  })
  const boardProps = { fen: viewedFen, orientation: orientation as "w" | "b", interactive, lastMove: isLive ? state.lastMove : state.history[currentIndex] ?? null, bestMoveHint: state.hint, legalMovesFrom, onMove: makePlayerMove, playerColor: state.playerColor, sideToMove }
  const captured = state.history.filter(m => m.captured && m.color === state.playerColor).length

  return <div className={`gambit-app ${focus ? "is-focused" : ""}`}>
    <aside className="app-sidebar">
      <Link href="/" className="brand" aria-label="Gambit home"><span className="brand-mark"><KnightMark /></span><span>gambit<span className="brand-dot">.</span></span></Link>
      <div className="sidebar-caption">A GAME OF POSSIBILITIES</div>
      <nav className="primary-nav" aria-label="Main navigation">
        <span className="nav-label">YOUR PLAYGROUND</span>
        <button className="nav-item active" onClick={() => { setTab("moves"); setFocus(false) }}><Swords /><span>Play chess</span><span className="nav-active-dot" /></button>
        <button className="nav-item" onClick={() => { setTab("analysis"); setFocus(false) }}><BarChart3 /><span>Analysis board</span></button>
        <Link className="nav-item" href="/watch"><Video /><span>Watch & learn</span><span className="nav-small">NEW</span></Link>
        <div className="nav-divider" />
        <span className="nav-label">THE LITTLE THINGS</span>
        <button className="nav-item" onClick={() => setModal("guide")}><BookOpen /><span>Chess essentials</span></button>
        <SettingsDialog trigger={<button className="nav-item"><Settings2 /><span>Preferences</span></button>} />
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><div className="note-spark"><Sparkles size={17} /><span>A LITTLE BETTER, EVERY DAY</span></div><h3>Great moves<br />start with curiosity.</h3><p>Take your time. Try a new idea.<br />Make the board your own.</p><button onClick={() => setModal("guide")}>Find your next move <ArrowRight size={15} /></button><KnightMark className="note-knight" /></div>
        <button className="nav-item help-link" onClick={() => setModal("help")}><CircleHelp /><span>Help & shortcuts</span><Keyboard size={15} /></button>
        <div className="sidebar-footer"><span className="status-dot" /> Made for the love of the game.</div>
      </div>
    </aside>

    <div className="app-main">
      <header className="topbar"><div className="breadcrumbs"><span>Play</span><ChevronRight size={14} /><strong>Vs. computer</strong></div><div className="topbar-right"><span className="local-session"><ShieldCheck size={15} /> No pressure. Just play.</span><span className="topbar-divider" /><button className="icon-button" title={settings.soundEnabled ? "Mute sound" : "Enable sound"} aria-label={settings.soundEnabled ? "Mute sound" : "Enable sound"} onClick={() => update("soundEnabled", !settings.soundEnabled)}>{settings.soundEnabled ? <Volume2 /> : <VolumeX />}</button><SettingsDialog trigger={<button className="icon-button" aria-label="Settings" title="Settings"><Settings2 /></button>} /><div className="guest-avatar" title="Guest player">G</div></div></header>
      <main className="workspace">
        <div className="page-heading"><div><div className="eyebrow">THE NIGHTFALL CHESS LOUNGE</div><h1>Your next <em>great move.</em></h1><p>Settle in, find your focus, and enjoy the game.</p></div><div className="experience-badge"><Box size={17} /><span>A classic. In a new light.</span><span className="tiny-pill">3D</span></div></div>
        <div className="game-layout">
          <section className="game-card" aria-label="Chess game">
            <div className="game-card-top"><div className="game-title"><Swords size={17} /><h2>Play vs. computer</h2><span className="casual-pill">Casual game</span></div><div className="view-toggle" aria-label="Board view"><button className={view === "3d" ? "selected" : ""} onClick={() => setView("3d")} aria-pressed={view === "3d"}><Box size={14} />3D</button><button className={view === "2d" ? "selected" : ""} onClick={() => setView("2d")} aria-pressed={view === "2d"}><Grid2X2 size={14} />2D</button></div></div>
            <div className="board-scene">
              <div className="player-strip opponent"><div className="player-avatar engine-avatar"><Bot size={24} /></div><div className="player-info"><strong>Gambit Engine <span className="ai-badge">AI</span></strong><span>{currentLevel.label}<span className="middle-dot">·</span>~{currentLevel.rating} ELO</span></div><div className={`player-state ${state.thinking ? "is-thinking" : ""}`}>{state.thinking ? <><Loader2 size={14} className="animate-spin" /> Thinking</> : <><span className={`piece-color ${state.playerColor === "w" ? "black" : "white"}`} />{state.playerColor === "w" ? "Black pieces" : "White pieces"}</>}</div></div>
              <div className={`board-stage ${view === "2d" ? "flat-stage" : ""}`}>
                {view === "3d" ? <ChessBoard3D {...boardProps} resetView={resetView} /> : <div className="flat-board"><ChessBoard {...boardProps} /></div>}
                <div className="stage-label"><span className="stage-dot" /> {settings.themeId === "lavender" ? "THE LAVENDER COLLECTION" : `${settings.themeId.toUpperCase()} COLLECTION`}</div>
                <div className="stage-tools"><button className="icon-button" aria-label="Reset camera" title="Reset camera" onClick={() => setResetView(v => v + 1)} disabled={view === "2d"}><RotateCcw size={15} /></button><button className="icon-button" aria-label={focus ? "Exit focus mode" : "Focus mode"} title={focus ? "Exit focus mode" : "Focus mode"} onClick={() => setFocus(v => !v)}>{focus ? <X size={16} /> : <Expand size={16} />}</button></div>
              </div>
              <div className="player-strip human"><div className="player-avatar human-avatar"><KnightMark /></div><div className="player-info"><strong>You <span className="you-badge">LET’S PLAY</span></strong><span>{state.playerColor === "w" ? "White" : "Black"} pieces<span className="middle-dot">·</span>{captured ? `${captured} captured` : "A little better every move"}</span></div><div className="untimed"><span>∞</span><span>Untimed</span></div></div>
            </div>
            <div className="board-toolbar"><div className="turn-status" aria-live="polite"><span className={`status-dot ${state.thinking ? "thinking-pulse" : ""}`} /><strong>{!isLive ? "Reviewing game" : gameOver ? "Game complete" : state.status === "check" ? "Check!" : state.thinking ? "Engine is thinking…" : "Your move"}</strong><span className="turn-detail">{!isLive ? <button onClick={() => goto(null)}>Back to live</button> : gameOver ? "Ready for another?" : "Make it a good one."}</span></div><div className="board-actions"><button onClick={takeBack} disabled={!state.history.length || state.thinking || gameOver} title="Take back ["><Undo2 /> <span>Undo</span></button><button onClick={() => void handleHint()} disabled={!interactive || hinting} title="Show hint ]">{hinting ? <Loader2 className="animate-spin" /> : <Lightbulb />}<span>Hint</span></button><span className="action-divider" /><button onClick={() => setFlipped(v => !v)} title="Flip board F"><RotateCw /><span>Flip</span></button><button className="resign-button" onClick={() => settings.confirmResign ? setModal("resign") : resign()} disabled={gameOver || state.thinking} title="Resign game" aria-label="Resign game"><Flag /></button></div></div>
            {state.errorMessage && <div role="alert" className="engine-error">The engine couldn’t respond. Check the connection or start a new game.<button onClick={takeBack} disabled={state.thinking}>Take back</button></div>}
          </section>

          <aside className="game-right">
            <section className="setup-card"><div className="section-title"><span className="section-icon"><SlidersHorizontal size={17} /></span><h2>Play your way</h2><span className="soft-label">vs. AI</span></div><div className="setup-body"><label className="field-label" htmlFor="difficulty">Choose your challenge</label><div className="difficulty-select"><span className="level-bars"><i /><i /><i /><i className="muted-bar" /></span><select id="difficulty" value={pendingDifficulty} onChange={e => setPendingDifficulty(e.target.value as Difficulty)}>{LEVELS.map(level => <option key={level.value} value={level.value}>{level.label} · ~{level.rating} ELO</option>)}</select><ChevronDown size={15} /></div><p className="field-description">{pendingLevel.detail}</p><label className="field-label">Your side of the board</label><div className="color-options">{(["w", "b", "random"] as const).map(color => <button key={color} className={pendingColor === color ? "selected" : ""} aria-pressed={pendingColor === color} onClick={() => setPendingColor(color)}>{color === "random" ? <Shuffle size={24} /> : <span className={`color-piece ${color === "w" ? "light-piece" : "dark-piece"}`}><Crown size={25} /></span>}<span>{color === "w" ? "White" : color === "b" ? "Black" : "Random"}</span>{pendingColor === color && <span className="color-check"><Check size={9} /></span>}</button>)}</div><button className="primary-button start-button" disabled={state.thinking} onClick={() => state.history.length && !gameOver ? setModal("new") : handleNewGame()}><Swords size={17} />Start new game<ArrowRight size={17} /></button><div className="setup-footnote"><Clock3 size={12} />No clock. No rush. Just chess.</div></div></section>
            <section className="history-card"><div className="history-tabs" role="tablist" aria-label="Game details"><button role="tab" aria-selected={tab === "moves"} className={tab === "moves" ? "active" : ""} onClick={() => setTab("moves")}><BookOpen size={15} />Moves<span>{state.history.length}</span></button><button role="tab" aria-selected={tab === "analysis"} className={tab === "analysis" ? "active" : ""} onClick={() => setTab("analysis")}><BarChart3 size={15} />Analysis</button><button className="download-button" title="Export PGN" aria-label="Export game as PGN" disabled={!state.history.length} onClick={downloadPgn}><ArrowDownToLine size={16} /></button></div>
              {tab === "moves" ? <><div className="move-table-header"><span>#</span><span><span className="piece-color white" />White</span><span><span className="piece-color black" />Black</span></div><div className="move-scroll">{state.history.length ? <div className="move-table">{Array.from({ length: Math.ceil(state.history.length / 2) }, (_, i) => <div className="move-row" key={i}><span>{i + 1}.</span>{[i * 2, i * 2 + 1].map(index => <button key={index} className={currentIndex === index ? "current" : ""} disabled={!state.history[index]} onClick={() => goto(index)}>{state.history[index]?.san ?? "—"}</button>)}</div>)}<div ref={movesEnd} /></div> : <div className="empty-moves"><div className="empty-board"><Grid2X2 size={28} /><MousePointer2 size={16} /></div><strong>Every game tells a story.</strong><p>Make your first move to start yours.</p></div>}</div><div className="history-navigation"><button aria-label="First position" disabled={!state.history.length || currentIndex === -1} onClick={() => goto(-1)}><ChevronsLeft /></button><button aria-label="Previous move" disabled={currentIndex === -1} onClick={previous}><ChevronLeft /></button><span>{state.history.length ? `${currentIndex + 1} / ${state.history.length}` : "Move by move"}</span><button aria-label="Next move" disabled={isLive} onClick={next}><ChevronRight /></button><button aria-label="Live position" disabled={isLive} onClick={() => goto(null)}><ChevronsRight /></button></div></> : <div className="analysis-content"><AnalysisPanel analysis={analysis} lastMoveClassification={classification} loading={analyzing} /><button className="secondary-button" onClick={() => void handleAnalyze()} disabled={analyzing}>{analyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{analyzing ? "Finding the best line…" : "Analyze position"}</button></div>}
            </section>
          </aside>
        </div>

        <div className="below-board"><div className="insight-card"><div className="insight-icon"><Lightbulb size={21} /></div><div><span className="small-eyebrow">A THOUGHT FOR YOUR NEXT MOVE</span><h3>Own the center. Open up possibilities.</h3><p>Develop your pieces and give them room to work together.</p></div><button className="circle-link" aria-label="Read chess essentials" onClick={() => setModal("guide")}><ArrowRight size={17} /></button></div><div className="atmosphere-card"><div><span className="small-eyebrow">MAKE YOURSELF AT HOME</span><h3>Your board. Your mood.</h3></div><div className="theme-swatches">{[{ id: "nightfall", color: "#694c80", name: "Nightfall" }, { id: "lavender", color: "#a99ac6", name: "Lavender" }, { id: "wood", color: "#ae815b", name: "Walnut" }, { id: "forest", color: "#69947d", name: "Forest" }].map(t => <button key={t.id} title={t.name} aria-label={`${t.name} board theme`} aria-pressed={settings.themeId === t.id} className={settings.themeId === t.id ? "selected" : ""} style={{ "--swatch": t.color } as React.CSSProperties} onClick={() => update("themeId", t.id)}>{settings.themeId === t.id && <Check size={12} />}</button>)}</div><SettingsDialog trigger={<button className="icon-button" aria-label="More board themes"><SlidersHorizontal size={17} /></button>} /></div></div>
        <footer className="workspace-footer"><span><MousePointer2 size={13} />Click a piece, then its destination.<span className="footer-separator">·</span>{view === "3d" ? "Right-drag to explore in 3D." : "Right-click to annotate."}</span><button onClick={() => setModal("help")}><Keyboard size={14} />Keyboard shortcuts</button></footer>
      </main>
    </div>
    {notice && <div className="app-toast" role="status"><Check size={16} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={14} /></button></div>}
    <GameOverDialog status={state.status} playerColor={state.playerColor} sideToMove={sideToMove} onNewGame={handleNewGame} onAnalyze={() => void handleAnalyze()} />
    <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}><DialogContent className="gambit-dialog"><DialogHeader><DialogTitle>{modal === "help" ? "A few handy shortcuts." : modal === "guide" ? "Small ideas. Better chess." : modal === "new" ? "A fresh start?" : "Ready to call this one?"}</DialogTitle><DialogDescription>{modal === "help" ? "Less clicking, more thinking. Make yourself at home." : modal === "guide" ? "You don’t need to see every move. Start with the next good one." : modal === "new" ? "Starting a new game will clear the current board and move history." : "Resigning ends this game. There’s always a new board waiting."}</DialogDescription></DialogHeader>
      {modal === "help" && <div className="shortcut-list">{[["Flip the board", "F"], ["Previous / next move", "← / →"], ["Take back a move", "["], ["Ask for a hint", "]"], ["Leave focus mode", "Esc"], ["Rotate the 3D board", "Right-drag"], ["Rotate on touchscreens", "Two fingers"]].map(([label, key]) => <div key={label}><span>{label}</span><kbd>{key}</kbd></div>)}<p>Prefer a traditional view? Switch to 2D above the board. All game rules stay exactly the same.</p></div>}
      {modal === "guide" && <div className="guide-list">{[["01", "Make space in the center", "Pawns on e4 or d4 give your bishops and queen room to join the game."], ["02", "Invite everyone to the board", "Develop your knights and bishops before moving the same piece again."], ["03", "Give your king a safe home", "Castle early when you can. Connect your rooks and protect your king."], ["04", "Pause before you play", "Look for checks, captures, and threats — yours and your opponent’s."]].map(([n, title, text]) => <div key={n}><span>{n}</span><section><h3>{title}</h3><p>{text}</p></section></div>)}<Link href="/watch" className="primary-button">Watch & learn<ArrowRight size={17} /></Link></div>}
      {(modal === "new" || modal === "resign") && <div className="dialog-actions"><button className="secondary-button" onClick={() => setModal(null)}>Keep playing</button><button className="primary-button" onClick={() => { if (modal === "new") handleNewGame(); else { resign(); setModal(null) } }}>{modal === "new" ? "Start new game" : "Resign game"}</button></div>}
    </DialogContent></Dialog>
  </div>
}
