// @/routers/index.ts

import { createRoute, createRouter, type RouteComponent } from '@tanstack/react-router'
import { routeTree } from '@/routers/routes'
import { Route } from '@/routers/layout'

export type PageRouteConfig<TPath extends string> = {
    path: TPath
    component: RouteComponent
    title?: string
}

export function PageRoute<TPath extends string>(config: PageRouteConfig<TPath>) {
    return createRoute({
        getParentRoute: () => Route,
        path: config.path,
        component: config.component,
        head: () => ({
            meta: config.title ? [{ title: config.title }] : [],
        }),
    })
}

export function getRouter() {
    return createRouter({
        routeTree,
    })
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof getRouter>
    }
}
