'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleConfirm = async () => {
      const { error } = await supabase.auth.getSession()
      if (error) {
        setStatus('error')
      } else {
        setStatus('success')
        setTimeout(() => router.push('/auth'), 3000)
      }
    }
    handleConfirm()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="card">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏳</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Confirming your email...</h1>
              <p className="text-slate-500 text-sm">Just a moment.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Email confirmed!</h1>
              <p className="text-slate-500 text-sm mb-6">Welcome to CDLWatch. Redirecting you to sign in...</p>
              <Link href="/auth" className="btn-primary text-sm">
                Go to sign in
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
              <p className="text-slate-500 text-sm mb-6">This link may have expired. Try signing in or request a new confirmation email.</p>
              <Link href="/auth" className="btn-primary text-sm">
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
