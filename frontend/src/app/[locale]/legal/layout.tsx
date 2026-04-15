import type { Metadata } from 'next';
import { getTranslations } from '@/lib/getTranslations';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslations(locale);
  
  return {
    title: t('seo.legal.title'),
    description: t('seo.legal.description'),
    alternates: {
      canonical: `/${locale}/legal`,
    },
  };
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
