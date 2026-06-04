'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

type Carrier = {
  company_name: string
  email: string
  phone: string
  trial_ends_at: string
  stripe_status: string
  created_at: string
}

export default function AccountPage() {
  const [carrier, setCarrier] = useState<Carrier | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    const { data } = await supabase.from('carriers').select('*').eq('id', session.user.id).single()
    if (data) {
      setCarrier(data)
      setCompanyName(data.company_name || '')
      setPhone(data.phone || '')
    }
    setLoading(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileError('')
    setProfileSuccess('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { error } = await supabase.from('carriers').update({
      company_name: companyName,
      phone,
    }).eq('id', session.user.id)
    if (error) { setProfileError(error.message); setSaving(false); return }
    setProfileSuccess('Profile updated successfully!')
    setSaving(false)
    loadData()
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPasswordError(error.message); setSaving(false); return }
    setPasswordSuccess('Password updated successfully!')
    setNewPassword('')
    setConfirmPassword('')
    setSaving(false)
  }

  async function deleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm.')
      return
    }
    setDeleting(true)
    const res = await fetch('/api/delete-account', { method: 'POST' })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/')
    } else {
      const data = await res.json()
      alert('Error deleting account: ' + data.error)
      setDeleting(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>

  const trialEnd = carrier?.trial_ends_at ? new Date(carrier.trial_ends_at) : null
  const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : null
  const onTrial = carrier?.stripe_status !== 'active' && trialDaysLeft !== null && trialDaysLeft >= 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CW</span>
            </div>
            <span className="font-semibold text-slate-900">CDLWatch</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">← Back to dashboard</Link>
            <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Account settings</h1>

        {/* Plan status */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Plan & billing</h2>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">Current plan</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {carrier?.stripe_status === 'active' ? 'Paid subscription' : onTrial ? `Free trial — ${trialDaysLeft} days remaining` : 'Trial expired'}
              </p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${carrier?.stripe_status === 'active' ? 'bg-green-50 text-green-700' : onTrial ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
              {carrier?.stripe_status === 'active' ? 'Active' : onTrial ? 'Trial' : 'Expired'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">Member since</p>
              <p className="text-xs text-slate-400 mt-0.5">{carrier?.created_at ? new Date(carrier.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</p>
            </div>
          </div>
          <div className="pt-4">
            <Link href="/#pricing" className="btn-primary text-sm px-5 py-2 inline-block">
              Upgrade plan
            </Link>
          </div>
        </div>

        {/* Company profile */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Company profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company name</label>
              <input className="input" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input className="input" type="email" value={carrier?.email || ''} disabled style={{opacity: 0.6, cursor: 'not-allowed'}} />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone number</label>
              <input className="input" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            {profileError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{profileError}</p>}
            {profileSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{profileSuccess}</p>}
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Change password</h2>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
              <input className="input" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
              <input className="input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
            </div>
            {passwordError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{passwordSuccess}</p>}
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="card border border-red-100">
          <h2 className="font-semibold text-red-600 mb-4">Danger zone</h2>

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">Sign out of all devices</p>
              <p className="text-xs text-slate-400 mt-0.5">You'll need to sign in again on all devices.</p>
            </div>
            <button onClick={signOut} className="text-sm border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
              Sign out
            </button>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Delete account</p>
                <p className="text-xs text-slate-400 mt-0.5">Permanently delete your account and all driver data. This cannot be undone.</p>
              </div>
              {!showDeleteConfirm && (
                <button onClick={() => setShowDeleteConfirm(true)} className="text-sm border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                  Delete account
                </button>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-red-700 font-medium">⚠️ This will permanently delete:</p>
                <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
                  <li>Your account and login credentials</li>
                  <li>All driver records and compliance data</li>
                  <li>Your free trial (cannot be restarted)</li>
                </ul>
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Type <span className="font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    className="input border-red-200 focus:ring-red-400"
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={deleteAccount}
                    disabled={deleting || deleteConfirmText !== 'DELETE'}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    {deleting ? 'Deleting...' : 'Permanently delete account'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                    className="text-sm btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
