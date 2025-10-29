import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import Restaurant from './components/Scene/Restaurant'
import ControlPanel from './components/ControlPanel/ControlPanel'

export type Side = 'left' | 'right' | 'back' | 'front'

export type Config = {
  width: number
  depth: number
  height: number
  wallT: number
  doorWidth: number
  doorHeight: number
  table4Count: number
  table2Count: number
  kitchenSide: Side
  toiletSide: Side
  avgDwell: number
  incoming: number
  avgSpend?: number
}

export type LiveStats = {
  pending: number
  inside: number
  seated: number
  exiting: number
  departed: number
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export default function App() {
  const [cfg, setCfg] = useState<Config>({
    width: 8, depth: 10, height: 2.6, wallT: 0.2,
    doorWidth: 1.2, doorHeight: 2.0,
    table4Count: 0, table2Count: 0,
    kitchenSide: 'right', toiletSide: 'left',
    avgDwell: 30,
    incoming: 0,
    avgSpend: 1500,
  })

  const initialDoorLeft = useMemo(() => (cfg.width - cfg.doorWidth) / 2, [])
  const [doorLeft, setDoorLeft] = useState(initialDoorLeft)
  useEffect(() => {
    const m = 0.1
    setDoorLeft(v => clamp(v, m, Math.max(m, cfg.width - cfg.doorWidth - m)))
  }, [cfg.width, cfg.doorWidth])

  const [stats, setStats] = useState<LiveStats>({
    pending: 0, inside: 0, seated: 0, exiting: 0, departed: 0,
  })

  const [totalSales, setTotalSales] = useState(0)
  const lastDeparted = useRef(0)

  useEffect(() => {
    if (stats.departed > lastDeparted.current) {
      const diff = stats.departed - lastDeparted.current
      setTotalSales(prev => prev + diff * (cfg.avgSpend || 0))
      lastDeparted.current = stats.departed
    }
  }, [stats.departed, cfg.avgSpend])

  return (
    <div
      className="relative min-h-screen text-cyan-200 font-light overflow-hidden holo-space"
      style={{
        background:
          'radial-gradient(circle at center, rgba(0,255,255,0.08) 0%, rgba(0,0,20,0.95) 80%)',
      }}
    >
      {/* 🪐 宇宙ホログラム背景レイヤー */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 30% 50%, rgba(0,255,255,0.08) 0%, transparent 70%),
            radial-gradient(circle at 70% 60%, rgba(0,150,255,0.1) 0%, transparent 70%),
            linear-gradient(180deg, rgba(0,0,20,0.9) 0%, rgba(0,0,0,1) 100%)
          `,
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      ></div>

      {/* ✨ ホログラムグリッド */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(180deg, rgba(0,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.3,
          zIndex: 1,
        }}
      ></div>

      {/* 🌌 ゆらめく光層 */}
      <div className="holo-overlay"></div>

      {/* Three.js Canvas */}
      <Canvas
        frameloop="always"
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 45, position: [0, 3.2, 7] }}
        style={{
          width: '100vw',
          height: '100vh',
          display: 'block',
          background: 'transparent',
          zIndex: 2,
        }}
      >
        <Suspense fallback={null}>
          <Restaurant
            cfg={cfg}
            setCfg={setCfg}
            doorLeft={doorLeft}
            setDoorLeft={setDoorLeft}
            onStats={setStats}
          />
        </Suspense>
      </Canvas>

      {/* コントロールパネル */}
      <div
        style={{
          position: 'fixed',
          left: 20,
          top: 20,
          zIndex: 10,
          border: '1px solid rgba(0,255,255,0.3)',
          background: 'rgba(255,255,255,0.05)',
          boxShadow: '0 0 25px rgba(0,255,255,0.15)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '12px',
        }}
      >
        <ControlPanel
          cfg={cfg}
          setCfg={setCfg}
          doorLeft={doorLeft}
          setDoorLeft={(v: number) => {
            const m = 0.1
            setDoorLeft(clamp(v, m, Math.max(m, cfg.width - cfg.doorWidth - m)))
          }}
          stats={stats}
          totalSales={totalSales}
        />
      </div>

      {/* タイトル発光 */}
      <div
        className="holo-glow"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 30,
          fontSize: '1rem',
          letterSpacing: '0.1em',
          color: 'rgba(0,255,255,0.8)',
          textShadow: '0 0 15px rgba(0,255,255,0.7)',
        }}
      >
        HELIOS SIMULATION
      </div>
    </div>
  )
}
