"use client";

import { useState } from "react";
import { ImageOffIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HotelImage } from "@/features/hotel-details/types";

type Props = {
  images: HotelImage[];
  hotelName: string;
};

export function HotelGallery({ images, hotelName }: Props) {
  const mainImage = images.find((image) => image.isMain) ?? images[0] ?? null;
  const [activeImageId, setActiveImageId] = useState<string | null>(mainImage?.id ?? null);
  const activeImage = images.find((image) => image.id === activeImageId) ?? mainImage;

  if (!activeImage) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-elevated">
        <ImageOffIcon className="h-10 w-10 text-text-faint" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-elevated">
        {/* eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet */}
        <img src={activeImage.url} alt={hotelName} className="absolute inset-0 h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveImageId(image.id)}
              className={cn(
                "h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                image.id === activeImage.id ? "border-accent-border" : "border-transparent",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- S3-hosted photos, no next/image domain configured yet */}
              <img src={image.url} alt={hotelName} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
