'use client'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function AuthForm() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/dashboard')
    }
    checkSession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://cdlwatch.co/auth/reset'
      })
      if (error) { setError(error.message); setLoading(false); return }
      setSuccess('Check your email for a password reset link!')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { company_name: company, phone },
          emailRedirectTo: 'https://cdlwatch.co/auth/confirm'
        }
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (data.user) {
        setSuccess('Check your email to confirm your account!')
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError('Invalid email or password.'); setLoading(false); return }
      if (!rememberMe) {
        sessionStorage.setItem('cdlwatch_session_only', 'true')
      } else {
        sessionStorage.removeItem('cdlwatch_session_only')
      }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          {mode === 'signup' ? 'Start your free trial' : mode === 'forgot' ? 'Reset your password' : 'Welcome back'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {mode === 'signup' ? '14 days free. No credit card required.' : mode === 'forgot' ? "Enter your email and we'll send a reset link." : 'Sign in to your dashboard.'}
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
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess('') }} className="text-xs text-brand-600 hover:text-brand-700">
                    Forgot password?
                  </button>
                )}
              </div>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-60">
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
          {mode === 'forgot' ? (
            <>Remember your password? <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-brand-600 font-medium">Sign in</button></>
          ) : mode === 'signup' ? (
            <>Already have an account? <button onClick={() => setMode('login')} className="text-brand-600 font-medium">Sign in</button></>
          ) : (
            <>Don't have an account? <button onClick={() => setMode('signup')} className="text-brand-600 font-medium">Start free trial</button></>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  )
}
