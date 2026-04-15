import type { Metadata } from 'next';
import { getTranslations } from '@/lib/getTranslations';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslations(locale);
  
  return {
    title: t('seo.slavery.title'),
    description: t('seo.slavery.description'),
    alternates: {
      canonical: `/${locale}/slavery`,
    },
  };
}

export default function SlaveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
