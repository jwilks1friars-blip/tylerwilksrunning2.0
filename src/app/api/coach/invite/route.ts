import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id !== process.env.COACH_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fullName, email, goalRace, goalTime, experience, weeklyMiles } = await request.json()

  if (!fullName || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create user immediately with email confirmed — no link click required
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  // Upsert profile with all coach-provided data
  const { error: profileError } = await admin.from('profiles').upsert({
    id: userData.user.id,
    email,
    full_name: fullName,
    goal_race: goalRace || null,
    goal_time: goalTime || null,
    experience: experience || null,
    weekly_miles: weeklyMiles ? parseInt(weeklyMiles) : 0,
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Generate a password-setup link so they can log in when ready
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${process.env.APP_URL}/dashboard` },
  })

  const loginUrl = linkData?.properties?.action_link ?? `${process.env.APP_URL}/login`

  // Send welcome email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Tyler Wilks Running <onboarding@resend.dev>',
    to: email,
    subject: "You've been added to Tyler Wilks Running",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="background:#0a0908;color:#f5f2ee;font-family:sans-serif;margin:0;padding:40px 20px;">
          <div style="max-width:480px;margin:0 auto;">
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b6560;margin-bottom:32px;">
              Tyler Wilks Running
            </p>

            <h1 style="font-size:28px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;color:#f5f2ee;">
              Hey ${fullName.split(' ')[0]},
            </h1>

            <p style="font-size:14px;line-height:1.7;color:#6b6560;margin-bottom:16px;">
              Tyler has set up your training account on Tyler Wilks Running. Click below to set your password and access your dashboard — your training plan, runs, and coaching notes are all ready.
            </p>

            ${goalRace ? `<p style="font-size:14px;line-height:1.7;color:#6b6560;margin-bottom:24px;">Goal race: <span style="color:#f5f2ee;">${goalRace}</span>${goalTime ? ` &mdash; ${goalTime}` : ''}</p>` : ''}

            <a href="${loginUrl}" style="display:inline-block;background:#e8e0d4;color:#0a0908;text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:500;padding:14px 28px;margin-bottom:32px;">
              Set Password & Access Dashboard
            </a>

            <p style="font-size:12px;color:#2a2521;margin-bottom:8px;">
              This link expires in 24 hours. If it expires, use the forgot password link at the login page.
            </p>

            <div style="border-top:1px solid #1e1b18;padding-top:24px;margin-top:32px;">
              <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#2a2521;">
                Tyler Wilks Running &mdash; Online Running Coach
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  })

  return NextResponse.json({ success: true })
}
