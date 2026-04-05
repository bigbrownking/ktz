import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/widgets/app-shell';
import { ChatPanelRoot } from '@/widgets/chat-panel-root';
import { AuthProvider } from '@/shared/lib/auth-context';

export const metadata: Metadata = {
  title: 'Мониторинг локомотивов КТЖ',
  description: 'Система мониторинга и телеметрии локомотивов KTZ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <ChatPanelRoot />
        </AuthProvider>
      </body>
    </html>
  );
}
