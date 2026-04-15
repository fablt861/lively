import type { Metadata } from 'next';
import { getTranslations } from '@/lib/getTranslations';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslations(locale);
  
  return {
    title: t('seo.contact.title'),
    description: t('seo.contact.description'),
    alternates: {
      canonical: `/${locale}/contact`,
    },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
