import './globals.css'
import React, { Suspense } from 'react'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'BookIt',
  description: 'Experiences & Slots — demo booking app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="min-h-screen flex flex-col bg-background text-foreground">

            {/* Global Navbar */}
            <Navbar />

            {/* Main content */}
            <main className="flex-1 max-w-[1280px] mx-auto px-6 py-10 w-full">
              {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 mt-10">
              <div className="max-w-[1280px] mx-auto px-6 py-6 text-sm text-slate-600">
                © {new Date().getFullYear()} BookIt — Demo
              </div>
            </footer>
          </div>
        </Suspense>
      </body>
    </html>
  )
}
