// Bond maths, ported from the Python rsa-bond-calculator so the site works without a server.
// Conventions: actual/365 accrued interest, books closed 10 days before a payment (ex-coupon),
// semi-annual compounding with time in half-years of 365/2 days.
// Dates are handled as "day numbers" (days since 1970-01-01, UTC) to avoid time-zone bugs.

import type { Bond } from './bonds'

export const BOOKS_CLOSED_DAYS = 10
const HALF_YEAR_DAYS = 365 / 2

export type DayNum = number

export function dayNum(y: number, m: number, d: number): DayNum {
  return Date.UTC(y, m - 1, d) / 86_400_000
}

export function fromISO(iso: string): DayNum {
  const [y, m, d] = iso.split('-').map(Number)
  return dayNum(y, m, d)
}

export function toISO(n: DayNum): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10)
}

function yearOf(n: DayNum): number {
  return new Date(n * 86_400_000).getUTCFullYear()
}

/** Date in a month, with the day clipped to the month's last day (31 -> 30, 29 Feb -> 28 Feb). */
function on(y: number, m: number, d: number): DayNum {
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return dayNum(y, m, Math.min(d, lastDay))
}

/** Regular coupon dates strictly after `start`, up to `end`; maturity is always the last payment. */
export function couponDates(bond: Bond, start: DayNum, end?: DayNum): DayNum[] {
  const maturity = fromISO(bond.maturity)
  const last = end ?? maturity
  const dates = new Set<DayNum>()
  for (let y = yearOf(start); y <= yearOf(maturity); y++) {
    for (const [m, d] of bond.couponDays) {
      const date = on(y, m, d)
      if (start < date && date < maturity && date <= last) dates.add(date)
    }
  }
  if (start < maturity && maturity <= last) dates.add(maturity)
  return [...dates].sort((a, b) => a - b)
}

export function previousCouponDate(bond: Bond, settle: DayNum): DayNum {
  const y = yearOf(settle)
  const candidates = [y - 1, y].flatMap((yr) => bond.couponDays.map(([m, d]) => on(yr, m, d)))
  return Math.max(...candidates.filter((d) => d <= settle))
}

export interface CashFlow {
  date: DayNum
  amount: number
}

/** Remaining cash flows per R100 nominal after settlement. */
export function schedule(bond: Bond, settle: DayNum): CashFlow[] {
  const maturity = fromISO(bond.maturity)
  const perPeriod = (100 * bond.coupon) / 2
  return couponDates(bond, settle).map((date) => {
    if (date !== maturity) return { date, amount: perPeriod }
    const y = yearOf(date)
    const onCycle = bond.couponDays.some(([m, d]) => on(y, m, d) === date)
    const coupon = onCycle
      ? perPeriod
      : (100 * bond.coupon * (date - previousCouponDate(bond, date - 1))) / 365
    return { date, amount: coupon + 100 }
  })
}

export function isExCoupon(bond: Bond, settle: DayNum, booksClosed = BOOKS_CLOSED_DAYS): boolean {
  const upcoming = couponDates(bond, settle)
  return upcoming.length > 0 && upcoming[0] - settle <= booksClosed
}

/** Accrued interest per R100, actual/365. Negative when trading ex-coupon. */
export function accruedInterest(bond: Bond, settle: DayNum, booksClosed = BOOKS_CLOSED_DAYS): number {
  if (settle >= fromISO(bond.maturity)) return 0
  if (isExCoupon(bond, settle, booksClosed)) {
    const next = couponDates(bond, settle)[0]
    return (-100 * bond.coupon * (next - settle)) / 365
  }
  return (100 * bond.coupon * (settle - previousCouponDate(bond, settle))) / 365
}

/** All-in (dirty) price per R100 for an annual yield compounded semi-annually. */
export function allInPrice(bond: Bond, settle: DayNum, ytm: number, booksClosed = BOOKS_CLOSED_DAYS): number {
  let flows = schedule(bond, settle)
  if (flows.length && isExCoupon(bond, settle, booksClosed)) {
    // Ex-coupon: the next coupon goes to the previous holder.
    flows = flows[0].date === fromISO(bond.maturity)
      ? [{ date: flows[0].date, amount: 100 }]
      : flows.slice(1)
  }
  return flows.reduce((sum, f) => sum + f.amount / (1 + ytm / 2) ** ((f.date - settle) / HALF_YEAR_DAYS), 0)
}

export function cleanPrice(bond: Bond, settle: DayNum, ytm: number, booksClosed = BOOKS_CLOSED_DAYS): number {
  return allInPrice(bond, settle, ytm, booksClosed) - accruedInterest(bond, settle, booksClosed)
}

/** Yield that reproduces a clean price, found by bisection. */
export function yieldFromPrice(bond: Bond, settle: DayNum, price: number): number {
  const f = (y: number) => cleanPrice(bond, settle, y) - price
  let lo = -0.5
  let hi = 1.0
  if (f(lo) * f(hi) > 0) throw new Error('Price is outside the range this solver can match.')
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (f(lo) * f(mid) <= 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/** Years from settlement to maturity, for plotting the curve. */
export function yearsToMaturity(bond: Bond, settle: DayNum): number {
  return (fromISO(bond.maturity) - settle) / 365
}
