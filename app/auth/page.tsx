'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function AuthPage() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { company_name: company, phone }
        }
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('carriers').insert({
          id: data.user.id,
          company_name: company,
          email,
          phone,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        setSuccess('Account created! Redirecting to your dashboard...')
        setTimeout(() => router.push('/dashboard'), 1500)
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError('Invalid email or password.'); setLoading(false); return }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DR</span>
            </div>
            <span className="font-semibold text-slate-900">DotReady</span>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">
            {mode === 'signup' ? 'Start your free trial' : 'Welcome back'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'signup' ? '14 days free. No credit card required.' : 'Sign in to your dashboard.'}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company name</label>
                  <input className="input" type="text" placeholder="Smith Trucking LLC" value={company} onChange={e => setCompany(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone number</label>
                  <input className="input" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-60">
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
            {mode === 'signup' ? (
              <>Already have an account? <button onClick={() => setMode('login')} className="text-brand-600 font-medium">Sign in</button></>
            ) : (
              <>Don't have an account? <button onClick={() => setMode('signup')} className="text-brand-600 font-medium">Start free trial</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
