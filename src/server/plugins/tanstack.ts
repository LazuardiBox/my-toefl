import { RPCHandler } from '@orpc/server/fetch'
import { onError, ORPCError } from '@orpc/server'

import { oRPCRouter } from '@/server/routers'

export const rpcHandler = new RPCHandler(oRPCRouter, {
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && error.status <= 500) {
        return
      }

      console.error(error)
    }),
  ],
})
