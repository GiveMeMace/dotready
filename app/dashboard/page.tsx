'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { differenceInDays, parseISO } from 'date-fns'

type Driver = {
  id: string
  name: string
  email: string
  phone: string
  cdl_expiry: string
  medical_expiry: string
  mvr_due: string
  carrier_id: string
}

type Carrier = {
  company_name: string
  email: string
  trial_ends_at: string
  stripe_status: string
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null
  return differenceInDays(parseISO(dateStr), new Date())
}

function StatusBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-slate-400">Not set</span>
  if (days < 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Expired {Math.abs(days)}d ago</span>
  if (days <= 30) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">Expires in {days}d</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">OK ({days}d)</span>
}

function worstDays(driver: Driver) {
  const vals = [daysUntil(driver.cdl_expiry), daysUntil(driver.medical_expiry), daysUntil(driver.mvr_due)].filter(v => v !== null) as number[]
  return vals.length ? Math.min(...vals) : 999
}

export default function DashboardPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [carrier, setCarrier] = useState<Carrier | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', cdl_expiry: '', medical_expiry: '', mvr_due: '' })
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', cdl_expiry: '', medical_expiry: '', mvr_due: '' })
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [sortBy, setSortBy] = useState<'status' | 'alpha'>('status')
  const router = useRouter()
  const supabase = createClient()

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    const user = session.user

    let { data: carrierData } = await supabase.from('carriers').select('*').eq('id', user.id).single()
    if (!carrierData) {
      const { data: newCarrier } = await supabase.from('carriers').insert({
        id: user.id,
        company_name: user.user_metadata?.company_name || 'My Company',
        email: user.email,
        phone: user.user_metadata?.phone || '',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }).select().single()
      carrierData = newCarrier
    }

    setCarrier(carrierData)

    // Paywall check — redirect if trial expired and not subscribed
    if (carrierData) {
      const trialEnd = carrierData.trial_ends_at ? new Date(carrierData.trial_ends_at) : null
      const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : null
      const isActive = carrierData.stripe_status === 'active' || (trialDaysLeft !== null && trialDaysLeft >= 0)
      if (!isActive) {
        router.push('/upgrade')
        return
      }
    }

    const { data: driverData } = await supabase.from('drivers').select('*').eq('carrier_id', user.id)
    setDrivers(driverData || [])
    setLoading(false)
  }

  useEffect(() => {
    const sessionOnly = sessionStorage.getItem('cdlwatch_session_only')
    if (sessionOnly === 'true') {
      const handleClose = () => { supabase.auth.signOut() }
      window.addEventListener('beforeunload', handleClose)
      return () => window.removeEventListener('beforeunload', handleClose)
    }
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  async function addDriver(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const isOnTrial = carrier?.stripe_status !== 'active'
    if (isOnTrial && drivers.length >= 10) {
      alert('You have reached the 10 driver limit on the free trial. Please upgrade to add more drivers.')
      setSaving(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const { data, error } = await supabase
      .from('drivers')
      .insert({ ...form, carrier_id: session.user.id })
      .select()

    if (error) {
      console.error('Error adding driver:', error.message)
      setSaving(false)
      return
    }
    setForm({ name: '', email: '', phone: '', cdl_expiry: '', medical_expiry: '', mvr_due: '' })
    setShowAdd(false)
    setSaving(false)
    loadData()
  }

  function openEdit(driver: Driver) {
    setEditingDriver(driver)
    setEditForm({
      name: driver.name || '',
      email: driver.email || '',
      phone: driver.phone || '',
      cdl_expiry: driver.cdl_expiry || '',
      medical_expiry: driver.medical_expiry || '',
      mvr_due: driver.mvr_due || '',
    })
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDriver) return
    setSaving(true)
    const { error } = await supabase
      .from('drivers')
      .update(editForm)
      .eq('id', editingDriver.id)
    if (error) {
      console.error('Error updating driver:', error.message)
      setSaving(false)
      return
    }
    setEditingDriver(null)
    setSaving(false)
    loadData()
  }

  async function deleteDriver(id: string) {
    if (!confirm('Remove this driver?')) return
    await supabase.from('drivers').delete().eq('id', id)
    loadData()
  }

  async function sendTestEmail() {
    setSendingTest(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrierId: session.user.id })
    })
    if (res.ok) {
      alert('Summary email sent! Check your inbox.')
    } else {
      alert('Failed to send email. Please try again.')
    }
    setSendingTest(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const expired = drivers.filter(d => worstDays(d) < 0).length
  const expiringSoon = drivers.filter(d => { const w = worstDays(d); return w >= 0 && w <= 30 }).length
  const compliant = drivers.filter(d => worstDays(d) > 30).length
  const trialDaysLeft = carrier ? daysUntil(carrier.trial_ends_at) : null
  const onTrial = carrier?.stripe_status !== 'active' && trialDaysLeft !== null && trialDaysLeft >= 0

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Add Driver Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-900 text-lg">Add new driver</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={addDriver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Full name *</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">CDL expiry</label>
                  <input className="input" type="date" value={form.cdl_expiry} onChange={e => setForm({...form, cdl_expiry: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Medical cert expiry</label>
                  <input className="input" type="date" value={form.medical_expiry} onChange={e => setForm({...form, medical_expiry: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">MVR review due</label>
                  <input className="input" type="date" value={form.mvr_due} onChange={e => setForm({...form, mvr_due: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary text-sm flex-1">
                  {saving ? 'Saving...' : 'Add driver'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-900 text-lg">Edit driver</h2>
              <button onClick={() => setEditingDriver(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Full name *</label>
                  <input className="input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Email</label>
                  <input className="input" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Phone</label>
                  <input className="input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">CDL expiry</label>
                  <input className="input" type="date" value={editForm.cdl_expiry} onChange={e => setEditForm({...editForm, cdl_expiry: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Medical cert expiry</label>
                  <input className="input" type="date" value={editForm.medical_expiry} onChange={e => setEditForm({...editForm, medical_expiry: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">MVR review due</label>
                  <input className="input" type="date" value={editForm.mvr_due} onChange={e => setEditForm({...editForm, mvr_due: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary text-sm flex-1">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button type="button" onClick={() => setEditingDriver(null)} className="btn-secondary text-sm flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CW</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{carrier?.company_name}</p>
              <p className="text-xs text-slate-400">{carrier?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onTrial && (
              <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-medium">
                Trial: {trialDaysLeft}d left
              </span>
            )}
            <button onClick={sendTestEmail} disabled={sendingTest} className="text-sm bg-brand-50 text-brand-600 hover:bg-brand-100 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60">
              {sendingTest ? 'Sending...' : '📧 Email summary'}
            </button>
            <Link href="/account" className="text-sm text-slate-500 hover:text-slate-700">Account</Link>
            <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total drivers', value: drivers.length, color: 'text-slate-900' },
            { label: 'Expired', value: expired, color: 'text-red-600' },
            { label: 'Expiring soon', value: expiringSoon, color: 'text-amber-600' },
            { label: 'Compliant', value: compliant, color: 'text-green-600' },
          ].map(m => (
            <div key={m.label} className="bg-white border border-slate-100 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">{m.label}</p>
              <p className={`text-2xl font-semibold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Trial warning */}
        {carrier?.stripe_status !== 'active' && drivers.length >= 8 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
            <p className="text-sm text-amber-700 font-medium">
              {drivers.length >= 10 ? '🚫 Driver limit reached — upgrade to add more.' : `⚠️ You're using ${drivers.length}/10 drivers on your trial.`}
            </p>
            <Link href="/account" className="text-xs font-semibold text-amber-700 underline">Upgrade →</Link>
          </div>
        )}

        {/* Driver list header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Driver roster</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Sort by</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'status' | 'alpha')}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="status">Status</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2">+ Add driver</button>
          </div>
        </div>

        {/* Drivers table */}
        {drivers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-400 mb-4">No drivers yet. Add your first driver to get started.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">Add your first driver</button>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Driver</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">CDL expiry</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Medical cert</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">MVR review</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...drivers].sort((a, b) => {
                    if (sortBy === 'alpha') return a.name.localeCompare(b.name)
                    const aWorst = worstDays(a)
                    const bWorst = worstDays(b)
                    if (aWorst === 999 && bWorst === 999) return 0
                    if (aWorst === 999) return 1
                    if (bWorst === 999) return -1
                    return aWorst - bWorst
                  }).map(driver => {
                    const worst = worstDays(driver)
                    const rowColor = worst < 0 ? 'bg-red-50/30' : worst <= 30 ? 'bg-amber-50/30' : ''
                    return (
                      <tr key={driver.id} className={rowColor}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{driver.name}</p>
                          <p className="text-xs text-slate-400">{driver.phone || driver.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge days={daysUntil(driver.cdl_expiry)} /></td>
                        <td className="px-4 py-3"><StatusBadge days={daysUntil(driver.medical_expiry)} /></td>
                        <td className="px-4 py-3"><StatusBadge days={daysUntil(driver.mvr_due)} /></td>
                        <td className="px-4 py-3">
                          {worst < 0 ? <span className="text-xs font-medium text-red-600">Action needed</span>
                          : worst <= 30 ? <span className="text-xs font-medium text-amber-600">Expiring soon</span>
                          : <span className="text-xs font-medium text-green-600">Compliant</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => openEdit(driver)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit</button>
                            <button onClick={() => deleteDriver(driver.id)} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
