import type { Metadata } from 'next';
import { getTranslations } from '@/lib/getTranslations';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslations(locale);
  
  return {
    title: t('seo.elite_signup.title'),
    description: t('seo.elite_signup.description'),
    alternates: {
      canonical: `/${locale}/elite/signup`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function EliteSignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
