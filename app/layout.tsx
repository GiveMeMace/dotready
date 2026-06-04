import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'CDLWatch — DOT Compliance Alerts for Trucking Companies',
  description: 'Never miss a CDL, medical cert, or MVR renewal. Automated DOT compliance alerts for small fleets.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  )
}
