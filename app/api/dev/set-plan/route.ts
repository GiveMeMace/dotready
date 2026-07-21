import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase-server'

// Admin-only dev endpoint to switch the current carrier's plan for testing.
// Auth is via a Bearer access token in the Authorization header (the app
// stores its session client-side, so cookies are not available server-side).
// Writes use the service role client so they bypass RLS / column grants.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const anon = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authError } = await anon.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { plan } = await req.json()
  if (!['trial', 'starter', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const update: Record<string, unknown> =
    plan === 'trial'
      ? {
          stripe_status: 'trialing',
          stripe_plan: null,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        }
      : { stripe_status: 'active', stripe_plan: plan }

  const serviceSupabase = createServiceClient()
  const { error } = await serviceSupabase
    .from('carriers')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, plan })
}
