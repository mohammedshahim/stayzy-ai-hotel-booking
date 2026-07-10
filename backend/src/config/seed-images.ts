import { uploadImage } from "../services/upload.service";

/**
 * One-off utility: downloads real photos and pushes them through the app's actual
 * S3 upload pipeline, producing real *.s3.amazonaws.com URLs to hardcode into seed.ts.
 * Run manually with `pnpm seed:images` — not invoked as part of the normal seed flow.
 */

interface ImageTarget {
  folder: string;
  seed: string;
}

// Mirrors the hotel/room-type image slots currently hardcoded in seed.ts.
const TARGETS: ImageTarget[] = [
  { folder: "hotels/seed/hotel-marais-charme", seed: "hotel-marais-charme-1" },
  { folder: "hotels/seed/hotel-marais-charme", seed: "hotel-marais-charme-2" },
  { folder: "room-types/seed/hotel-marais-charme/room-classic", seed: "hotel-marais-charme-room-classic" },
  { folder: "room-types/seed/hotel-marais-charme/room-suite", seed: "hotel-marais-charme-room-suite" },

  { folder: "hotels/seed/le-louvre-riverside", seed: "le-louvre-riverside-1" },
  { folder: "hotels/seed/le-louvre-riverside", seed: "le-louvre-riverside-2" },
  { folder: "room-types/seed/le-louvre-riverside/room-king", seed: "le-louvre-riverside-room-king" },
  { folder: "room-types/seed/le-louvre-riverside/room-suite", seed: "le-louvre-riverside-room-suite" },

  { folder: "hotels/seed/shibuya-sky-hotel", seed: "shibuya-sky-hotel-1" },
  { folder: "hotels/seed/shibuya-sky-hotel", seed: "shibuya-sky-hotel-2" },
  { folder: "room-types/seed/shibuya-sky-hotel/room-twin", seed: "shibuya-sky-hotel-room-twin" },
  { folder: "room-types/seed/shibuya-sky-hotel/room-suite", seed: "shibuya-sky-hotel-room-suite" },

  { folder: "hotels/seed/asakusa-ryokan-inn", seed: "asakusa-ryokan-inn-1" },
  { folder: "hotels/seed/asakusa-ryokan-inn", seed: "asakusa-ryokan-inn-2" },
  { folder: "room-types/seed/asakusa-ryokan-inn/room-tatami", seed: "asakusa-ryokan-inn-room-tatami" },
  { folder: "room-types/seed/asakusa-ryokan-inn/room-family", seed: "asakusa-ryokan-inn-room-family" },

  { folder: "hotels/seed/midtown-manhattan-hotel", seed: "midtown-manhattan-hotel-1" },
  { folder: "hotels/seed/midtown-manhattan-hotel", seed: "midtown-manhattan-hotel-2" },
  { folder: "room-types/seed/midtown-manhattan-hotel/room-queen", seed: "midtown-manhattan-hotel-room-queen" },
  { folder: "room-types/seed/midtown-manhattan-hotel/room-suite", seed: "midtown-manhattan-hotel-room-suite" },
];

async function downloadImage(seed: string): Promise<Buffer> {
  const response = await fetch(`https://picsum.photos/seed/${seed}/1200/800`);
  if (!response.ok) throw new Error(`[seed-images] failed to download ${seed}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main(): Promise<void> {
  const results: Record<string, string> = {};

  for (const target of TARGETS) {
    const buffer = await downloadImage(target.seed);
    const url = await uploadImage(
      { buffer, mimetype: "image/jpeg", originalname: `${target.seed}.jpg`, size: buffer.length },
      target.folder
    );
    results[target.seed] = url;
    console.log(`[seed-images] uploaded ${target.seed} -> ${url}`);
  }

  console.log("\n[seed-images] done. URL map:\n");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error("[seed-images] error", error);
  process.exit(1);
});
