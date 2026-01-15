// @/routers/routes.tsx

import { Route } from '@/routers/layout'
import { Route as oRPCRoutes } from '@/routers/orpc'

const pageModules = import.meta.glob('../src/client/pages/**/[A-Z]*Route.tsx', {
    eager: true,
})

const routes = Object.values(pageModules).flatMap((mod: any) => {
    return Object.entries(mod).flatMap(([key, exportItem]: [string, any]) => {
        const isPascalCaseRoute = /^[A-Z][a-zA-Z0-9]*Routes?$/.test(key)

        if (!isPascalCaseRoute || !exportItem) return []

        const isValidRoute = (item: any) =>
            item &&
            typeof item === 'object' &&
            typeof item.addChildren === 'function' &&
            item.options?.path

        if (Array.isArray(exportItem)) {
            return exportItem.filter(isValidRoute)
        }

        if (isValidRoute(exportItem)) {
            return [exportItem]
        }

        return []
    })
})

export const routeTree = Route.addChildren(
    [...routes, oRPCRoutes] as any,
)
