// @ts-nocheck
/* eslint-disable */

import { Hono } from 'hono'
import { RPCHandler } from '@orpc/server/fetch'
import { onError } from '@orpc/server'
import { appRouter } from '@/server/routers'
import { db } from '@/server/libraries/drizzle'
import type { AppContext } from '@/server/contexts'

const app = new Hono()

const handler = new RPCHandler(appRouter, {
    interceptors: [
        onError((error) => {
            console.error(error)
        }),
    ],
})

app.use('/orpc/*', async (c, next) => {
    const { matched, response } = await handler.handle(c.req.raw, {
        prefix: '/orpc',
        context: {
            req: c.req.raw,
            db,
            requestId: crypto.randomUUID(),
            status: "pending",
            auth: "false",
        } satisfies AppContext
    })

    if (matched) {
        return c.newResponse(response.body, response)
    }

    await next()
})

export default app