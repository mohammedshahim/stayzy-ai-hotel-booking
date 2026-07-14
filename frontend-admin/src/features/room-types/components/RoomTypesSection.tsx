import { useState } from "react";
import { BedDouble, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RateOverrideManager } from "@/features/room-types/components/RateOverrideManager";
import { RoomTypeForm } from "@/features/room-types/components/RoomTypeForm";
import { RoomTypeImagesManager } from "@/features/room-types/components/RoomTypeImagesManager";
import { useDeleteRoomTypeMutation, useGetRoomTypesQuery } from "@/features/room-types/roomTypesApi";
import type { RoomType } from "@/features/room-types/types";

type Props = {
  hotelId: string;
};

export function RoomTypesSection({ hotelId }: Props) {
  const { data: roomTypes, isLoading } = useGetRoomTypesQuery(hotelId);
  const [deleteRoomType, { isLoading: isDeleting }] = useDeleteRoomTypeMutation();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [openValues, setOpenValues] = useState<string[]>([]);
  const [roomTypeToDelete, setRoomTypeToDelete] = useState<RoomType | null>(null);

  function handleCreated(roomType: RoomType) {
    setIsAddingNew(false);
    setOpenValues((current) => [...current, roomType.id]);
  }

  async function handleConfirmDelete() {
    if (!roomTypeToDelete) return;
    try {
      await deleteRoomType({ hotelId, id: roomTypeToDelete.id }).unwrap();
      toast.success(`${roomTypeToDelete.name} deleted`);
      setRoomTypeToDelete(null);
    } catch {
      toast.error("Could not delete room type");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading room types...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Room Types</h2>
        {!isAddingNew && (
          <Button
            type="button"
            className="h-9 gap-2 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus className="size-4" />
            Add Room Type
          </Button>
        )}
      </div>

      {isAddingNew && (
        <div className="rounded-2xl border border-border-default bg-surface p-6">
          <RoomTypeForm mode="create" hotelId={hotelId} onCreated={handleCreated} onCancel={() => setIsAddingNew(false)} />
        </div>
      )}

      {roomTypes?.length === 0 && !isAddingNew && (
        <div className="rounded-2xl border border-border-default bg-surface">
          <EmptyState icon={BedDouble} heading="No room types yet" body="Add one to start taking bookings for this hotel." />
        </div>
      )}

      {roomTypes && roomTypes.length > 0 && (
        <Accordion multiple value={openValues} onValueChange={(value) => setOpenValues(value as string[])}>
          {roomTypes.map((roomType) => (
            <AccordionItem
              key={roomType.id}
              value={roomType.id}
              className="rounded-2xl border border-border-default bg-surface px-6 not-last:mb-3 not-last:border-b-0"
            >
              <AccordionTrigger className="text-base">
                <div className="flex flex-1 items-center justify-between pr-2">
                  <span className="font-medium text-text-primary">{roomType.name}</span>
                  <span className="text-sm text-text-muted">
                    ${roomType.basePrice}/night · {roomType.totalInventory} rooms
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-6 pt-2">
                  <RoomTypeForm mode="edit" hotelId={hotelId} roomType={roomType} />

                  <div className="border-t border-border-default pt-4">
                    <h3 className="mb-3 text-sm font-semibold text-text-primary">Photos</h3>
                    <RoomTypeImagesManager hotelId={hotelId} roomTypeId={roomType.id} images={roomType.images} />
                  </div>

                  <div className="border-t border-border-default pt-4">
                    <h3 className="mb-3 text-sm font-semibold text-text-primary">Seasonal Pricing &amp; Blackout Dates</h3>
                    <RateOverrideManager roomTypeId={roomType.id} />
                  </div>

                  <div className="flex justify-end border-t border-border-default pt-4">
                    <Button
                      type="button"
                      className="h-9 rounded-xl border border-error/25 bg-error-dim px-4 text-error transition-colors hover:bg-error/20"
                      onClick={() => setRoomTypeToDelete(roomType)}
                    >
                      Delete Room Type
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={!!roomTypeToDelete} onOpenChange={(open) => !open && setRoomTypeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete room type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{roomTypeToDelete?.name}&quot;? It will disappear from the admin panel
              immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-9 rounded-xl" onClick={() => setRoomTypeToDelete(null)}>
              Cancel
            </Button>
            <Button
              className="h-9 rounded-xl border border-error/25 bg-error-dim px-4 text-error transition-colors hover:bg-error/20"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
