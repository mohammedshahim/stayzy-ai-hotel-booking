import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetMealPlansQuery } from "@/features/meal-plans/mealPlansApi";
import { RoomTypeFeaturesPicker } from "@/features/room-types/components/RoomTypeFeaturesPicker";
import { useCreateRoomTypeMutation, useUpdateRoomTypeMutation } from "@/features/room-types/roomTypesApi";
import type { RoomType, RoomTypeFormInput } from "@/features/room-types/types";

type Props =
  | { mode: "create"; hotelId: string; roomType?: undefined; onCreated: (roomType: RoomType) => void; onCancel: () => void }
  | { mode: "edit"; hotelId: string; roomType: RoomType; onCreated?: undefined; onCancel?: undefined };

const INPUT_CLASS =
  "h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border";

function toFormInput(roomType?: RoomType): RoomTypeFormInput {
  return {
    name: roomType?.name ?? "",
    description: roomType?.description ?? "",
    maxAdults: roomType?.maxAdults ?? 2,
    maxKids: roomType?.maxKids ?? 0,
    basePrice: roomType?.basePrice ?? 0,
    totalInventory: roomType?.totalInventory ?? 1,
    freeCancellation: roomType?.freeCancellation ?? null,
    mealPlanId: roomType?.mealPlanId ?? null,
    roomFeatureIds: roomType?.features.map((feature) => feature.id) ?? [],
  };
}

// "inherit" isn't representable in a boolean form field, so the tri-state
// free-cancellation control is modeled as its own string union at the UI layer.
type FreeCancellationOption = "inherit" | "yes" | "no";

function toOption(value: boolean | null): FreeCancellationOption {
  if (value === null) return "inherit";
  return value ? "yes" : "no";
}

function fromOption(option: FreeCancellationOption): boolean | null {
  if (option === "inherit") return null;
  return option === "yes";
}

export function RoomTypeForm(props: Props) {
  const { mode, hotelId, roomType } = props;
  const { data: mealPlans } = useGetMealPlansQuery();
  const [createRoomType, { isLoading: isCreating }] = useCreateRoomTypeMutation();
  const [updateRoomType, { isLoading: isUpdating }] = useUpdateRoomTypeMutation();

  const [form, setForm] = useState<RoomTypeFormInput>(() => toFormInput(roomType));

  function updateField<K extends keyof RoomTypeFormInput>(field: K, value: RoomTypeFormInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function inputHandler(field: "name" | "description") {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateField(field, event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (mode === "create") {
        const created = await createRoomType({ hotelId, body: form }).unwrap();
        toast.success("Room type created — now add photos and rate overrides below");
        props.onCreated(created);
      } else {
        await updateRoomType({ hotelId, id: roomType.id, body: form }).unwrap();
        toast.success("Room type updated");
      }
    } catch {
      toast.error("Could not save room type");
    }
  }

  const isSaving = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={`name-${roomType?.id ?? "new"}`}>Name</Label>
          <Input
            id={`name-${roomType?.id ?? "new"}`}
            required
            value={form.name}
            onChange={inputHandler("name")}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={`description-${roomType?.id ?? "new"}`}>Description</Label>
          <Textarea
            id={`description-${roomType?.id ?? "new"}`}
            required
            value={form.description}
            onChange={inputHandler("description")}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`maxAdults-${roomType?.id ?? "new"}`}>Max adults</Label>
          <Input
            id={`maxAdults-${roomType?.id ?? "new"}`}
            type="number"
            min={1}
            required
            value={form.maxAdults}
            onChange={(event) => updateField("maxAdults", Number(event.target.value))}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`maxKids-${roomType?.id ?? "new"}`}>Max kids</Label>
          <Input
            id={`maxKids-${roomType?.id ?? "new"}`}
            type="number"
            min={0}
            required
            value={form.maxKids}
            onChange={(event) => updateField("maxKids", Number(event.target.value))}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`basePrice-${roomType?.id ?? "new"}`}>Base price (per night)</Label>
          <Input
            id={`basePrice-${roomType?.id ?? "new"}`}
            type="number"
            min={0.01}
            step="0.01"
            required
            value={form.basePrice}
            onChange={(event) => updateField("basePrice", Number(event.target.value))}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`totalInventory-${roomType?.id ?? "new"}`}>Total inventory</Label>
          <Input
            id={`totalInventory-${roomType?.id ?? "new"}`}
            type="number"
            min={0}
            required
            value={form.totalInventory}
            onChange={(event) => updateField("totalInventory", Number(event.target.value))}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Meal plan</Label>
          <Select
            value={form.mealPlanId ?? "none"}
            onValueChange={(value) => updateField("mealPlanId", value === "none" ? null : value)}
          >
            <SelectTrigger className={`w-full ${INPUT_CLASS}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No meal plan</SelectItem>
              {mealPlans?.map((mealPlan) => (
                <SelectItem key={mealPlan.id} value={mealPlan.id}>
                  {mealPlan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Free cancellation</Label>
          <Select
            value={toOption(form.freeCancellation)}
            onValueChange={(value) => updateField("freeCancellation", fromOption(value as FreeCancellationOption))}
          >
            <SelectTrigger className={`w-full ${INPUT_CLASS}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit hotel default</SelectItem>
              <SelectItem value="yes">Always free cancellation</SelectItem>
              <SelectItem value="no">Never free cancellation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Room features</Label>
        <RoomTypeFeaturesPicker
          selectedIds={form.roomFeatureIds}
          onChange={(ids) => updateField("roomFeatureIds", ids)}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-border-default pt-4">
        {mode === "create" && (
          <Button
            type="button"
            className="h-9 rounded-xl border border-border-default bg-elevated px-4 text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
            onClick={props.onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSaving}
          className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Create room type" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
