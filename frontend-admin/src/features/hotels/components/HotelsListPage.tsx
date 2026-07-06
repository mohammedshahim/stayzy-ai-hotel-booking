import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StarRatingDisplay } from "@/components/common/StarRatingDisplay";
import { useDeleteHotelMutation, useGetHotelsQuery } from "@/features/hotels/hotelsApi";
import type { HotelListItem } from "@/features/hotels/types";

const PAGE_SIZE = 20;

export function HotelsListPage() {
  const [page, setPage] = useState(1);
  const [hotelToDelete, setHotelToDelete] = useState<HotelListItem | null>(null);
  const { data, isLoading } = useGetHotelsQuery({ page, pageSize: PAGE_SIZE });
  const [deleteHotel, { isLoading: isDeleting }] = useDeleteHotelMutation();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  async function handleConfirmDelete() {
    if (!hotelToDelete) return;
    try {
      await deleteHotel(hotelToDelete.id).unwrap();
      toast.success(`${hotelToDelete.name} deleted`);
      setHotelToDelete(null);
    } catch {
      toast.error("Could not delete hotel");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Hotels</h1>
        <Button
          render={<Link to="/hotels/new" />}
          nativeButton={false}
          className="h-9 gap-2 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Add Hotel
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-subtle hover:bg-subtle">
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">Hotel</TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Location
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Rating
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium tracking-wide text-text-muted uppercase">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-xs font-medium tracking-wide text-text-muted uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow className="border-b border-border-default last:border-0 hover:bg-elevated">
                <TableCell colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                  Loading hotels...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow className="border-b border-border-default last:border-0 hover:bg-elevated">
                <TableCell colSpan={5} className="p-0">
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Building2 className="size-10 text-text-faint" />
                    <p className="text-base font-medium text-text-muted">No hotels yet</p>
                    <p className="max-w-xs text-center text-sm text-text-faint">
                      Add your first hotel to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((hotel) => (
              <TableRow key={hotel.id} className="border-b border-border-default transition-colors last:border-0 hover:bg-elevated">
                <TableCell className="px-4 py-3 text-sm text-text-secondary">
                  <div className="flex items-center gap-3">
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-subtle">
                      {hotel.mainImageUrl && <img src={hotel.mainImageUrl} alt="" className="size-full object-cover" />}
                    </div>
                    <span className="font-medium text-text-primary">{hotel.name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-text-secondary">
                  {hotel.city}, {hotel.country}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-text-secondary">
                  <StarRatingDisplay rating={hotel.starRating} />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-text-secondary">
                  <span
                    className={
                      hotel.status === "published"
                        ? "inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-dim px-2.5 py-1 text-xs font-medium text-success"
                        : "inline-flex items-center gap-1.5 rounded-full border border-neutral/20 bg-neutral-dim px-2.5 py-1 text-xs font-medium text-neutral"
                    }
                  >
                    {hotel.status}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-right text-sm text-text-secondary">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          className="size-8 rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link to={`/hotels/${hotel.id}`} />}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setHotelToDelete(hotel)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-8 rounded-xl px-3"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              className="h-8 rounded-xl px-3"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!hotelToDelete} onOpenChange={(open) => !open && setHotelToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete hotel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{hotelToDelete?.name}&quot;? It will disappear from the admin panel
              immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-9 rounded-xl" onClick={() => setHotelToDelete(null)}>
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
