'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs uppercase tracking-widest transition-colors hover:text-[#f5f2ee]"
      style={{ color: '#6b6560' }}
    >
      Sign out
    </button>
  )
}
