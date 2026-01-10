import { useQuery } from "@tanstack/react-query";

import { api } from "@/client/utilities/api";

export function useHelloQuery(enabled = false) {
  return useQuery({
    queryKey: ["hello"],
    queryFn: () => api["hello-private"]({}),
    enabled,
  });
}
