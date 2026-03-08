import Link from 'next/link'
import Image from 'next/image'

const STATS = [
  { value: '10+', label: 'Years running competitively' },
  { value: '20+', label: 'Marathons & ultras completed' },
  { value: 'BQ', label: 'Boston Qualifier' },
  { value: '100mi', label: 'Longest race finished' },
]

const VALUES = [
  {
    title: 'Data over intuition',
    description: 'Every coaching decision is grounded in what your Strava data actually shows — not what I think you should be doing based on a generic template.',
  },
  {
    title: 'Consistency beats heroics',
    description: 'The best training week is the one you can repeat. I build plans around your real life, not your ideal one.',
  },
  {
    title: 'Communication is part of coaching',
    description: 'A note every Monday. Real analysis of your real runs. No silence, no templates, no guessing what\'s going on.',
  },
  {
    title: 'The long game',
    description: 'Anyone can push you hard for 8 weeks. I\'m interested in building runners who are still racing at their best in 5, 10, 20 years.',
  },
]

export default function AboutPage() {
  return (
    <div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest mb-6" style={{ color: '#6b6560' }}>
              About
            </p>
            <h1
              className="text-6xl md:text-8xl font-semibold uppercase tracking-tight leading-none mb-8"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
            >
              Hi, I'm Tyler.
            </h1>
            <p className="text-lg leading-8" style={{ color: '#6b6560' }}>
              I'm a runner and coach based in the US. I've spent the last decade learning what it actually takes to get faster — and building the tools to share that with other athletes.
            </p>
          </div>
          <div className="relative aspect-square hidden md:block">
            <Image
              src="/image_67227137.JPG"
              alt="Tyler Wilks"
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </div>
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ border: '1px solid #1e1b18' }}>
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="p-8"
              style={{
                backgroundColor: '#0a0908',
                borderRight: i < 3 ? '1px solid #1e1b18' : 'none',
              }}
            >
              <p
                className="text-4xl font-semibold uppercase mb-2"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#6b6560' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* Story */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <div className="relative aspect-video mb-8">
              <Image
                src="/477095054.jpg"
                alt="Tyler Wilks racing"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs uppercase tracking-widest mb-6" style={{ color: '#6b6560' }}>
              My story
            </p>
            <div className="space-y-5 text-sm leading-8" style={{ color: '#6b6560' }}>
              <p>
                I started running after college. Too fast on easy days, not hard enough on hard days, no structure, no recovery. 
              </p>
              <p>
                Over the next few years I became obsessed with the data side of training. Heart rate, pace zones, mileage progression, periodization. I read everything. I tested everything on myself first.
              </p>
              <p>
                Eventually I qualified for Boston, finished my first Ultra, and started helping friends train for their goal races. The feedback was consistent: the weekly coaching notes were the most valuable part. Not just the plan — the analysis, the adjustments, the human context.
              </p>
              <p>
                So I built a platform around that. One where your Strava data feeds directly into your coaching, where your plan adapts as you go, and where you hear from me every single week — not just when you ask.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest mb-6" style={{ color: '#6b6560' }}>
              Coaching philosophy
            </p>
            <div className="space-y-8">
              {VALUES.map(value => (
                <div key={value.title}>
                  <h3
                    className="text-lg font-semibold uppercase tracking-widest mb-2"
                    style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
                  >
                    {value.title}
                  </h3>
                  <p className="text-sm leading-7" style={{ color: '#6b6560' }}>
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* What I coach */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-xs uppercase tracking-widest mb-16" style={{ color: '#6b6560' }}>
          What I coach
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              category: 'Road Racing',
              distances: ['5K', '10K', 'Half Marathon', 'Marathon'],
              description: 'From first-timers to Boston qualifiers. Road racing is where most of my athletes start.',
            },
            {
              category: 'Trail & Ultra',
              distances: ['25K', '50K', '50 Mile', '100 Mile'],
              description: 'Technical trail races and multi-day ultras. I\'ve toed the line at most distances — I know what the training actually demands.',
            },
            {
              category: 'Masters Athletes',
              distances: ['All distances'],
              description: 'Running in your 40s, 50s, 60s is different. Recovery, load management, and strength work become more critical — my plans reflect that.',
            },
          ].map(item => (
            <div
              key={item.category}
              className="p-6"
              style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}
            >
              <p
                className="text-xl font-semibold uppercase tracking-widest mb-3"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
              >
                {item.category}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {item.distances.map(d => (
                  <span
                    key={d}
                    className="text-xs uppercase tracking-widest px-2 py-1"
                    style={{ backgroundColor: '#1e1b18', color: '#6b6560' }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-7" style={{ color: '#6b6560' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid #1e1b18' }} />

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2
          className="text-5xl md:text-7xl font-semibold uppercase tracking-tight mb-6"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Let's work together.
        </h2>
        <p className="text-sm mb-10 max-w-sm mx-auto leading-7" style={{ color: '#6b6560' }}>
          Pick a plan and start training this week.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/coaching"
            className="px-6 py-3 text-xs uppercase tracking-widest font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#e8e0d4', color: '#0a0908', borderRadius: '2px' }}
          >
            View Plans
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-80"
            style={{ border: '1px solid #2a2521', color: '#e8e0d4', borderRadius: '2px' }}
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid #1e1b18' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="text-sm uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#6b6560' }}
          >
            Tyler Wilks Running
          </span>
          <div className="flex gap-6">
            {[
              { href: '/coaching', label: 'Coaching' },
              { href: '/about', label: 'About' },
              { href: '/blog', label: 'Blog' },
              { href: '/login', label: 'Sign in' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
                style={{ color: '#6b6560' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#2a2521' }}>
            © {new Date().getFullYear()} Tyler Wilks Running
          </p>
        </div>
      </footer>

    </div>
  )
}
