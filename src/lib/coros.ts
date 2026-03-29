const COROS_CLIENT_ID = process.env.COROS_CLIENT_ID!
const COROS_CLIENT_SECRET = process.env.COROS_CLIENT_SECRET!
const APP_URL = process.env.APP_URL!

const COROS_BASE = 'https://open.coros.com'
const AUTH_URL = `${COROS_BASE}/oauth2/que`
const TOKEN_URL = `${COROS_BASE}/oauth2/accesstoken`
const ACTIVITY_LIST_URL = `${COROS_BASE}/v2/coros/activity/list`

export function getCorosAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: COROS_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/coros/callback`,
    response_type: 'code',
    scope: 'activity',
  })
  return `${AUTH_URL}?${params}`
}

export async function exchangeCorosCode(
  code: string
): Promise<{ userId: string; accessToken: string; refreshToken: string; expiresIn: number }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: COROS_CLIENT_ID,
      client_secret: COROS_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${APP_URL}/api/coros/callback`,
    }),
  })
  const data = await res.json()
  return {
    userId: data.openId ?? data.user_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
  }
}

export async function refreshCorosToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: COROS_CLIENT_ID,
      client_secret: COROS_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

export async function getCorosActivities(
  accessToken: string,
  pageNumber = 1,
  pageSize = 20
): Promise<CorosActivity[]> {
  const res = await fetch(
    `${ACTIVITY_LIST_URL}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  return data?.data?.list ?? []
}

export interface CorosActivity {
  labelId: number
  name: string
  type: number
  date: string           // YYYYMMDD
  startTime: number      // unix seconds
  endTime: number        // unix seconds
  totalTime: number      // seconds
  distance: number       // meters
  avgPace?: number       // seconds per km
  avgHr?: number
  maxHr?: number
  elevationGain?: number
  cadence?: number
}

// Map Coros activity type number to our standard type strings
export function mapCorosActivityType(type: number): string {
  const map: Record<number, string> = {
    100: 'Run',
    101: 'TrailRun',
    102: 'VirtualRun',
    103: 'Hike',
    200: 'Ride',
    201: 'Ride',
    300: 'Walk',
  }
  return map[type] ?? 'Run'
}

// Convert Coros avg pace (sec/km) to meters/sec
export function corosPaceToMps(secPerKm?: number): number | null {
  if (!secPerKm || secPerKm === 0) return null
  return 1000 / secPerKm
}
