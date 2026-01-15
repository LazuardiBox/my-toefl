// @/routers/routes.tsx

import { Route } from "@/routers/layout";
import { Route as oRPCRoutes } from "@/routers/orpc";

const pageModules = import.meta.glob("../src/client/pages/**/[A-Z]*Route.tsx", {
  eager: true,
});

type RouteChildren = Parameters<typeof Route.addChildren>[0];
type RouteChild = RouteChildren extends Array<infer T> ? T : never;

type RouteCandidate = {
  addChildren?: unknown;
  options?: { path?: unknown };
};

const isRouteChild = (item: unknown): item is RouteChild => {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as RouteCandidate;
  return (
    typeof candidate.addChildren === "function" &&
    typeof candidate.options?.path === "string"
  );
};

const routes = Object.values(pageModules).flatMap((moduleExports) => {
  if (!moduleExports || typeof moduleExports !== "object") {
    return [] as RouteChild[];
  }

  return Object.entries(moduleExports as Record<string, unknown>).flatMap(
    ([key, exportItem]) => {
      const isPascalCaseRoute = /^[A-Z][a-zA-Z0-9]*Routes?$/.test(key);

      if (!isPascalCaseRoute) {
        return [];
      }

      if (Array.isArray(exportItem)) {
        return exportItem.filter(isRouteChild);
      }

      return isRouteChild(exportItem) ? [exportItem] : [];
    },
  );
});

export const routeTree = Route.addChildren([
  ...routes,
  oRPCRoutes,
] as RouteChildren);
