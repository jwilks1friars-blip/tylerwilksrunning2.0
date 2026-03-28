import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { postToSlack } from '@/lib/slack'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { name, email, goalRace, goalTime, experience, weeklyMiles } = await req.json()

  await resend.emails.send({
    from: 'onboarding@tylerwilksrunning.com',
    to: 'jwilks1.friars@gmail.com',
    subject: `Setup complete: ${name}`,
    text: [
      `An athlete just finished onboarding on Tyler Wilks Running.`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      `Goal Race: ${goalRace}`,
      `Goal Time: ${goalTime || '—'}`,
      `Experience: ${experience}`,
      `Weekly Miles: ${weeklyMiles || '0'} mi/wk`,
      ``,
      `View athlete: https://tylerwilksrunning.vercel.app/coach`,
    ].join('\n'),
  })

  if (process.env.SLACK_WEBHOOK_ATHLETES) {
    await postToSlack(
      process.env.SLACK_WEBHOOK_ATHLETES,
      [
        `*New athlete signed up* :runner:`,
        `*Name:* ${name}  |  *Email:* ${email}`,
        `*Goal:* ${goalRace}${goalTime ? ` in ${goalTime}` : ''}`,
        `*Experience:* ${experience}  |  *Weekly miles:* ${weeklyMiles || '0'} mi/wk`,
        `<https://tylerwilksrunning.vercel.app/coach|View in coach dashboard>`,
      ].join('\n')
    )
  }

  return NextResponse.json({ ok: true })
}
