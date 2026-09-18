"use client"

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, RoundedBox } from "@react-three/drei"
import { Chess, type Square, type PieceSymbol } from "chess.js"
import * as THREE from "three"
import { ChessBoard, type ChessBoardProps } from "@/components/chess-board"
import { useSettings } from "@/hooks/use-settings"

const FILES = "abcdefgh"
const PIECE_NAMES = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" }

// Turned profiles give the pieces a continuous, sculpted Staunton silhouette.
function profile(type: PieceSymbol) {
  const height = type === "p" ? 0.63 : type === "r" ? 0.76 : type === "n" ? 0.55 : type === "b" ? 0.95 : 1.06
  return [[0, 0], [.29, 0], [.33, .04], [.33, .10], [.30, .14], [.27, .17], [.27, .21], [.23, .25], [.21, .29], [.17, .36], [.13, height * .70], [.14, height * .82], [.21, height * .86], [.22, height * .92], [.19, height], [0, height]].map(([x, y]) => new THREE.Vector2(x, y))
}

function Piece({ type, color, selected }: { type: PieceSymbol; color: "w" | "b"; selected: boolean }) {
  const { settings } = useSettings()
  const group = useRef<THREE.Group>(null)
  const points = useMemo(() => profile(type), [type])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: color === "w" ? "#fffaf0" : "#342b49", roughness: .27, metalness: .12 }), [color])
  const horse = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-.22, 0); s.lineTo(.22, 0); s.bezierCurveTo(.18, .28, .07, .40, .16, .55)
    s.lineTo(.32, .51); s.lineTo(.38, .60); s.lineTo(.26, .83); s.lineTo(.08, .96)
    s.lineTo(.04, 1.10); s.lineTo(-.08, .98); s.lineTo(-.19, 1.04)
    s.bezierCurveTo(-.37, .72, -.32, .35, -.22, 0)
    return s
  }, [])
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, dt) => {
    if (group.current) group.current.position.y = settings.animationsEnabled ? THREE.MathUtils.damp(group.current.position.y, selected ? .18 : 0, 12, dt) : selected ? .18 : 0
  })
  return <group ref={group}>
    <mesh castShadow receiveShadow material={material}><latheGeometry args={[points, 40]} /></mesh>
    {type === "p" && <mesh position={[0, .78, 0]} castShadow material={material}><sphereGeometry args={[.205, 24, 20]} /></mesh>}
    {type === "r" && <group>
      <mesh position={[0, .85, 0]} castShadow material={material}><cylinderGeometry args={[.28, .22, .22, 32]} /></mesh>
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 3) * .22, 1.02, Math.sin(i * Math.PI / 3) * .22]} rotation={[0, -i * Math.PI / 3, 0]} material={material} castShadow><boxGeometry args={[.13, .18, .15]} /></mesh>)}
    </group>}
    {type === "b" && <group>
      <mesh position={[0, 1.12, 0]} scale={[1, 1.45, 1]} material={material} castShadow><sphereGeometry args={[.19, 24, 20]} /></mesh>
      <mesh position={[0, 1.40, 0]} material={material} castShadow><sphereGeometry args={[.065, 16, 12]} /></mesh>
      <mesh position={[.06, 1.20, .15]} rotation={[0, 0, -.5]}><boxGeometry args={[.035, .21, .07]} /><meshStandardMaterial color={color === "w" ? "#ada397" : "#171121"} /></mesh>
    </group>}
    {type === "n" && <group position={[0, .48, 0]} rotation={[0, color === "w" ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh position={[0, 0, -.105]} material={material} castShadow><extrudeGeometry args={[horse, { depth: .21, bevelEnabled: true, bevelSize: .045, bevelThickness: .045, bevelSegments: 3, steps: 1 }]} /></mesh>
      {[-.155, .155].map(z => <mesh key={z} position={[.095, .83, z]}><sphereGeometry args={[.026, 12, 8]} /><meshStandardMaterial color={color === "w" ? "#544460" : "#b8a9cc"} /></mesh>)}
    </group>}
    {type === "q" && <group>
      <mesh position={[0, 1.17, 0]} castShadow material={material}><cylinderGeometry args={[.27, .15, .25, 32]} /></mesh>
      {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI * 2 / 7) * .23, 1.34, Math.sin(i * Math.PI * 2 / 7) * .23]} castShadow material={material}><sphereGeometry args={[.065, 12, 10]} /></mesh>)}
      <mesh position={[0, 1.39, 0]} material={material} castShadow><sphereGeometry args={[.10, 20, 16]} /></mesh>
    </group>}
    {type === "k" && <group>
      <mesh position={[0, 1.17, 0]} material={material} castShadow><sphereGeometry args={[.19, 24, 16]} /></mesh>
      <mesh position={[0, 1.46, 0]} material={material} castShadow><boxGeometry args={[.11, .40, .11]} /></mesh>
      <mesh position={[0, 1.50, 0]} material={material} castShadow><boxGeometry args={[.33, .11, .11]} /></mesh>
    </group>}
  </group>
}

function Coordinate({ text, position, rotate = false }: { text: string; position: [number, number, number]; rotate?: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 64; canvas.height = 64
    const ctx = canvas.getContext("2d")!
    ctx.font = "500 38px Arial"; ctx.fillStyle = "#7b718c"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 32, 32)
    return new THREE.CanvasTexture(canvas)
  }, [text])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={position} rotation={[-Math.PI / 2, 0, rotate ? Math.PI : 0]}><planeGeometry args={[.25, .25]} /><meshBasicMaterial map={texture} transparent depthWrite={false} /></mesh>
}

function Camera({ reset }: { reset: number }) {
  const { camera, size, invalidate } = useThree()
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera
    cam.position.set(4.4, 11.8, 15.8)
    cam.lookAt(0, 0, 0)
    cam.zoom = Math.min(size.width / 11.8, size.height / 9.8)
    cam.updateProjectionMatrix()
    invalidate()
  }, [camera, size, reset, invalidate])
  return null
}

class BoardBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function ChessBoard3D(props: ChessBoardProps & { resetView?: number }) {
  const { settings, theme } = useSettings()
  const [selected, setSelected] = useState<Square | null>(null)
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null)
  const [hovered, setHovered] = useState<Square | null>(null)
  const [webgl, setWebgl] = useState(true)
  const chess = useMemo(() => new Chess(props.fen), [props.fen])
  const legal = useMemo(() => selected ? props.legalMovesFrom(selected) : [], [selected, props.legalMovesFrom])
  useEffect(() => { setSelected(null); setPromotion(null) }, [props.fen, props.orientation])
  useEffect(() => {
    const c = document.createElement("canvas")
    const gl = c.getContext("webgl2")
    if (!gl) setWebgl(false)
    gl?.getExtension("WEBGL_lose_context")?.loseContext()
  }, [])
  const clickSquare = (square: Square) => {
    if (!props.interactive || promotion) return
    const piece = chess.get(square)
    if (piece?.color === props.playerColor) { setSelected(selected === square ? null : square); return }
    const target = legal.find(move => move.to === square)
    if (selected && target) {
      if (target.promotion && !settings.autoQueen) setPromotion({ from: selected, to: square })
      else void props.onMove(selected, square, target.promotion ? "q" : undefined)
    }
    setSelected(null)
  }
  const squares = Array.from({ length: 64 }, (_, i) => {
    const file = i % 8, row = Math.floor(i / 8)
    const square = `${FILES[file]}${8 - row}` as Square
    return { square, file, row, piece: chess.get(square) }
  })
  const fallback = <div className="board-fallback"><p>3D is unavailable on this device. Enjoy the 2D board.</p><ChessBoard {...props} /></div>
  if (!webgl) return fallback
  return <div className="three-board" style={{ cursor: hovered && props.interactive ? "pointer" : "default" }}>
    <BoardBoundary fallback={fallback}>
      <Canvas shadows dpr={[1, 1.8]} orthographic camera={{ position: [4.4, 11.8, 15.8], zoom: 50, near: .1, far: 100 }} gl={{ antialias: true, alpha: true }} aria-label="Interactive 3D chessboard. Select a piece, then a highlighted square." onPointerMissed={() => setSelected(null)}>
        <Camera reset={props.resetView ?? 0} />
        <ambientLight intensity={1.5} />
        <hemisphereLight args={["#ffffff", "#9981af", 1.2]} />
        <directionalLight position={[-4, 10, 5]} intensity={3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.035} shadow-bias={-.0001} />
        <directionalLight position={[6, 6, -4]} intensity={1.5} color="#e3d5ff" />
        <group rotation={[0, props.orientation === "b" ? Math.PI : 0, 0]}>
          <RoundedBox args={[8.85, .32, 8.85]} radius={.12} smoothness={4} position={[0, -.19, 0]} castShadow receiveShadow><meshStandardMaterial color={theme.surface} roughness={.5} /></RoundedBox>
          <RoundedBox args={[8.92, .10, 8.92]} radius={.06} smoothness={3} position={[0, -.36, 0]} castShadow><meshStandardMaterial color="#736182" metalness={.3} roughness={.4} /></RoundedBox>
          {squares.map(({ square, file, row, piece }) => {
            const target = legal.some(m => m.to === square)
            const isCheck = piece?.type === "k" && piece.color === chess.turn() && chess.isCheck()
            const isLast = settings.highlightLastMove && (props.lastMove?.from === square || props.lastMove?.to === square)
            const hint = props.bestMoveHint?.from === square || props.bestMoveHint?.to === square
            const active = selected === square
            const color = isCheck ? "#dc8b91" : active ? "#a08cd2" : hint ? "#c5b2f1" : isLast ? "#c0afd9" : hovered === square && props.interactive ? "#cbbfdf" : (file + row) % 2 === 0 ? theme.light : theme.dark
            return <group key={square} position={[file - 3.5, 0, row - 3.5]} onClick={e => { e.stopPropagation(); clickSquare(square) }} onPointerOver={e => { e.stopPropagation(); setHovered(square) }} onPointerOut={() => setHovered(null)}>
              <mesh receiveShadow position={[0, -.012, 0]}><boxGeometry args={[1, .045, 1]} /><meshStandardMaterial color={color} roughness={.65} /></mesh>
              {piece && <group position={[0, .02, 0]}><Piece type={piece.type} color={piece.color} selected={active} /></group>}
              {target && settings.showLegalMoves && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .027, 0]}><ringGeometry args={piece ? [.36, .43, 40] : [0, .12, 32]} /><meshBasicMaterial color="#7355b8" transparent opacity={.65} /></mesh>}
            </group>
          })}
          {settings.showCoordinates && Array.from({ length: 8 }, (_, i) => <group key={i}>
            <Coordinate text={FILES[i]} position={[i - 3.5, -.02, 4.22]} />
            <Coordinate text={FILES[i]} position={[i - 3.5, -.02, -4.22]} rotate />
            <Coordinate text={String(8 - i)} position={[-4.22, -.02, i - 3.5]} />
            <Coordinate text={String(8 - i)} position={[4.22, -.02, i - 3.5]} rotate />
          </group>)}
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.44, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={.13} /></mesh>
        <OrbitControls key={props.resetView} enablePan={false} enableZoom={false} minPolarAngle={.15} maxPolarAngle={Math.PI / 2.7} mouseButtons={{ LEFT: undefined, MIDDLE: undefined, RIGHT: THREE.MOUSE.ROTATE }} touches={{ ONE: undefined, TWO: THREE.TOUCH.ROTATE }} />
      </Canvas>
    </BoardBoundary>
    <div className="sr-only" aria-label="Accessible chessboard">{squares.map(({ square, piece }) => <button key={square} disabled={!props.interactive} onClick={() => clickSquare(square)} aria-pressed={selected === square}>{square}{piece ? ` ${piece.color === "w" ? "White" : "Black"} ${PIECE_NAMES[piece.type]}` : " empty"}{legal.some(m => m.to === square) ? ", legal move" : ""}</button>)}</div>
    {promotion && <div className="promotion-picker" role="dialog" aria-label="Choose promotion"><p>Promote your pawn</p>{(["q", "r", "b", "n"] as const).map(piece => <button key={piece} onClick={() => { void props.onMove(promotion.from, promotion.to, piece); setPromotion(null) }}>{PIECE_NAMES[piece]}</button>)}</div>}
  </div>
}
