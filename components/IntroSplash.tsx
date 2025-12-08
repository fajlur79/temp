"use client"
import Lottie from "lottie-react"
import { useEffect, useState, useRef, useMemo } from "react"
import { usePathname } from "next/navigation"
import "@/styles/intro.css"

const GRID_CONFIG = {
  cols: 5, // Number of columns
  rows: 4, // Number of rows
  variance: 0.3, // How irregular the pieces are (0 = perfect grid, 1 = very irregular)
}

const PAPER_PLANE_INDEX = 6

function generatePieces(cols: number, rows: number, variance: number) {
  const pieces: Array<{ x: number; y: number; w: number; h: number }> = []
  const baseWidth = 100 / cols
  const baseHeight = 100 / rows

  // Generate column widths with variance
  const colWidths: number[] = []
  let totalWidth = 0
  for (let i = 0; i < cols; i++) {
    const randomFactor = 1 + (Math.random() - 0.5) * variance
    colWidths.push(baseWidth * randomFactor)
    totalWidth += colWidths[i]
  }
  // Normalize to 100%
  colWidths.forEach((_, i) => (colWidths[i] = (colWidths[i] / totalWidth) * 100))

  // Generate row heights with variance
  const rowHeights: number[] = []
  let totalHeight = 0
  for (let i = 0; i < rows; i++) {
    const randomFactor = 1 + (Math.random() - 0.5) * variance
    rowHeights.push(baseHeight * randomFactor)
    totalHeight += rowHeights[i]
  }
  // Normalize to 100%
  rowHeights.forEach((_, i) => (rowHeights[i] = (rowHeights[i] / totalHeight) * 100))

  // Generate pieces
  let y = 0
  for (let row = 0; row < rows; row++) {
    let x = 0
    for (let col = 0; col < cols; col++) {
      pieces.push({
        x: x,
        y: y,
        w: colWidths[col],
        h: rowHeights[row],
      })
      x += colWidths[col]
    }
    y += rowHeights[row]
  }

  return pieces
}

export default function IntroSplash() {
  const [show, setShow] = useState(true)
  const [animationData, setAnimationData] = useState(null)
  const [breakApart, setBreakApart] = useState(false)
  const [planePhase, setPlanePhase] = useState<"hidden" | "folding" | "flying" | "done">("hidden")
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const pieces = useMemo(() => generatePieces(GRID_CONFIG.cols, GRID_CONFIG.rows, GRID_CONFIG.variance), [])

  useEffect(() => {
    fetch("/intro.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load animation:", err))

    const breakTimer = setTimeout(() => {
      setBreakApart(true)
      setTimeout(() => setPlanePhase("folding"), 200)
      setTimeout(() => setPlanePhase("flying"), 800)
      setTimeout(() => setPlanePhase("done"), 3300)
    }, 3500)

    const cleanupTimer = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem("intro-shown", "true")
    }, 5500)

    return () => {
      clearTimeout(breakTimer)
      clearTimeout(cleanupTimer)
    }
  }, [pathname])

  if (!show) return null

  const planePiece = pieces[PAPER_PLANE_INDEX]

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] overflow-hidden" style={{ perspective: "1000px" }}>
      {/* Phase 1: Solid intro screen */}
      {!breakApart && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
          <div className="w-64 h-64 md:w-96 md:h-96">
            {animationData && (
              <Lottie
                animationData={animationData}
                loop={true}
                autoplay={true}
                style={{ height: "100%", width: "100%" }}
              />
            )}
          </div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">Apodartho</h1>
            <p className="text-xs text-muted-foreground tracking-widest">Loading Knowledge...</p>
          </div>
        </div>
      )}

      {/* Phase 2: Breaking pieces */}
      {breakApart && (
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {pieces.map((piece, index) => {
            if (index === PAPER_PLANE_INDEX) return null

            return (
              <div
                key={index}
                className="intro-piece animate"
                style={{
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                  width: `${piece.w}%`,
                  height: `${piece.h}%`,
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  className="absolute"
                  style={{
                    left: `${(-piece.x * 100) / piece.w}%`,
                    top: `${(-piece.y * 100) / piece.h}%`,
                    width: `${10000 / piece.w}%`,
                    height: `${10000 / piece.h}%`,
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-screen w-screen bg-background">
                    <div className="w-64 h-64 md:w-96 md:h-96">
                      {animationData && (
                        <Lottie
                          animationData={animationData}
                          loop={false}
                          autoplay={false}
                          style={{ height: "100%", width: "100%" }}
                        />
                      )}
                    </div>
                    <div className="mt-8 flex flex-col items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">Apodartho</h1>
                      <p className="text-xs text-muted-foreground tracking-widest">Loading Knowledge...</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {planePhase !== "done" && planePiece && (
            <div
              className={`paper-plane-container ${planePhase}`}
              style={{
                left: `${planePiece.x}%`,
                top: `${planePiece.y}%`,
                width: `${planePiece.w}%`,
                height: `${planePiece.h}%`,
              }}
            >
              {/* Original piece content (visible during folding) */}
              {planePhase === "hidden" || planePhase === "folding" ? (
                <div
                  className={`piece-to-plane ${planePhase === "folding" ? "folding" : ""}`}
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div
                    className="absolute"
                    style={{
                      left: `${(-planePiece.x * 100) / planePiece.w}%`,
                      top: `${(-planePiece.y * 100) / planePiece.h}%`,
                      width: `${10000 / planePiece.w}%`,
                      height: `${10000 / planePiece.h}%`,
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-screen w-screen bg-background">
                      <div className="w-64 h-64 md:w-96 md:h-96">
                        {animationData && (
                          <Lottie
                            animationData={animationData}
                            loop={false}
                            autoplay={false}
                            style={{ height: "100%", width: "100%" }}
                          />
                        )}
                      </div>
                      <div className="mt-8 flex flex-col items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-widest uppercase text-primary">Apodartho</h1>
                        <p className="text-xs text-muted-foreground tracking-widest">Loading Knowledge...</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Paper plane SVG (visible during flying) */
                <div className="paper-plane-wrapper">
                  <svg className="paper-plane" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Paper plane shape */}
                    <path
                      d="M8 32L56 8L40 56L32 36L8 32Z"
                      fill="hsl(var(--background))"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                    />
                    <path d="M32 36L56 8" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5" />
                    <path d="M32 36L40 56" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5" />
                    {/* Fold line */}
                    <path
                      d="M8 32L40 56"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                      opacity="0.3"
                    />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
