'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

    

      {/* Hero */}
      <section className="pt-16 pb-20 px-6 text-center bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-wide">
            Built for owner-operators & small fleets
          </div>
          <h1 className="text-6xl font-semibold text-slate-900 leading-[1.1] mb-6 tracking-tight">
            Stop losing money to<br />
            <span className="text-brand-600">expired DOT credentials</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            CDLWatch tracks every driver's CDL, medical certificate, and MVR review date — and sends automatic alerts before anything expires.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth?mode=signup" className="btn-primary text-base px-8 py-3 shadow-lg shadow-brand-100">
              Start free 14-day trial →
            </Link>
            <p className="text-sm text-slate-400">No credit card required · 2 min setup</p>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-20 grid grid-cols-3 gap-8">
          {[
            { value: '$10,000+', label: 'Average cost of an out-of-service violation' },
            { value: '24 months', label: 'CSA violations stay on your safety record' },
            { value: '3 dates', label: 'Per driver to track — CDL, medical & MVR' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-semibold text-slate-900 mb-1">{s.value}</p>
              <p className="text-sm text-slate-400 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-500">Set up in minutes. Never think about it again.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📋', title: 'Add your drivers', desc: 'Enter each driver\'s CDL, medical cert, and MVR review dates. Takes about 2 minutes per driver.' },
              { step: '02', icon: '🔔', title: 'We watch the dates', desc: 'CDLWatch monitors every expiry date 24/7 and alerts you at 60, 30, and 7 days out.' },
              { step: '03', icon: '✅', title: 'Stay compliant', desc: 'Renew on time, avoid violations, keep your CSA score clean, and protect your revenue.' },
            ].map(s => (
              <div key={s.step} className="relative">
                <div className="text-xs font-bold text-brand-400 tracking-widest mb-4">{s.step}</div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">Everything you need</h2>
            <p className="text-slate-500">Built specifically for small carriers and owner-operators.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '🟢', title: 'Live compliance dashboard', desc: 'See every driver\'s status at a glance. Red means expired, amber means act now, green means you\'re good.' },
              { icon: '📧', title: 'Email & SMS alerts', desc: 'Automatic alerts sent to you at 60, 30, and 7 days before any credential expires. Never miss a date.' },
              { icon: '👥', title: 'Unlimited drivers', desc: 'Add as many drivers as you have. No per-seat pricing, no limits.' },
              { icon: '📤', title: 'Compliance reports', desc: 'Export a full compliance report anytime — perfect for broker packets and DOT audits.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-brand-200 hover:shadow-sm transition-all">
                <span className="text-2xl block mb-3">{f.icon}</span>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-slate-900 mb-3">Simple pricing</h2>
          <p className="text-slate-500 mb-12">Pick the plan that fits your fleet. Cancel anytime.</p>
          <div className="grid md:grid-cols-2 gap-6 text-left">

            {/* Starter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Starter</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-semibold text-slate-900">$39</span>
                <span className="text-slate-400 text-lg">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">Up to 10 drivers.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Up to 10 drivers',
                  'Email + SMS alerts',
                  'Live compliance dashboard',
                  'CDL, medical cert & MVR tracking',
                  'CSV compliance reports',
                  '14-day free trial',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="text-brand-600 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth?mode=signup&plan=starter" className="btn-secondary w-full text-center block text-sm py-3">
                Start free trial
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white border-2 border-brand-600 rounded-2xl p-8 shadow-xl shadow-brand-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-2">Pro</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-semibold text-slate-900">$79</span>
                <span className="text-slate-400 text-lg">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">Unlimited drivers.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited drivers',
                  'Email + SMS alerts',
                  'Live compliance dashboard',
                  'CDL, medical cert & MVR tracking',
                  'CSV compliance reports',
                  '14-day free trial',
                  'Priority support',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="text-brand-600 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth?mode=signup&plan=pro" className="btn-primary w-full text-center block text-sm py-3">
                Start free trial
              </Link>
            </div>

          </div>
          <p className="text-slate-400 text-sm mt-6">Both plans include a 14-day free trial. No credit card required to start.</p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">Ready to stop worrying about compliance?</h2>
          <p className="text-brand-100 mb-8">Join carriers who use CDLWatch to stay compliant automatically.</p>
          <Link href="/auth?mode=signup" className="inline-block bg-white text-brand-600 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors">
            Start your free trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">CW</span>
            </div>
            <span>CDLWatch</span>
          </div>
          <p>© {new Date().getFullYear()} CDLWatch. Built for American trucking.</p>
        </div>
      </footer>

    </div>
  )
}
