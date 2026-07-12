"use client";

import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";

// Reserves real scroll room below the page's content so the fixed CompareTray
// (see CompareTray.tsx) never overlaps a page's last row once the user scrolls to
// the bottom — most visible on /compare, where the table's last row would otherwise
// sit directly under the tray.
export function CompareTraySpacer() {
  const { ids } = useCompareSelection();
  if (ids.length === 0) return null;
  return <div className="h-24" aria-hidden="true" />;
}
