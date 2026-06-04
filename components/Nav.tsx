'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function Nav() {
  const [session, setSession] = useState<any>(null)
  const [carrier, setCarrier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session) {
        const { data } = await supabase.from('carriers').select('*').eq('id', session.user.id).single()
        setCarrier(data)
      }
      setLoading(false)
    }
    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setCarrier(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const trialEnd = carrier?.trial_ends_at ? new Date(carrier.trial_ends_at) : null
  const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : null
  const onTrial = carrier?.stripe_status !== 'active' && trialDaysLeft !== null && trialDaysLeft >= 0
  const trialExpired = carrier?.stripe_status !== 'active' && trialDaysLeft !== null && trialDaysLeft < 0

  const isHome = pathname === '/'
  const isDashboard = pathname === '/dashboard'
  const isAccount = pathname === '/account'
  const isUpgrade = pathname === '/upgrade'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">CW</span>
          </div>
          <span className="font-semibold text-slate-900">CDLWatch</span>
        </Link>

        {/* Center tabs — only show when logged in */}
        {session && !loading && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <Link
              href="/"
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isHome
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isDashboard
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Dashboard
            </Link>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {loading ? null : session ? (
            <>
              {/* Trial badge */}
              {onTrial && (
                <span className="hidden sm:inline text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                  Trial: {trialDaysLeft}d left
                </span>
              )}

              {/* Upgrade button */}
              {(onTrial || trialExpired) && !isUpgrade && (
                <Link
                  href="/upgrade"
                  className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Upgrade
                </Link>
              )}

              {/* Account */}
              <Link
                href="/account"
                className={`text-sm transition-colors ${
                  isAccount ? 'text-brand-600 font-medium' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Account
              </Link>

              {/* Sign out */}
              <button
                onClick={signOut}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                Sign in
              </Link>
              <Link href="/auth?mode=signup" className="btn-primary text-sm px-4 py-2">
                Start free →
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
