import { create } from 'zustand'

type SimParams = {
  lambda: number
  stayMu: number
  staySigma: number
  speed: number
  toiletProbPerMin: number
  seed: number
}
type Metrics = { occupancy: number; waitAvgSec: number; throughputPerHr: number }

type Store = {
  params: SimParams
  metrics: Metrics
  setParam: <K extends keyof SimParams>(k: K, v: SimParams[K]) => void
  setMetrics: (m: Partial<Metrics>) => void
}

export const useStore = create<Store>((set) => ({
  params: { lambda: 10, stayMu: 4.0, staySigma: 0.5, speed: 1.1, toiletProbPerMin: 0.08, seed: 42 },
  metrics: { occupancy: 0, waitAvgSec: 0, throughputPerHr: 0 },
  setParam: (k, v) => set((s) => ({ params: { ...s.params, [k]: v } })),
  setMetrics: (m) => set((s) => ({ metrics: { ...s.metrics, ...m } })),
}))
