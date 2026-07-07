import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";
import { Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDeleteRoomTypeImageMutation,
  useReorderRoomTypeImagesMutation,
  useUploadRoomTypeImageMutation,
} from "@/features/room-types/roomTypesApi";
import type { RoomTypeImage } from "@/features/room-types/types";

type Props = {
  hotelId: string;
  roomTypeId: string;
  images: RoomTypeImage[];
};

export function RoomTypeImagesManager({ hotelId, roomTypeId, images }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [uploadImage, { isLoading: isUploading }] = useUploadRoomTypeImageMutation();
  const [reorderImages] = useReorderRoomTypeImagesMutation();
  const [deleteImage] = useDeleteRoomTypeImageMutation();

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await uploadImage({ hotelId, id: roomTypeId, file }).unwrap();
    } catch {
      toast.error("Could not upload image");
    }
  }

  async function handleSetMain(imageId: string) {
    const imageIds = sorted.map((image) => image.id);
    try {
      await reorderImages({ hotelId, id: roomTypeId, imageIds, mainImageId: imageId }).unwrap();
    } catch {
      toast.error("Could not update main image");
    }
  }

  async function handleDelete(imageId: string) {
    try {
      await deleteImage({ hotelId, id: roomTypeId, imageId }).unwrap();
    } catch {
      toast.error("Could not delete image");
    }
  }

  async function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const ids = sorted.map((image) => image.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, draggedId);
    setDraggedId(null);

    const mainImageId = sorted.find((image) => image.isMain)?.id ?? ids[0];
    if (!mainImageId) return;
    try {
      await reorderImages({ hotelId, id: roomTypeId, imageIds: ids, mainImageId }).unwrap();
    } catch {
      toast.error("Could not reorder images");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {sorted.map((image) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => setDraggedId(image.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(image.id)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border-default bg-subtle"
          >
            <img src={image.url} alt="" className="size-full object-cover" />
            {image.isMain && (
              <span className="absolute top-2 left-2 rounded-lg bg-accent-primary px-2 py-0.5 text-xs font-medium text-white">
                Main
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-black/40 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              {!image.isMain && (
                <Button
                  type="button"
                  variant="ghost"
                  className="size-8 rounded-xl text-white transition-colors hover:bg-white/20 hover:text-white"
                  onClick={() => handleSetMain(image.id)}
                >
                  <Star className="size-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="size-8 rounded-xl text-white transition-colors hover:bg-white/20 hover:text-white"
                onClick={() => handleDelete(image.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-default text-text-muted hover:bg-subtle disabled:opacity-60"
        >
          <Upload className="size-5" />
          <span className="text-xs">{isUploading ? "Uploading..." : "Add photo"}</span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}
