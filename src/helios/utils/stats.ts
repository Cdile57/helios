export function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return (s & 0xfffffff) / 0xfffffff
  }
}

export function randLogNormal(rng: () => number, mu: number, sigma: number) {
  const u1 = Math.max(rng(), 1e-12), u2 = rng()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.exp(mu + sigma * z0)
}

export function poissonKnuth(rng: () => number, lambda: number) {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= rng() } while (p > L)
  return k - 1
}
