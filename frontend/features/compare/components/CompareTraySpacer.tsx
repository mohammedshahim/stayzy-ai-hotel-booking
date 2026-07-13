"use client";

import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";

// Reserves scroll room so the fixed CompareTray never overlaps the page's last row (most visible on /compare).
export function CompareTraySpacer() {
  const { ids } = useCompareSelection();
  if (ids.length === 0) return null;
  return <div className="h-24" aria-hidden="true" />;
}
