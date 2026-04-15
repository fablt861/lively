import type { Metadata } from 'next';
import { getTranslations } from '@/lib/getTranslations';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslations(locale);
  
  return {
    title: t('seo.live.title'),
    description: t('seo.live.description'),
    alternates: {
      canonical: `/${locale}/live`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
