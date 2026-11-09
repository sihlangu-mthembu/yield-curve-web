import { describe, expect, it } from 'vitest'
import { getBond } from './bonds'
import {
  accruedInterest,
  allInPrice,
  cleanPrice,
  couponDates,
  fromISO,
  isExCoupon,
  schedule,
  toISO,
  yieldFromPrice,
} from './calc'

const R2032 = getBond('R2032')

describe('bond calculations (match the Python library)', () => {
  it('R2032 pays on 31 March and 30 September', () => {
    const dates = couponDates(R2032, fromISO('2026-01-01'), fromISO('2027-12-31')).map(toISO)
    expect(dates).toEqual(['2026-03-31', '2026-09-30', '2027-03-31', '2027-09-30'])
  })

  it('final payment is redemption plus coupon', () => {
    const flows = schedule(R2032, fromISO('2031-12-01'))
    const last = flows[flows.length - 1]
    expect(toISO(last.date)).toBe('2032-03-31')
    expect(last.amount).toBeCloseTo(104.125, 10)
  })

  it('accrued interest is actual/365 and zero on a coupon date', () => {
    expect(accruedInterest(R2032, fromISO('2026-09-30'))).toBeCloseTo(0, 10)
    expect(accruedInterest(R2032, fromISO('2026-10-30'))).toBeCloseTo((8.25 * 30) / 365, 10)
  })

  it('accrued interest is negative when ex-coupon', () => {
    const settle = fromISO('2027-03-25')
    expect(isExCoupon(R2032, settle)).toBe(true)
    expect(accruedInterest(R2032, settle)).toBeCloseTo((-8.25 * 6) / 365, 10)
  })

  it('reproduces the Python price for R2032 at 8.9% on 9 Nov 2026', () => {
    const settle = fromISO('2026-11-09')
    expect(accruedInterest(R2032, settle)).toBeCloseTo(0.90411, 5)
    expect(cleanPrice(R2032, settle, 0.089)).toBeCloseTo(97.22148, 4)
    expect(allInPrice(R2032, settle, 0.089)).toBeCloseTo(98.12559, 4)
  })

  it('solves the yield back from the price', () => {
    const bond = getBond('R2035')
    const settle = fromISO('2026-11-09')
    const price = cleanPrice(bond, settle, 0.0975)
    expect(yieldFromPrice(bond, settle, price)).toBeCloseTo(0.0975, 8)
  })

  it('unknown bonds throw', () => {
    expect(() => getBond('R999')).toThrow()
  })
})
