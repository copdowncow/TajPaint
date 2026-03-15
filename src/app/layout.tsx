import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taj Paintball — Пейнтбол в Таджикистане',
  description: 'Лучший пейнтбольный клуб в Душанбе. Онлайн-бронирование.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>{children}</body>
    </html>
  );
}
