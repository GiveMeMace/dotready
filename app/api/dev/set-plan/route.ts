import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'

// Admin-only dev endpoint to switch the current carrier's plan for testing.
// Writes are performed with the service role client so they bypass RLS /
// column grants — regular users cannot change their own billing columns.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
