import { z } from "zod";

export const searchSuggestionsQuerySchema = z.object({
  q: z.string().default(""),
});

export type SearchSuggestionsQuery = z.infer<typeof searchSuggestionsQuerySchema>;
