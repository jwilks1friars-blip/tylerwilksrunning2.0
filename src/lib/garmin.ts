import crypto from 'crypto'

const GARMIN_CONSUMER_KEY = process.env.GARMIN_CONSUMER_KEY!
const GARMIN_CONSUMER_SECRET = process.env.GARMIN_CONSUMER_SECRET!
const APP_URL = process.env.APP_URL!

const REQUEST_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/request_token'
const AUTHORIZE_URL = 'https://connect.garmin.com/oauthConfirm'
const ACCESS_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/access_token'
const WELLNESS_BASE = 'https://healthapi.garmin.com/wellness-api/rest'

// --- OAuth 1.0a helpers ---

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

function buildOAuthHeader(params: Record<string, string>): string {
  const entries = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
  return 'OAuth ' + entries.join(', ')
}

function buildSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret = ''
): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&')

  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(sortedParams)].join('&')
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`

  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')
}

function makeOAuthParams(extra: Record<string, string> = {}) {
  return {
    oauth_consumer_key: GARMIN_CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
    ...extra,
  }
}

// Step 1: Get request token
export async function getGarminRequestToken(): Promise<{ token: string; tokenSecret: string }> {
  const callbackUrl = `${APP_URL}/api/garmin/callback`
  const params = makeOAuthParams({ oauth_callback: callbackUrl })
  const sig = buildSignature('POST', REQUEST_TOKEN_URL, params, GARMIN_CONSUMER_SECRET)
  params['oauth_signature'] = sig

  const res = await fetch(REQUEST_TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: buildOAuthHeader(params) },
  })

  const text = await res.text()
  const parsed = Object.fromEntries(new URLSearchParams(text))
  return { token: parsed.oauth_token, tokenSecret: parsed.oauth_token_secret }
}

// Step 2: Build redirect URL
export function getGarminAuthUrl(requestToken: string): string {
  return `${AUTHORIZE_URL}?oauth_token=${requestToken}`
}

// Step 3: Exchange verifier for access token
export async function exchangeGarminToken(
  requestToken: string,
  requestTokenSecret: string,
  verifier: string
): Promise<{ userId: string; accessToken: string; accessTokenSecret: string }> {
  const params = makeOAuthParams({
    oauth_token: requestToken,
    oauth_verifier: verifier,
  })
  const sig = buildSignature('POST', ACCESS_TOKEN_URL, params, GARMIN_CONSUMER_SECRET, requestTokenSecret)
  params['oauth_signature'] = sig

  const res = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: buildOAuthHeader(params) },
  })

  const text = await res.text()
  const parsed = Object.fromEntries(new URLSearchParams(text))
  return {
    userId: parsed.user_id ?? parsed.oauth_token,
    accessToken: parsed.oauth_token,
    accessTokenSecret: parsed.oauth_token_secret,
  }
}

// Make authenticated Garmin API call
export async function garminGet(
  path: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<unknown> {
  const url = `${WELLNESS_BASE}${path}`
  const params = makeOAuthParams({ oauth_token: accessToken })
  const sig = buildSignature('GET', url, params, GARMIN_CONSUMER_SECRET, accessTokenSecret)
  params['oauth_signature'] = sig

  const res = await fetch(url, {
    headers: { Authorization: buildOAuthHeader(params) },
  })
  return res.json()
}

// Fetch recent activities (summaries)
export async function getGarminActivities(
  accessToken: string,
  accessTokenSecret: string,
  uploadStartTimeInSeconds: number
): Promise<GarminActivity[]> {
  const uploadEndTimeInSeconds = Math.floor(Date.now() / 1000)
  const data = await garminGet(
    `/activities?uploadStartTimeInSeconds=${uploadStartTimeInSeconds}&uploadEndTimeInSeconds=${uploadEndTimeInSeconds}`,
    accessToken,
    accessTokenSecret
  ) as { activityList?: GarminActivity[] }
  return data?.activityList ?? []
}

export interface GarminActivity {
  activityId: number
  activityName: string
  activityType: string
  startTimeInSeconds: number
  durationInSeconds: number
  distanceInMeters: number
  averageSpeedInMetersPerSecond?: number
  averageHeartRateInBeatsPerMinute?: number
  maxHeartRateInBeatsPerMinute?: number
  totalElevationGainInMeters?: number
  averageRunCadenceInStepsPerMinute?: number
}

// Map Garmin activity type to our standard types
export function mapGarminActivityType(garminType: string): string {
  const map: Record<string, string> = {
    RUNNING: 'Run',
    TRAIL_RUNNING: 'TrailRun',
    INDOOR_RUNNING: 'VirtualRun',
    CYCLING: 'Ride',
    WALKING: 'Walk',
    HIKING: 'Hike',
  }
  return map[garminType] ?? 'Run'
}
