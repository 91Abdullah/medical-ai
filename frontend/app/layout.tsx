import './globals.css'
import { Inter } from 'next/font/google'
import { Navbar } from '../components/Navbar'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'Medical AI Diagnostics',
  description: 'AI-powered medical image analysis for AMD, Glaucoma, DR, and Biomarker prediction',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <div className="min-h-full bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
