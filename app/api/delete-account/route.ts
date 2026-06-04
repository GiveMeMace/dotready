import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: carrier } = await serviceSupabase
    .from('carriers')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!carrier) return NextResponse.json({ error: 'Carrier not found' }, { status: 404 })

  // Add email to used_trials permanently
  await serviceSupabase
    .from('used_trials')
    .upsert({ email: carrier.email }, { onConflict: 'email' })

  // Delete all drivers
  await serviceSupabase
    .from('drivers')
    .delete()
    .eq('carrier_id', user.id)

  // Delete carrier record
  await serviceSupabase
    .from('carriers')
    .delete()
    .eq('id', user.id)

  // Delete auth user
  const { error } = await serviceSupabase.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
