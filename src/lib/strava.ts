const STRAVA_BASE = 'https://www.strava.com/api/v3'

export function getStravaAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL}/api/strava/callback`,
    response_type: 'code',
    scope: 'read,activity:read_all',
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function exchangeStravaCode(code: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  return res.json()
}

export async function refreshStravaToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

export async function getStravaActivities(accessToken: string, after?: number) {
  const params = new URLSearchParams({ per_page: '50' })
  if (after) params.set('after', String(after))
  const res = await fetch(`${STRAVA_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

// Fetch ALL activities by paginating through every page
export async function getAllStravaActivities(accessToken: string): Promise<unknown[]> {
  const all: unknown[] = []
  let page = 1
  while (true) {
    const params = new URLSearchParams({ per_page: '100', page: String(page) })
    const res = await fetch(`${STRAVA_BASE}/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const batch = await res.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    all.push(...batch)
    if (batch.length < 100) break // last page
    page++
  }
  return all
}

export async function getStravaActivity(accessToken: string, activityId: number) {
  const res = await fetch(`${STRAVA_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.json()
}

// Convert meters/sec to min/mile string e.g. "7:08"
export function mpsToMinPerMile(mps: number): string {
  if (!mps) return '—'
  const secPerMile = 1609.34 / mps
  const min = Math.floor(secPerMile / 60)
  const sec = Math.round(secPerMile % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

// Convert meters to miles
export function metersToMiles(m: number): number {
  return Math.round((m / 1609.34) * 100) / 100
}
