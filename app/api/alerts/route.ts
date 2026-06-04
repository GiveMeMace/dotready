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
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()

  // Fetch drivers and carriers separately
  const { data: drivers, error: driversError } = await supabase.from('drivers').select('*')
  const { data: carriers, error: carriersError } = await supabase.from('carriers').select('*')

  if (driversError || carriersError) {
    return NextResponse.json({
      sent: 0,
      checked: 0,
      debug: {
        driversError: driversError?.message,
        carriersError: carriersError?.message,
      }
    })
  }

  if (!drivers || drivers.length === 0) {
    return NextResponse.json({ sent: 0, checked: 0, debug: 'no drivers in database' })
  }

  if (!carriers || carriers.length === 0) {
    return NextResponse.json({ sent: 0, checked: 0, debug: 'no carriers in database' })
  }

  let sent = 0
  const today = new Date()
  const debugLog: any[] = []
  const ALERT_DAYS = [60, 30, 7]

  for (const driver of drivers) {
    const carrier = carriers.find(c => c.id === driver.carrier_id)
    if (!carrier?.email) continue

    const trialEnd = carrier.trial_ends_at ? new Date(carrier.trial_ends_at) : null
    const trialDaysLeft = trialEnd ? Math.round((trialEnd.getTime() - today.getTime()) / 86400000) : null
    const isActive = carrier.stripe_status === 'active' || (trialDaysLeft !== null && trialDaysLeft >= 0)

    debugLog.push({
      driver: driver.name,
      carrier_email: carrier.email,
      isActive,
      trialDaysLeft,
      cdl_days: daysUntil(driver.cdl_expiry),
      medical_days: daysUntil(driver.medical_expiry),
      mvr_days: daysUntil(driver.mvr_due),
    })

    if (!isActive) continue

    const checks = [
      { label: 'CDL', date: driver.cdl_expiry },
      { label: 'Medical certificate', date: driver.medical_expiry },
      { label: 'MVR review', date: driver.mvr_due },
    ]

    for (const check of checks) {
      if (!check.date) continue
      const days = daysUntil(check.date)
      if (days === null) continue
      if (!ALERT_DAYS.includes(days) && days >= 0) continue
      if (days > 60) continue

      const isExpired = days < 0
      const subject = isExpired
        ? `URGENT: ${driver.name}'s ${check.label} has EXPIRED`
        : `Alert: ${driver.name}'s ${check.label} expires in ${days} day${days === 1 ? '' : 's'}`

      const color = isExpired ? '#dc2626' : days <= 7 ? '#d97706' : '#0284c7'
      const bgColor = isExpired ? '#fef2f2' : days <= 7 ? '#fffbeb' : '#f0f9ff'
      const statusText = isExpired
        ? `EXPIRED ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
        : `Expires in ${days} day${days === 1 ? '' : 's'} (${fmt(check.date)})`

      await resend.emails.send({
        from: 'DotReady Alerts <alerts@dotready.co>',
        to: carrier.email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <div style="max-width:600px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <div style="background:#0284c7;padding:24px 32px;">
                <span style="color:white;font-weight:600;font-size:16px;">DotReady</span>
              </div>
              <div style="padding:32px;">
                <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">
                  ${isExpired ? '🚨 Compliance Alert' : days <= 7 ? '⚠️ Urgent Alert' : '🔔 Compliance Reminder'}
                </h1>
                <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${carrier.company_name},</p>
                <div style="background:${bgColor};border-left:4px solid ${color};border-radius:8px;padding:20px;margin-bottom:24px;">
                  <p style="margin:0 0 4px;font-weight:600;color:#0f172a;font-size:16px;">${driver.name}</p>
                  <p style="margin:0 0 8px;color:#475569;font-size:14px;">${check.label}</p>
                  <p style="margin:0;font-weight:600;color:${color};font-size:14px;">${statusText}</p>
                </div>
                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                  ${isExpired
                    ? 'This credential has expired. Your driver may be placed out of service. Please renew immediately.'
                    : days <= 7
                    ? 'This credential expires very soon. Please take action immediately.'
                    : 'This is an advance notice to help you stay ahead of compliance deadlines.'}
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="display:inline-block;background:#0284c7;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
                  View dashboard →
                </a>
              </div>
              <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">DotReady · dotready.co</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
      sent++
    }
  }

  return NextResponse.json({ sent, checked: drivers.length, debug: debugLog })
}
