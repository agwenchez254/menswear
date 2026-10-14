import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { FilterPatch, ListKey, ShopFilters } from "@/features/shop/models";
import { readFilters } from "@/features/shop/lib/filters";

interface UseShopFilters {
  filters: ShopFilters;
  update: (patch: FilterPatch) => void;
  setList: (key: ListKey, list: string[]) => void;
  reset: () => void;
}

/** Shop filters live in the URL, so they can be shared and the back button works. */
export function useShopFilters(): UseShopFilters {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);

  const update = (patch: FilterPatch) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const setList = (key: ListKey, list: string[]) => update({ [key]: list.length ? list.join(",") : null });
  const reset = () => setParams({}, { replace: true });

  return { filters, update, setList, reset };
}
