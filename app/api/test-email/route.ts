import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function daysUntil(dateStr: string) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

function fmt(dateStr: string) {
  if (!dateStr) return 'Not set'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusLabel(days: number | null) {
  if (days === null) return { text: 'Not set', color: '#94a3b8', bg: '#f8fafc' }
  if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, color: '#dc2626', bg: '#fef2f2' }
  if (days <= 7) return { text: `Expires in ${days}d`, color: '#d97706', bg: '#fffbeb' }
  if (days <= 30) return { text: `Expires in ${days}d`, color: '#d97706', bg: '#fffbeb' }
  return { text: `OK (${days}d)`, color: '#16a34a', bg: '#f0fdf4' }
}

function worstStatus(driver: any) {
  const vals = [daysUntil(driver.cdl_expiry), daysUntil(driver.medical_expiry), daysUntil(driver.mvr_due)].filter(v => v !== null) as number[]
  if (!vals.length) return 'unknown'
  const min = Math.min(...vals)
  if (min < 0) return 'expired'
  if (min <= 30) return 'expiring'
  return 'compliant'
}

export async function POST(req: NextRequest) {
  const { carrierId } = await req.json()
  if (!carrierId) return NextResponse.json({ error: 'Missing carrierId' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: carrier } = await supabase.from('carriers').select('*').eq('id', carrierId).single()
  if (!carrier) return NextResponse.json({ error: 'Carrier not found' }, { status: 404 })

  const { data: drivers } = await supabase.from('drivers').select('*').eq('carrier_id', carrierId)
  if (!drivers || drivers.length === 0) return NextResponse.json({ error: 'No drivers found' }, { status: 404 })

  const sorted = [...drivers].sort((a, b) => {
    const order = { expired: 0, expiring: 1, compliant: 2, unknown: 3 }
    return order[worstStatus(a) as keyof typeof order] - order[worstStatus(b) as keyof typeof order]
  })

  const expired = sorted.filter(d => worstStatus(d) === 'expired').length
  const expiring = sorted.filter(d => worstStatus(d) === 'expiring').length
  const compliant = sorted.filter(d => worstStatus(d) === 'compliant').length

  const driverRows = sorted.map(driver => {
    const cdl = statusLabel(daysUntil(driver.cdl_expiry))
    const med = statusLabel(daysUntil(driver.medical_expiry))
    const mvr = statusLabel(daysUntil(driver.mvr_due))
    const ws = worstStatus(driver)
    const rowBg = ws === 'expired' ? '#fff5f5' : ws === 'expiring' ? '#fffbeb' : 'white'

    return `
      <tr style="background:${rowBg};">
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#0f172a;font-size:14px;">${driver.name}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
          <span style="background:${cdl.bg};color:${cdl.color};padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">${cdl.text}</span>
          <div style="color:#94a3b8;font-size:11px;margin-top:2px;">${fmt(driver.cdl_expiry)}</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
          <span style="background:${med.bg};color:${med.color};padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">${med.text}</span>
          <div style="color:#94a3b8;font-size:11px;margin-top:2px;">${fmt(driver.medical_expiry)}</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
          <span style="background:${mvr.bg};color:${mvr.color};padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">${mvr.text}</span>
          <div style="color:#94a3b8;font-size:11px;margin-top:2px;">${fmt(driver.mvr_due)}</div>
        </td>
      </tr>
    `
  }).join('')

  await resend.emails.send({
    from: 'CDLWatch Alerts <alerts@cdlwatch.co>',
    to: carrier.email,
    subject: `CDLWatch Compliance Summary — ${carrier.company_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:700px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="background:#0284c7;padding:24px 32px;">
            <span style="color:white;font-weight:700;font-size:18px;">CDLWatch</span>
            <p style="color:#bae6fd;margin:4px 0 0;font-size:13px;">Compliance Summary Report</p>
          </div>
          <div style="padding:24px 32px 0;">
            <p style="color:#475569;font-size:14px;margin:0 0 16px;">Hi ${carrier.company_name}, here's your current compliance status across all ${drivers.length} drivers.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:16px;background:#fef2f2;border-radius:8px;text-align:center;width:33%;">
                  <p style="margin:0;font-size:28px;font-weight:700;color:#dc2626;">${expired}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#dc2626;font-weight:600;">EXPIRED</p>
                </td>
                <td style="width:8px;"></td>
                <td style="padding:16px;background:#fffbeb;border-radius:8px;text-align:center;width:33%;">
                  <p style="margin:0;font-size:28px;font-weight:700;color:#d97706;">${expiring}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#d97706;font-weight:600;">EXPIRING SOON</p>
                </td>
                <td style="width:8px;"></td>
                <td style="padding:16px;background:#f0fdf4;border-radius:8px;text-align:center;width:33%;">
                  <p style="margin:0;font-size:28px;font-weight:700;color:#16a34a;">${compliant}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#16a34a;font-weight:600;">COMPLIANT</p>
                </td>
              </tr>
            </table>
          </div>
          <div style="padding:0 32px 24px;">
            <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 16px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">DRIVER</th>
                  <th style="padding:10px 16px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">CDL</th>
                  <th style="padding:10px 16px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">MEDICAL CERT</th>
                  <th style="padding:10px 16px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">MVR REVIEW</th>
                </tr>
              </thead>
              <tbody>
                ${driverRows}
              </tbody>
            </table>
          </div>
          <div style="padding:0 32px 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
               style="display:inline-block;background:#0284c7;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
              View dashboard →
            </a>
          </div>
          <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">CDLWatch · cdlwatch.co · Automated compliance tracking for small fleets.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })

  return NextResponse.json({ success: true })
}
