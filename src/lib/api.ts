// Optional link to the rsa-bond-api backend. Set VITE_API_URL at build time (e.g. the Render URL)
// to let the site cross-check its own browser-side prices against the server.

export const API_URL: string | undefined = import.meta.env.VITE_API_URL || undefined

export interface ApiPrice {
  code: string
  settle: string
  ytm_percent: number
  ex_coupon: boolean
  accrued_interest: number
  clean_price: number
  all_in_price: number
}

export async function fetchPrice(code: string, settle: string, ytmPercent: number): Promise<ApiPrice> {
  if (!API_URL) throw new Error('No API configured')
  const url = new URL(`/bonds/${encodeURIComponent(code)}/price`, API_URL)
  url.searchParams.set('settle', settle)
  url.searchParams.set('ytm', String(ytmPercent))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API returned ${res.status}`)
  return res.json()
}
