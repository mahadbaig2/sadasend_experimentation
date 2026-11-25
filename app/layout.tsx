import './styles.css';

export const metadata = { title: 'Email Integration Lab', description: 'Evidence-first SadaSend integration evaluation' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
