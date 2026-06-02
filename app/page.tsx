'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DR</span>
            </div>
            <span className="font-semibold text-slate-900">DotReady</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-sm text-slate-600 hover:text-slate-900">Sign in</Link>
            <Link href="/auth?mode=signup" className="btn-primary text-sm">Start free trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
          Built for small fleets & owner-operators
        </div>
        <h1 className="text-5xl font-semibold text-slate-900 leading-tight mb-6">
          Never get caught with<br />expired DOT credentials
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          DotReady automatically tracks your drivers' CDL expiry, medical certificates, and MVR review dates — and sends you alerts before they lapse.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth?mode=signup" className="btn-primary text-base px-8 py-3">
            Start your 14-day free trial
          </Link>
          <span className="text-sm text-slate-400">No credit card required</span>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-center text-slate-900 mb-12">
            One expired credential can shut down your whole operation
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'FMCSA out-of-service orders', desc: 'An expired medical cert means your driver is parked — and so is your revenue.' },
              { title: 'CSA score damage', desc: 'Compliance violations stay on your record for 24 months and affect your insurance rates.' },
              { title: 'Spreadsheet chaos', desc: 'Tracking 10+ drivers across 3 different expiry dates in Excel is a lawsuit waiting to happen.' },
            ].map((item) => (
              <div key={item.title} className="card">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-red-500 text-lg">⚠</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-center text-slate-900 mb-12">
            Everything you need, nothing you don't
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '📋', title: 'Driver roster', desc: 'Add all your drivers in minutes. Track CDL, medical cert, and MVR dates in one place.' },
              { icon: '🔔', title: 'Automatic alerts', desc: 'Get email and SMS alerts 60, 30, and 7 days before any credential expires.' },
              { icon: '🟢', title: 'Live compliance dashboard', desc: 'See every driver\'s status at a glance. Red, amber, green — know instantly who needs action.' },
              { icon: '📤', title: 'CSV export', desc: 'Export your full compliance report anytime for audits, brokers, or your records.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-16" id="pricing">
        <div className="max-w-md mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Simple pricing</h2>
          <p className="text-slate-500 mb-10">One plan. Everything included.</p>
          <div className="card text-left">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-semibold text-slate-900">$49</span>
              <span className="text-slate-400">/month</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">Per carrier. Unlimited drivers.</p>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited drivers',
                'Email + SMS alerts',
                'Live compliance dashboard',
                'CSV export',
                'CDL, medical cert & MVR tracking',
                '14-day free trial',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="text-brand-600 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth?mode=signup" className="btn-primary w-full text-center block">
              Start free trial — no card needed
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} DotReady. Built for American trucking.</p>
      </footer>

    </div>
  )
}
