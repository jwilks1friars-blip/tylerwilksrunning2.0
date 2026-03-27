import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { name, email } = await req.json()

  await resend.emails.send({
    from: 'onboarding@tylerwilksrunning.com',
    to: process.env.TYLER_EMAIL ?? 'jwilks1.friars@gmail.com',
    subject: `New signup: ${name}`,
    text: [
      `Someone just created an account on Tyler Wilks Running.`,
      ``,
      `Name:  ${name}`,
      `Email: ${email}`,
      ``,
      `They're now completing onboarding (goals + experience).`,
      `You'll get a second email when they finish.`,
      ``,
      `View in coach dashboard: https://tylerwilksrunning.vercel.app/coach`,
    ].join('\n'),
  })

  return NextResponse.json({ ok: true })
}
