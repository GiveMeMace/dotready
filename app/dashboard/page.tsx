'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const [form, setForm] = useState({ name: '', email: '', phone: '', cdl_expiry: '', medical_expiry: '', mvr_due: '' })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

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
    const { data: driverData } = await supabase.from('drivers').select('*').eq('carrier_id', user.id).order('name')
    setDrivers(driverData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function addDriver(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('drivers').insert({ ...form, carrier_id: user.id })
    setForm({ name: '', email: '', phone: '', cdl_expiry: '', medical_expiry: '', mvr_due: '' })
    setShowAdd(false)
    setSaving(false)
    loadData()
  }

  async function deleteDriver(id: string) {
    if (!confirm('Remove this driver?')) return
    await supabase.from('drivers').delete().eq('id', id)
    loadData()
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
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DR</span>
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
            <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
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

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Driver roster</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm px-4 py-2">+ Add driver</button>
        </div>

        {showAdd && (
          <div className="card mb-6">
            <h3 className="font-medium text-slate-900 mb-4">New driver</h3>
            <form onSubmit={addDriver} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs text-slate-500 mb-1">Full name *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className="block text-xs text-slate-500 mb-1">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><label className="block text-xs text-slate-500 mb-1">Phone</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div><label className="block text-xs text-slate-500 mb-1">CDL expiry</label><input className="input" type="date" value={form.cdl_expiry} onChange={e => setForm({...form, cdl_expiry: e.target.value})} /></div>
              <div><label className="block text-xs text-slate-500 mb-1">Medical cert expiry</label><input className="input" type="date" value={form.medical_expiry} onChange={e => setForm({...form, medical_expiry: e.target.value})} /></div>
              <div><label className="block text-xs text-slate-500 mb-1">MVR review due</label><input className="input" type="date" value={form.mvr_due} onChange={e => setForm({...form, mvr_due: e.target.value})} /></div>
              <div className="col-span-2 md:col-span-3 flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Add driver'}</button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        )}

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
                  {drivers.map(driver => {
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
                          <button onClick={() => deleteDriver(driver.id)} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
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
