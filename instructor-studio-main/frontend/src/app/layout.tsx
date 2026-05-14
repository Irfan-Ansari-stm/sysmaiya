import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'InstructorStudio - A Better Learning Journey',
    template: '%s | InstructorStudio',
  },
  description: 'Learn from the best instructors. Courses in Web Dev, Data Science, Design, and more.',
  keywords: ['online learning', 'courses', 'programming', 'web development', 'instructor'],
  authors: [{ name: 'InstructorStudio' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://instructorstudio.in',
    siteName: 'InstructorStudio',
    title: 'InstructorStudio - A Better Learning Journey',
    description: 'Learn from the best instructors online.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '8px', background: '#1A3C5E', color: '#fff' },
              success: { iconTheme: { primary: '#F97316', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
