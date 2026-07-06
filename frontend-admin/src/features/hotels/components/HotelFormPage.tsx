import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AmenitiesPicker } from "@/features/hotels/components/AmenitiesPicker";
import { HotelImagesManager } from "@/features/hotels/components/HotelImagesManager";
import { useCreateHotelMutation, useGetHotelQuery, useUpdateHotelMutation } from "@/features/hotels/hotelsApi";
import type { HotelFormInput } from "@/features/hotels/types";

const EMPTY_FORM: HotelFormInput = {
  name: "",
  description: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  starRating: 3,
  checkInTime: "14:00",
  checkOutTime: "11:00",
  freeCancellation: false,
  cancellationPolicy: "",
  status: "draft",
  amenityIds: [],
};

const INPUT_CLASS =
  "h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border";

export function HotelFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { data: hotel, isLoading: isLoadingHotel } = useGetHotelQuery(id ?? "", { skip: !isEditMode });
  const [createHotel, { isLoading: isCreating }] = useCreateHotelMutation();
  const [updateHotel, { isLoading: isUpdating }] = useUpdateHotelMutation();

  const [form, setForm] = useState<HotelFormInput>(EMPTY_FORM);

  useEffect(() => {
    if (!hotel) return;
    setForm({
      name: hotel.name,
      description: hotel.description,
      addressLine1: hotel.addressLine1,
      addressLine2: hotel.addressLine2 ?? "",
      city: hotel.city,
      state: hotel.state ?? "",
      country: hotel.country,
      postalCode: hotel.postalCode ?? "",
      starRating: hotel.starRating,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      freeCancellation: hotel.freeCancellation,
      cancellationPolicy: hotel.cancellationPolicy,
      status: hotel.status,
      amenityIds: hotel.amenities.map((amenity) => amenity.id),
    });
  }, [hotel]);

  function updateField<K extends keyof HotelFormInput>(field: K, value: HotelFormInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function inputHandler(field: keyof HotelFormInput) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateField(field, event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (isEditMode && id) {
        await updateHotel({ id, body: form }).unwrap();
        toast.success("Hotel updated");
      } else {
        const created = await createHotel(form).unwrap();
        toast.success("Hotel created — now add photos below");
        navigate(`/hotels/${created.id}`, { replace: true });
      }
    } catch {
      toast.error("Could not save hotel");
    }
  }

  if (isEditMode && isLoadingHotel) {
    return <p className="text-sm text-text-muted">Loading hotel...</p>;
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-text-primary">{isEditMode ? "Edit Hotel" : "Add Hotel"}</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-2xl border border-border-default bg-surface p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={form.name} onChange={inputHandler("name")} className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              required
              value={form.description}
              onChange={inputHandler("description")}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input
              id="addressLine1"
              required
              value={form.addressLine1}
              onChange={inputHandler("addressLine1")}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
            <Input id="addressLine2" value={form.addressLine2} onChange={inputHandler("addressLine2")} className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" required value={form.city} onChange={inputHandler("city")} className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="state">State (optional)</Label>
            <Input id="state" value={form.state} onChange={inputHandler("state")} className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">Country</Label>
            <Input id="country" required value={form.country} onChange={inputHandler("country")} className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="postalCode">Postal code (optional)</Label>
            <Input id="postalCode" value={form.postalCode} onChange={inputHandler("postalCode")} className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Star rating</Label>
            <Select value={String(form.starRating)} onValueChange={(value) => updateField("starRating", Number(value))}>
              <SelectTrigger className={`w-full ${INPUT_CLASS}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={String(rating)}>
                    {rating} star{rating > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => updateField("status", value as HotelFormInput["status"])}
            >
              <SelectTrigger className={`w-full ${INPUT_CLASS}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkInTime">Check-in time</Label>
            <Input
              id="checkInTime"
              type="time"
              required
              value={form.checkInTime}
              onChange={inputHandler("checkInTime")}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkOutTime">Check-out time</Label>
            <Input
              id="checkOutTime"
              type="time"
              required
              value={form.checkOutTime}
              onChange={inputHandler("checkOutTime")}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="cancellationPolicy">Cancellation policy</Label>
            <Textarea
              id="cancellationPolicy"
              required
              value={form.cancellationPolicy}
              onChange={inputHandler("cancellationPolicy")}
              className={INPUT_CLASS}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary sm:col-span-2">
            <Checkbox
              checked={form.freeCancellation}
              onCheckedChange={(checked) => updateField("freeCancellation", checked === true)}
            />
            Free cancellation by default
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Amenities</Label>
          <AmenitiesPicker selectedIds={form.amenityIds} onChange={(ids) => updateField("amenityIds", ids)} />
        </div>

        <div className="flex justify-end gap-3 border-t border-border-default pt-4">
          <Button
            type="button"
            className="h-9 rounded-xl border border-border-default bg-elevated px-4 text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
            onClick={() => navigate("/hotels")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="h-9 rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {isSaving ? "Saving..." : "Save Hotel"}
          </Button>
        </div>
      </form>

      {isEditMode && id && (
        <div className="rounded-2xl border border-border-default bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Photos</h2>
          <HotelImagesManager hotelId={id} images={hotel?.images ?? []} />
        </div>
      )}
    </div>
  );
}
