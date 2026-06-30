import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { BetaFeedbackButton } from '@/components/BetaFeedbackButton'
import { Toaster } from 'react-hot-toast'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'THE ARK — ATLAS Genesis Matrix',
  description: 'Atlas Genesis Matrix OS v65 — Sovereign Intelligence Platform. Isaac Brandon Burdette, Sole Inventor.',
  keywords: ['ATLAS', 'real estate intelligence', 'West Virginia', 'AI platform', 'Atlas Genesis Matrix'],
  authors: [{ name: 'Isaac Brandon Burdette' }],
  robots: 'noindex', // Private beta — no indexing
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-atlas-dark text-atlas-text">
        <Providers>
          {children}
          <BetaFeedbackButton />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0f1525',
                color: '#e2e8f0',
                border: '1px solid rgba(99,179,237,0.2)',
                borderRadius: '8px',
              },
              success: { iconTheme: { primary: '#68d391', secondary: '#0f1525' } },
              error: { iconTheme: { primary: '#fc8181', secondary: '#0f1525' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
