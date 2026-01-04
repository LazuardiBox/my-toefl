import { rpcHandler } from "@/server/plugins/next";

const prefix = "/orpc";

async function handleRequest(request: Request) {
  const { response } = await rpcHandler.handle(request, {
    prefix,
    context: {},
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
