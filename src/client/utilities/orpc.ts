import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { oRPCRouter } from '@/server/routers'

const getORPCClient = createIsomorphicFn()
  .client((): RouterClient<typeof oRPCRouter> => {
    const link = new RPCLink({
      url: `${window.location.origin}/orpc`,
    })

    return createORPCClient<RouterClient<typeof oRPCRouter>>(link)
  })
  .server((): RouterClient<typeof oRPCRouter> => {
    const link = new RPCLink({
      url: 'http://localhost:3000/orpc',
      headers: () => getRequestHeaders(),
    })

    return createORPCClient<RouterClient<typeof oRPCRouter>>(link)
  })

export const orpcClient: RouterClient<typeof oRPCRouter> = getORPCClient()
