import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'OrgBean - Org-Mode & Beancount Studio',
  description: 'Unified Org-Mode knowledge base and Beancount plain-text double-entry accounting studio with cross-platform workflow, agenda calendar, financial reports, and cloud sync.',
  openGraph: {
    title: 'OrgBean - Org-Mode & Beancount Studio',
    description: 'Unified Org-Mode knowledge base and Beancount plain-text double-entry accounting studio with cross-platform workflow, agenda calendar, financial reports, and cloud sync.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OrgBean - Org-Mode & Beancount Studio',
    description: 'Unified Org-Mode knowledge base and Beancount plain-text double-entry accounting studio with cross-platform workflow, agenda calendar, financial reports, and cloud sync.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
