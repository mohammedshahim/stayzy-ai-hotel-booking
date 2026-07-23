import type { SearchState } from "@/features/search/types";

export function clearAnchor(state: SearchState): Partial<SearchState> {
  return {
    near: null,
    radiusKm: null,
    sort: state.sort === "distance" ? "recommended" : state.sort,
  };
}
