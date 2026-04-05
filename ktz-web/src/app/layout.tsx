import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/widgets/app-shell';
import { SosChatPanel } from '@/widgets/sos-chat-panel';
import { AuthProvider } from '@/shared/lib/auth-context';

export const metadata: Metadata = {
  title: 'Kinetic Observer — Мониторинг локомотивов',
  description: 'Система мониторинга и телеметрии локомотивов KTZ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <SosChatPanel role="driver" />
        </AuthProvider>
      </body>
    </html>
  );
}
