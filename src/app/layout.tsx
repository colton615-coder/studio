import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';
import PushNotificationClient from '@/components/pwa/PushNotificationClient';
import DeviceValidationBanner from '@/components/DeviceValidationBanner';
import BottomNavBar from '@/app/components/BottomNavBar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'LiFE-iN-SYNC',
  description: 'Your all-in-one life management dashboard.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LiFE-iN-SYNC',
  },
  icons: {
    apple: [
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 2.0,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <div className="flex min-h-screen flex-col">
            <DeviceValidationBanner />
            <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+4.75rem)]">
              {children}
            </main>
            <BottomNavBar />
          </div>
        </FirebaseClientProvider>
        <Toaster />
        <ServiceWorkerRegistration />
        <PushNotificationClient />
      </body>
    </html>
  );
}
