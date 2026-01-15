// @/routers/layout.tsx

import {
    HeadContent,
    Link,
    Scripts,
    createRootRoute,
} from '@tanstack/react-router'

import appCss from '@/client/assets/global.css?url'

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                title: '',
            },
        ],
        links: [
            {
                rel: 'stylesheet',
                href: appCss,
            },
            {
                rel: 'stylesheet',
                href: 'https://fonts.bunny.net/css?family=outfit:200,300,400,500,600,700,800,900&display=swap',
            },
        ],
    }),

    shellComponent: RootLayout,
    notFoundComponent: NotFoundLayout,
})

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    )
}

function NotFoundLayout() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                404
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
                Page not found
            </h1>
            <p className="mt-4 text-base text-gray-600">
                The page you are looking for does not exist or has moved.
            </p>
            <Link
                to="/"
                className="mt-8 inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
            >
                Back to home
            </Link>
        </main>
    )
}
