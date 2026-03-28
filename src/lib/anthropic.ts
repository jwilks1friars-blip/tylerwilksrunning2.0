import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

interface WeeklyInsightParams {
  athleteName: string
  activities: Array<{
    date: string
    type: string
    distanceMiles: number
    pacePerMile: string
    avgHR?: number
    name: string
  }>
  weeklyMiles: number
  goalRace?: string
  goalTime?: string
  weeksToRace?: number
  upcomingWorkouts?: Array<{
    date: string
    type: string
    description: string
  }>
  coachNotes?: string
}

export async function generateWeeklyInsight(params: WeeklyInsightParams) {
  const activitiesText = params.activities
    .map(a => `- ${a.date}: ${a.name} — ${a.distanceMiles}mi @ ${a.pacePerMile}/mi${a.avgHR ? `, avg HR ${a.avgHR}` : ''}`)
    .join('\n')

  const upcomingText = params.upcomingWorkouts
    ?.map(w => `- ${w.date}: ${w.type} — ${w.description}`)
    .join('\n') ?? 'Not yet planned'

  const coachObservations = params.coachNotes
    ? `\nCOACH'S OWN OBSERVATIONS (weave these naturally into the note — do not quote them verbatim):\n${params.coachNotes}\n`
    : ''

  const prompt = `You are an elite running coach reviewing your athlete's weekly data.

ATHLETE: ${params.athleteName}
GOAL RACE: ${params.goalRace ?? 'Not set'} ${params.weeksToRace ? `(${params.weeksToRace} weeks out)` : ''}
GOAL TIME: ${params.goalTime ?? 'Not set'}

THIS WEEK'S ACTIVITIES (${params.weeklyMiles} miles total):
${activitiesText}

NEXT WEEK'S PLAN:
${upcomingText}
${coachObservations}
Write a 150-200 word coaching note. Be specific — reference actual workouts, actual paces, actual dates. Flag any concerns. Explain any adjustments to next week. Tone: direct, data-driven, encouraging. Do not use bullet points — write in natural paragraphs as a coach would speak.`

  const message = await getClient().messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  return (message.content[0] as { text: string }).text
}

interface PlanGenerationParams {
  athleteName: string
  goalRace: string
  raceDate: string
  goalTime: string
  currentWeeklyMiles: number
  experience: string
  availableDays: string[]
}

export async function generateTrainingPlan(params: PlanGenerationParams) {
  const prompt = `You are an elite running coach. Generate a training plan as compact JSON.

ATHLETE: ${params.athleteName}, Goal: ${params.goalRace} on ${params.raceDate} in ${params.goalTime}, Current mileage: ${params.currentWeeklyMiles} mi/wk, Experience: ${params.experience}

Return ONLY raw JSON — no markdown, no code fences, no extra text. Use short paceTarget values (6 words max). Include rest days as type "rest" with distanceMiles 0.

{"totalWeeks":8,"weeks":[{"weekNumber":1,"targetMiles":30,"workouts":[{"dayOfWeek":"Monday","type":"easy","distanceMiles":6,"paceTarget":"easy pace"},{"dayOfWeek":"Tuesday","type":"rest","distanceMiles":0,"paceTarget":""},{"dayOfWeek":"Wednesday","type":"tempo","distanceMiles":7,"paceTarget":"goal half pace"},{"dayOfWeek":"Thursday","type":"rest","distanceMiles":0,"paceTarget":""},{"dayOfWeek":"Friday","type":"easy","distanceMiles":5,"paceTarget":"easy pace"},{"dayOfWeek":"Saturday","type":"long","distanceMiles":12,"paceTarget":"60-90s slower than goal pace"},{"dayOfWeek":"Sunday","type":"rest","distanceMiles":0,"paceTarget":""}]}]}`

  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 7000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (message.content[0] as { text: string }).text
  // Strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(json)
}
