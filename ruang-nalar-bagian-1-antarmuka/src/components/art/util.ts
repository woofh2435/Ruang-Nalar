export const f1 = (n: number) => Math.round(n * 10) / 10

/** Titik pada kurva Bezier kubik. */
export function bez(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]
}

/** Id unik yang aman dipakai di url(#...) */
export const amanId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '')
