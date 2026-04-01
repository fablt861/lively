import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fr', 'en', 'de', 'es', 'nl', 'it', 'ro', 'uk', 'pt', 'ru', 'sv', 'no', 'fi'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 1. Exclude static assets, icons, and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.includes('.') ||
        pathname.startsWith('/api/') ||
        pathname === '/favicon.ico' ||
        pathname === '/icon.svg' ||
        pathname.startsWith('/locales/')
    ) {
        return NextResponse.next();
    }

    // 2. Check if the pathname already has a supported locale
    const pathnameIsMissingLocale = locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    );

    // 3. Handle root "/" - The user wants root to stay as root but be English.
    // We can rewrite "/" to "/en" internally so that app/[locale]/page.tsx handles it.
    if (pathname === '/') {
        return NextResponse.rewrite(new URL(`/en`, request.url));
    }

    // 4. Redirect if locale is missing from other paths (e.g. /login -> /en/login)
    if (pathnameIsMissingLocale) {
        // We assume default English for missing locales
        return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Skip all internal paths (_next)
        '/((?!_next|api|locales|.*\\.).*)',
        // Always run for root
        '/',
    ],
};
