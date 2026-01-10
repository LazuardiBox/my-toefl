"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useState } from "react";

import { useHelloQuery } from "@/client/hooks/hello";

import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon } from '@hugeicons/core-free-icons';

function HelloContent() {
  const queryClient = useQueryClient();
  const [hasRequested, setHasRequested] = useState(false);
  const { data: HookResponse, isFetching, error, refetch, isFetched } = useHelloQuery(false);

  const statusLabel = (() => {
    if (isFetching) return "Loading";
    if (error) return "Error";
    if (hasRequested && isFetched) return "Success";
    return "Idle";
  })();

  return (
    <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Hello Endpoint
          </p>
          <p className="text-xl font-semibold text-zinc-900">
            {HookResponse?.data?.result ?? "Call the API to see the response"}
          </p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
          {statusLabel}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-800">JSON Response</p>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-800">
          <pre className="whitespace-pre-wrap break-words">
            {error
              ? `Error: ${(error as Error).message || "Unknown error"}`
              : HookResponse
                ? JSON.stringify(HookResponse.data?.result)
                : "No response yet. Call the API to view the response."}
          </pre>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={async () => {
            setHasRequested(true);
            await refetch();
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 active:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFetching}
        >
          {isFetching ? (
            <HugeiconsIcon
              icon={Loading02Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
              className="animate-spin"
            />
          ) : (
            "Call API"
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setHasRequested(false);
            queryClient.resetQueries({ queryKey: ["hello"] });
          }}
          className="flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFetching && hasRequested}
        >
          Reset
        </button>
      </div>
    </div >
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans">
      <HelloContent />
    </main>
  );
}
