"use client";

import { useState } from "react";

import { useHelloQuery } from "@/client/hooks/hello";

function HelloContent() {
  const [hasRequested, setHasRequested] = useState(false);
  const { data, isFetching, error, refetch } = useHelloQuery(false);

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Hello Endpoint
        </p>
        <p className="text-xl font-semibold text-zinc-900">
          {hasRequested
            ? data?.message ?? "No message yet"
            : "Click the button to call the API"}
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-600">
          Error: {(error as Error).message ?? "Unknown error"}
        </p>
      ) : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={async () => {
            setHasRequested(true);
            await refetch();
          }}
          className="flex flex-1 items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 active:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFetching}
        >
          {isFetching ? "Calling..." : "Call API"}
        </button>
        <button
          type="button"
          onClick={() => setHasRequested(false)}
          className="flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFetching && hasRequested}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans">
      <HelloContent />
    </main>
  );
}
