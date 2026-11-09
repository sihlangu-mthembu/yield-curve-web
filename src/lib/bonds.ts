// RSA conventional fixed-rate government bonds.
// Source: National Treasury, "Schedule of domestic government bonds as at 31 July 2025".
// Same data as the Python rsa-bond-calculator; check against the current schedule before use.

export interface Bond {
  code: string
  coupon: number // annual rate, e.g. 0.0825 for 8.25%
  maturity: string // ISO date YYYY-MM-DD
  couponDays: [number, number][] // [month, day] interest payment dates
}

export const BONDS: Bond[] = [
  { code: 'R2030', coupon: 0.08, maturity: '2030-01-31', couponDays: [[2, 28], [8, 31]] },
  { code: 'R213', coupon: 0.07, maturity: '2031-02-28', couponDays: [[2, 28], [8, 31]] },
  { code: 'R2032', coupon: 0.0825, maturity: '2032-03-31', couponDays: [[3, 31], [9, 30]] },
  { code: 'R2033', coupon: 0.1, maturity: '2033-03-31', couponDays: [[3, 31], [9, 30]] },
  { code: 'R2035', coupon: 0.08875, maturity: '2035-02-28', couponDays: [[2, 28], [8, 31]] },
  { code: 'R209', coupon: 0.0625, maturity: '2036-03-31', couponDays: [[3, 31], [9, 30]] },
  { code: 'R2037', coupon: 0.085, maturity: '2037-01-31', couponDays: [[1, 31], [7, 31]] },
  { code: 'R2038', coupon: 0.10875, maturity: '2038-03-31', couponDays: [[3, 31], [9, 30]] },
  { code: 'R2040', coupon: 0.09, maturity: '2040-01-31', couponDays: [[1, 31], [7, 31]] },
  { code: 'R214', coupon: 0.065, maturity: '2041-02-28', couponDays: [[2, 28], [8, 31]] },
  { code: 'R2053', coupon: 0.11625, maturity: '2053-03-31', couponDays: [[3, 31], [9, 30]] },
]

// Illustrative yields (percent) for the starting curve. Not live market data.
export const ILLUSTRATIVE_YIELDS: Record<string, number> = {
  R2030: 7.6, R213: 7.9, R2032: 8.2, R2033: 8.45, R2035: 8.9, R209: 9.15,
  R2037: 9.4, R2038: 9.55, R2040: 9.75, R214: 9.85, R2053: 10.1,
}

export function getBond(code: string): Bond {
  const bond = BONDS.find((b) => b.code === code.toUpperCase())
  if (!bond) throw new Error(`Unknown bond ${code}`)
  return bond
}
