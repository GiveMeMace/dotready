'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function UpgradePage() {
  const [loading, setLoading] = useState<'starter' | 'pro' | null>(null)
  const [carrier, setCarrier] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      const { data } = await supabase.from('carriers').select('*').eq('id', session.user.id).single()
      setCarrier(data)
    }
    load()
  }, [])

 async function subscribe(plan: 'starter' | 'pro') {
    setLoading(plan)
    const priceId = plan === 'starter'
      ? 'price_1TeiR41Y8Endw8fkf6ZgqMhs'
      : 'price_1TeiSE1Y8Endw8fkS3IQn9VU'

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ priceId })
    })

    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Error: ' + (data.error || 'Something went wrong. Please try again.'))
      setLoading(null)
    }
  }

  const trialEnd = carrier?.trial_ends_at ? new Date(carrier.trial_ends_at) : null
  const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : null
  const trialExpired = trialDaysLeft !== null && trialDaysLeft < 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CW</span>
            </div>
            <span className="font-semibold text-slate-900">CDLWatch</span>
          </Link>
          {!trialExpired && (
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">← Back to dashboard</Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {trialExpired && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mb-10 text-center">
            <p className="text-red-700 font-semibold text-lg mb-1">Your free trial has ended</p>
            <p className="text-red-600 text-sm">Subscribe to a plan below to continue using CDLWatch and keep your drivers compliant.</p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-slate-900 mb-3">Choose your plan</h1>
          <p className="text-slate-500">Both plans include everything you need to stay compliant. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Starter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Starter</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-semibold text-slate-900">$39</span>
              <span className="text-slate-400 text-lg">/month</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">Up to 10 drivers.</p>
            <ul className="space-y-3 mb-8">
              {[
                'Up to 10 drivers',
                'Email + SMS alerts',
                'Live compliance dashboard',
                'CDL, medical cert & MVR tracking',
                'CSV compliance reports',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="text-brand-600 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe('starter')}
              disabled={loading !== null}
              className="btn-secondary w-full text-center py-3 disabled:opacity-60"
            >
              {loading === 'starter' ? 'Redirecting to checkout...' : 'Subscribe — $39/month'}
            </button>
          </div>

          {/* Pro */}
          <div className="bg-white border-2 border-brand-600 rounded-2xl p-8 shadow-xl shadow-brand-50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-2">Pro</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-semibold text-slate-900">$79</span>
              <span className="text-slate-400 text-lg">/month</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">Unlimited drivers.</p>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited drivers',
                'Email + SMS alerts',
                'Live compliance dashboard',
                'CDL, medical cert & MVR tracking',
                'CSV compliance reports',
                'Priority support',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="text-brand-600 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe('pro')}
              disabled={loading !== null}
              className="btn-primary w-full text-center py-3 disabled:opacity-60"
            >
              {loading === 'pro' ? 'Redirecting to checkout...' : 'Subscribe — $79/month'}
            </button>
          </div>

        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          Secure payment powered by Stripe. Cancel anytime from your account settings.
        </p>
      </main>
    </div>
  )
}
