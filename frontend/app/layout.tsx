import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import '@radix-ui/themes/styles.css'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Paperboat - AI Video Storyboarding',
  description: 'Direct your video frame by frame with AI-powered storyboarding',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Theme appearance="dark" accentColor="purple">
          <AuthProvider>
            <Toaster position="bottom-center" richColors />
            {children}
          </AuthProvider>
        </Theme>
      </body>
    </html>
  )
}
