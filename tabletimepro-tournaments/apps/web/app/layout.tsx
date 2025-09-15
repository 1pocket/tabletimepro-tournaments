export const metadata = {
  title: 'TTP Tournaments',
  description: 'Run pool tournaments: draw, bracket, payouts, calcutta.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink">
        <div className="max-w-5xl mx-auto p-4">{children}</div>
      </body>
    </html>
  );
}
