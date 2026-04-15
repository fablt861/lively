import type { Metadata } from 'next';
import { getTranslations } from '@/lib/getTranslations';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslations(locale);
  
  return {
    title: t('seo.login.title'),
    description: t('seo.login.description'),
    alternates: {
      canonical: `/${locale}/login`,
    },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
