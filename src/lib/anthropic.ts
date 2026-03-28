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
  startDate: string
  goalTime: string
  currentWeeklyMiles: number
  experience: string
  coachNotes?: string
}

export async function generateTrainingPlan(params: PlanGenerationParams) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const totalWeeks = Math.max(1, Math.ceil(
    (new Date(params.raceDate).getTime() - new Date(params.startDate).getTime()) / msPerWeek
  ))

  const prompt = `You are an elite running coach building a personalized training plan.

ATHLETE: ${params.athleteName}
GOAL RACE: ${params.goalRace} on ${params.raceDate}
GOAL TIME: ${params.goalTime}
PLAN START: ${params.startDate}
TOTAL WEEKS: ${totalWeeks}
CURRENT WEEKLY MILEAGE: ${params.currentWeeklyMiles} mi/wk
EXPERIENCE: ${params.experience}${params.coachNotes ? `\n\nCOACHING NOTES FROM COACH:\n${params.coachNotes}` : ''}

INSTRUCTIONS:
- Generate exactly ${totalWeeks} weeks, numbered 1 through ${totalWeeks}
- Each week must have exactly 7 workouts, one per day Monday through Sunday
- Progressively build mileage over the first ${Math.max(1, totalWeeks - 2)} weeks, then taper weeks ${Math.max(1, totalWeeks - 1)}-${totalWeeks}
- The final week should end with a "race" type workout on race day
- workout "type" must be one of: easy, tempo, intervals, long, recovery, rest, race
- "distanceMiles" must be a number (use 0 for rest days)
- "paceTarget" should be specific, e.g. "9:30/mi easy" or "7:45/mi tempo" based on goal time
- "description" must be 1-2 sentences of specific coaching instruction the athlete can act on. Examples:
  - easy: "Keep effort conversational — if you can't hold a sentence, slow down. Focus on cadence over pace today."
  - tempo: "Run the middle 3 miles at goal half-marathon pace. Start conservatively; the effort should feel controlled-hard, not maximal."
  - intervals: "8 x 400m at 5K effort with 90-second jog recoveries. Full recovery between reps — these should feel fast but repeatable."
  - long: "Run the first half easy, the second half at marathon effort. Practice your race-day nutrition every 45 minutes."
  - recovery: "Truly easy — HR below 130. This run exists to flush fatigue, not add fitness. Shorter is fine if you feel flat."
  - rest: "Full rest or gentle walking only. Prioritize sleep and hydration today."
- Start mileage near ${params.currentWeeklyMiles} mi/wk and peak at an appropriate level for the goal race

Output ONLY valid JSON. No markdown. No explanation. Start your response with the opening brace.

Format:
{"totalWeeks":${totalWeeks},"weeks":[{"weekNumber":1,"targetMiles":NUMBER,"workouts":[{"dayOfWeek":"Monday","type":"TYPE","distanceMiles":NUMBER,"paceTarget":"STRING","description":"STRING"},{"dayOfWeek":"Tuesday",...},{"dayOfWeek":"Wednesday",...},{"dayOfWeek":"Thursday",...},{"dayOfWeek":"Friday",...},{"dayOfWeek":"Saturday",...},{"dayOfWeek":"Sunday",...}]},...]}`

  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [
      { role: 'user', content: prompt },
      { role: 'assistant', content: '{"totalWeeks":' },
    ],
  })

  const text = '{"totalWeeks":' + (message.content[0] as { text: string }).text
  return JSON.parse(text)
}
