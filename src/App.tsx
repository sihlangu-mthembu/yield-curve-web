import { useMemo, useState } from 'react'
import './App.css'
import { YieldCurveChart } from './components/YieldCurveChart'
import { API_URL, type ApiPrice, fetchPrice } from './lib/api'
import { BONDS, getBond, ILLUSTRATIVE_YIELDS } from './lib/bonds'
import {
  accruedInterest,
  allInPrice,
  cleanPrice,
  fromISO,
  isExCoupon,
  schedule,
  toISO,
  yearsToMaturity,
} from './lib/calc'

const today = new Date().toISOString().slice(0, 10)
const fmt = (n: number, dp = 4) => n.toFixed(dp)

export default function App() {
  const [settle, setSettle] = useState(today)
  const [yields, setYields] = useState<Record<string, number>>(ILLUSTRATIVE_YIELDS)
  const [selected, setSelected] = useState('R2032')
  const [apiResult, setApiResult] = useState<ApiPrice | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const settleDay = fromISO(settle)
  const live = useMemo(() => BONDS.filter((b) => fromISO(b.maturity) > settleDay), [settleDay])

  const rows = live.map((b) => {
    const ytm = (yields[b.code] ?? 0) / 100
    return {
      bond: b,
      years: yearsToMaturity(b, settleDay),
      accrued: accruedInterest(b, settleDay),
      clean: cleanPrice(b, settleDay, ytm),
      exCoupon: isExCoupon(b, settleDay),
    }
  })

  const bond = live.some((b) => b.code === selected) ? getBond(selected) : live[0]
  const ytm = bond ? (yields[bond.code] ?? 0) / 100 : 0

  async function checkWithApi() {
    if (!bond) return
    setApiError(null)
    setApiResult(null)
    try {
      setApiResult(await fetchPrice(bond.code, settle, yields[bond.code]))
    } catch (e) {
      setApiError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <main>
      <header>
        <h1>RSA government bond yield curve</h1>
        <p className="muted">
          Edit any yield and the curve, prices and cash flows update instantly. Starting yields are illustrative,
          not live market data. Bond data: National Treasury schedule of domestic government bonds.
        </p>
        <label className="settle">
          Settlement date{' '}
          <input type="date" value={settle} onChange={(e) => e.target.value && setSettle(e.target.value)} />
        </label>
      </header>

      <section className="card">
        <YieldCurveChart
          points={rows.map((r) => ({ code: r.bond.code, years: r.years, yieldPercent: yields[r.bond.code] }))}
          selected={bond?.code}
          onSelect={setSelected}
        />
      </section>

      <div className="columns">
        <section className="card">
          <h2>Bonds</h2>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bond</th><th>Coupon</th><th>Maturity</th><th>Yield %</th><th>Clean</th><th>Accrued</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.bond.code}
                  className={r.bond.code === bond?.code ? 'active' : ''}
                  onClick={() => setSelected(r.bond.code)}
                >
                  <td>{r.bond.code}{r.exCoupon && <span className="tag" title="Books closed: trading ex-coupon">ex</span>}</td>
                  <td>{(r.bond.coupon * 100).toFixed(3)}%</td>
                  <td>{r.bond.maturity}</td>
                  <td>
                    <input
                      type="number"
                      step="0.05"
                      aria-label={`${r.bond.code} yield`}
                      value={yields[r.bond.code]}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setYields({ ...yields, [r.bond.code]: Number(e.target.value) })}
                    />
                  </td>
                  <td>{fmt(r.clean, 3)}</td>
                  <td>{fmt(r.accrued, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        {bond && (
          <section className="card">
            <h2>{bond.code} detail</h2>
            <dl>
              <dt>Yield</dt><dd>{(ytm * 100).toFixed(3)}%</dd>
              <dt>Ex-coupon</dt><dd>{isExCoupon(bond, settleDay) ? 'Yes' : 'No'}</dd>
              <dt>Accrued interest</dt><dd>{fmt(accruedInterest(bond, settleDay), 5)}</dd>
              <dt>Clean price</dt><dd>{fmt(cleanPrice(bond, settleDay, ytm), 5)}</dd>
              <dt>All-in price</dt><dd>{fmt(allInPrice(bond, settleDay, ytm), 5)}</dd>
            </dl>

            {API_URL && (
              <div className="api">
                <button type="button" onClick={checkWithApi}>Cross-check with API</button>
                {apiResult && <p>API clean price: {fmt(apiResult.clean_price, 5)} · all-in: {fmt(apiResult.all_in_price, 5)}</p>}
                {apiError && <p className="error">{apiError}</p>}
              </div>
            )}

            <h3>Remaining cash flows per R100</h3>
            <div className="scroll">
              <table>
                <thead><tr><th>Date</th><th>Amount</th></tr></thead>
                <tbody>
                  {schedule(bond, settleDay).map((f) => (
                    <tr key={f.date}><td>{toISO(f.date)}</td><td>{fmt(f.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <footer className="muted">
        Actual/365 accrued interest, books closed 10 days before payment, semi-annual compounding. Prices approximate
        the JSE formula but are not settlement figures. Built with AI assistance by Sihlangu Mthembu ·{' '}
        <a href="https://github.com/sihlangu-mthembu/yield-curve-web">source</a>
      </footer>
    </main>
  )
}
