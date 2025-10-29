import { makeRng, randLogNormal, poissonKnuth } from '../utils/stats'
import { useStore } from '../store/useStore'

let tAcc = 0
export function stepCrowdSystem(dtSec: number) {
  const { params, setMetrics } = useStore.getState()
  const rng = makeRng(params.seed)

  tAcc += dtSec
  if (tAcc >= 60) {
    const arrivals = poissonKnuth(rng, params.lambda)
    setMetrics({ throughputPerHr: arrivals * 60 })
    tAcc = 0
  }

  const occ = Math.max(0, Math.min(1, Math.log1p(randLogNormal(rng, params.stayMu, params.staySigma)) / 10))
  const wait = Math.max(0, 30 - params.lambda)
  setMetrics({ occupancy: occ, waitAvgSec: wait })
}
