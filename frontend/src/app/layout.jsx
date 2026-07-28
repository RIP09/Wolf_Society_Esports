import { Providers } from '@/providers';
import '@/styles/globals.css';

export const metadata = {
  title: 'Wolf Society Esports',
  description: 'Where champions rise.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
