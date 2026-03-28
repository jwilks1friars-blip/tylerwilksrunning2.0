export const dynamic = 'force-dynamic'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ScheduleBuilder from '@/components/coach/ScheduleBuilder'

export default async function AthleteSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id !== process.env.COACH_USER_ID) redirect('/dashboard')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: profile }, { data: plan }] = await Promise.all([
    admin.from('profiles').select('full_name, email, goal_race, goal_time').eq('id', id).single(),
    admin.from('training_plans').select('*').eq('user_id', id).in('status', ['active', 'draft'])
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!profile) notFound()

  const [workoutsResult, weeklyNotesResult] = await Promise.all([
    plan
      ? admin.from('workouts').select('*').eq('plan_id', plan.id).order('scheduled_date', { ascending: true })
      : Promise.resolve({ data: [] }),
    plan
      ? admin.from('weekly_notes').select('week_num, content').eq('plan_id', plan.id)
      : Promise.resolve({ data: [] }),
  ])

  const workouts = workoutsResult.data
  const weeklyNotesMap: Record<number, string> = {}
  weeklyNotesResult.data?.forEach((n: { week_num: number; content: string }) => {
    weeklyNotesMap[n.week_num] = n.content
  })

  return (
    <div className="max-w-4xl">
      <Link
        href={`/coach/athletes/${id}`}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-8 transition-colors hover:text-[#1a1917]"
        style={{ color: '#9c9895' }}
      >
        ← {profile.full_name ?? 'Athlete'}
      </Link>

      <div className="mb-8">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#1a1917' }}
        >
          Schedule
        </h2>
        <p className="text-sm mt-1" style={{ color: '#9c9895' }}>
          {profile.full_name} · {profile.email}
        </p>
      </div>

      <ScheduleBuilder
        athleteId={id}
        plan={plan ?? null}
        workouts={workouts ?? []}
        profile={{ goal_race: profile.goal_race, goal_time: profile.goal_time }}
        weeklyNotes={weeklyNotesMap}
      />
    </div>
  )
}
