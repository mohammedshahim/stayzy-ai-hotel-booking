import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateRateOverrideRangeMutation,
  useDeleteRateOverrideRangeMutation,
  useGetRateOverridesQuery,
} from "@/features/room-types/roomTypesApi";

type Props = {
  roomTypeId: string;
};

const INPUT_CLASS =
  "h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border";

const EMPTY_RANGE_FORM = { startDate: "", endDate: "", price: "", availableOverride: "" };

export function RateOverrideManager({ roomTypeId }: Props) {
  const { data: ranges, isLoading } = useGetRateOverridesQuery(roomTypeId);
  const [createRange, { isLoading: isCreating }] = useCreateRateOverrideRangeMutation();
  const [deleteRange] = useDeleteRateOverrideRangeMutation();
  const [form, setForm] = useState(EMPTY_RANGE_FORM);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.price && !form.availableOverride) {
      toast.error("Set a price override, an availability override, or both");
      return;
    }
    try {
      await createRange({
        roomTypeId,
        body: {
          startDate: form.startDate,
          endDate: form.endDate,
          price: form.price ? Number(form.price) : null,
          availableOverride: form.availableOverride ? Number(form.availableOverride) : null,
        },
      }).unwrap();
      setForm(EMPTY_RANGE_FORM);
      toast.success("Rate override saved");
    } catch {
      toast.error("Could not save rate override");
    }
  }

  async function handleDelete(startDate: string, endDate: string) {
    try {
      await deleteRange({ roomTypeId, body: { startDate, endDate } }).unwrap();
    } catch {
      toast.error("Could not delete rate override");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateOverrideStart">From</Label>
          <Input
            id="rateOverrideStart"
            type="date"
            required
            value={form.startDate}
            onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateOverrideEnd">To</Label>
          <Input
            id="rateOverrideEnd"
            type="date"
            required
            min={form.startDate || undefined}
            value={form.endDate}
            onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateOverridePrice">Price override</Label>
          <Input
            id="rateOverridePrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Unchanged"
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateOverrideAvailability">Availability override</Label>
          <Input
            id="rateOverrideAvailability"
            type="number"
            min="0"
            step="1"
            placeholder="Unchanged"
            value={form.availableOverride}
            onChange={(event) => setForm((current) => ({ ...current, availableOverride: event.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-4">
          <Button
            type="submit"
            disabled={isCreating}
            className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {isCreating ? "Saving..." : "Add rate override"}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        {isLoading && <p className="text-sm text-text-muted">Loading rate overrides...</p>}
        {!isLoading && ranges?.length === 0 && (
          <p className="text-sm text-text-muted">No seasonal pricing or blackout dates set for this room type.</p>
        )}
        {ranges?.map((range) => (
          <div
            key={`${range.startDate}-${range.endDate}`}
            className="flex items-center justify-between rounded-xl border border-border-default bg-subtle px-3 py-2 text-sm text-text-secondary"
          >
            <span>
              {range.startDate === range.endDate ? range.startDate : `${range.startDate} → ${range.endDate}`}
              {range.price !== null && <span className="ml-2 text-text-primary">${range.price}/night</span>}
              {range.availableOverride !== null && (
                <span className="ml-2 text-text-muted">{range.availableOverride} available</span>
              )}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="size-8 rounded-xl text-text-muted transition-colors hover:bg-error-dim hover:text-error"
              onClick={() => handleDelete(range.startDate, range.endDate)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
