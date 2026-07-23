import { listAmenities } from "../queries/amenities.queries";
import { listMealPlans } from "../queries/meal-plans.queries";
import { listRoomFeatures } from "../queries/room-features.queries";

export interface NamedRow {
  id: string;
  name: string;
}

export interface ResolvedNames {
  ids: string[];
  unresolved: string[];
}

export interface FilterVocabulary {
  amenities: NamedRow[];
  roomFeatures: NamedRow[];
  mealPlans: NamedRow[];
}

export async function loadFilterVocabulary(): Promise<FilterVocabulary> {
  const [amenities, roomFeatures, mealPlans] = await Promise.all([
    listAmenities(),
    listRoomFeatures(),
    listMealPlans(),
  ]);
  return { amenities, roomFeatures, mealPlans };
}

export function resolveNames(names: string[] | undefined, vocabulary: NamedRow[]): ResolvedNames {
  const idsByName = new Map(vocabulary.map((row) => [row.name.toLowerCase(), row.id]));
  const ids: string[] = [];
  const unresolved: string[] = [];

  for (const name of names ?? []) {
    const id = idsByName.get(name.trim().toLowerCase());
    if (id) ids.push(id);
    else unresolved.push(name);
  }

  return { ids, unresolved };
}
