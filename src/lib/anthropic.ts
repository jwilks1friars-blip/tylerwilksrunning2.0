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
}

export async function generateWeeklyInsight(params: WeeklyInsightParams) {
  const activitiesText = params.activities
    .map(a => `- ${a.date}: ${a.name} — ${a.distanceMiles}mi @ ${a.pacePerMile}/mi${a.avgHR ? `, avg HR ${a.avgHR}` : ''}`)
    .join('\n')

  const upcomingText = params.upcomingWorkouts
    ?.map(w => `- ${w.date}: ${w.type} — ${w.description}`)
    .join('\n') ?? 'Not yet planned'

  const prompt = `You are an elite running coach reviewing your athlete's weekly data.

ATHLETE: ${params.athleteName}
GOAL RACE: ${params.goalRace ?? 'Not set'} ${params.weeksToRace ? `(${params.weeksToRace} weeks out)` : ''}
GOAL TIME: ${params.goalTime ?? 'Not set'}

THIS WEEK'S ACTIVITIES (${params.weeklyMiles} miles total):
${activitiesText}

NEXT WEEK'S PLAN:
${upcomingText}

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
  const prompt = `You are an elite running coach. Generate a structured training plan as JSON.

ATHLETE DETAILS:
- Name: ${params.athleteName}
- Goal Race: ${params.goalRace} on ${params.raceDate}
- Goal Time: ${params.goalTime}
- Current Weekly Mileage: ${params.currentWeeklyMiles} miles/week
- Experience: ${params.experience}
- Available Days: ${params.availableDays.join(', ')}

Generate a week-by-week training plan. Return ONLY valid JSON in this exact format:
{
  "totalWeeks": 16,
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Base Building",
      "targetMiles": 35,
      "workouts": [
        {
          "dayOfWeek": "Monday",
          "type": "easy",
          "distanceMiles": 6,
          "paceTarget": "easy, conversational",
          "description": "Easy aerobic run. Keep HR below 140."
        }
      ]
    }
  ]
}`

  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (message.content[0] as { text: string }).text
  // Strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(json)
}
