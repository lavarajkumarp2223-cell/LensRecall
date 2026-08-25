import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LensRecall — AI-Powered Event Photography & Personal Memory Discovery',
  description:
    'LensRecall is the premier AI event photo discovery platform. Event guests find every moment they are in within seconds using privacy-first, event-isolated face recognition.',
  keywords: [
    'event photography',
    'AI face recognition',
    'photo discovery',
    'wedding photography SaaS',
    'event gallery',
    'biometric photo search',
  ],
  authors: [{ name: 'LensRecall' }],
  openGraph: {
    title: 'LensRecall — Find Every Moment You\'re In',
    description:
      'AI-powered event photo discovery. Photographers upload, attendees scan QR, AI matches instantly.',
    type: 'website',
    url: 'https://lensrecall.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f8fafc] text-slate-900 antialiased selection:bg-indigo-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
