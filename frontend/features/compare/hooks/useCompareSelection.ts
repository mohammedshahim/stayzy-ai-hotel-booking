"use client";

import { useContext } from "react";

import { CompareContext, type CompareContextValue } from "@/features/compare/components/CompareProvider";

export function useCompareSelection(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompareSelection must be used within a CompareProvider");
  }
  return context;
}
