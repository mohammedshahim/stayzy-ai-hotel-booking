export const AVATAR_SEEDS = ["Aria", "Milo", "Nora", "Leo", "Iris", "Theo", "Wren", "Kai"] as const;

export function avatarUrlForSeed(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}
