import { Suspense } from "react";

import { SearchPageContent } from "@/features/search/components/SearchPageContent";

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
