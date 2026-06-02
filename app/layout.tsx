import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DotReady — DOT Compliance Alerts for Trucking Companies',
  description: 'Never miss a CDL, medical cert, or MVR renewal. Automated DOT compliance alerts for small fleets.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
