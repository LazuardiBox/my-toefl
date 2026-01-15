import { useHello } from "@/client/hooks/useHello";
import { PageRoute } from "@/routers";

export const HelloRoute = PageRoute({
  path: "/hello",
  component: HelloRouteComponent,
  title: "Hello",
});

function HelloRouteComponent() {
  const { data, error, isFetching, refetch } = useHello();
  const response = data?.data;
  const errorMessage =
    error instanceof Error ? error.message : "Something went wrong.";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          TanStack Query
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">Hello RPC</h1>
        <p className="text-sm text-gray-600">
          Simple example using the <code>useHello</code> hook.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Response</p>
            <p className="text-xs text-gray-500">
              {isFetching ? "Fetching latest data..." : "Up to date"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {isFetching && (
            <p className="text-sm text-gray-500">Loading hello message...</p>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          {!error && response && (
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Message
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {response.result}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Request ID
                </p>
                <p className="text-sm font-mono text-gray-700">
                  {response.requestId}
                </p>
              </div>
            </div>
          )}

          {!error && !response && !isFetching && (
            <p className="text-sm text-gray-500">
              No data yet. Try refreshing the request.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
