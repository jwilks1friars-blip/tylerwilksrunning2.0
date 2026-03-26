export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import RaceResultForm from './RaceResultForm'
import RaceResultsList from './RaceResultsList'

export default async function RacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: results } = await supabase
    .from('race_results')
    .select('*')
    .eq('user_id', user!.id)
    .order('race_date', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-3xl font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#f5f2ee' }}
        >
          Race Results
        </h2>
        <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
          {results?.length ?? 0} races logged
        </p>
      </div>

      {/* Log a new result */}
      <section className="mb-8">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
          Log a Race
        </p>
        <RaceResultForm />
      </section>

      {/* Past results */}
      {!!results?.length && (
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6560' }}>
            Past Races
          </p>
          <RaceResultsList results={results} />
        </section>
      )}

      {!results?.length && (
        <div className="p-8 text-center" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
          <p className="text-sm mb-1" style={{ color: '#e8e0d4' }}>No races logged yet</p>
          <p className="text-xs" style={{ color: '#6b6560' }}>
            Log your first race result above to track your progress over time.
          </p>
        </div>
      )}
    </div>
  )
}
