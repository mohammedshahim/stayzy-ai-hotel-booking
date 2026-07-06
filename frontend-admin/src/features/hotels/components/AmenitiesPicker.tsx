import { Checkbox } from "@/components/ui/checkbox";
import { useGetAmenitiesQuery } from "@/features/amenities/amenitiesApi";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function AmenitiesPicker({ selectedIds, onChange }: Props) {
  const { data: amenities, isLoading } = useGetAmenitiesQuery();

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((existingId) => existingId !== id));
  }

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading amenities...</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {amenities?.map((amenity) => (
        <label key={amenity.id} className="flex items-center gap-2 text-sm text-text-secondary">
          <Checkbox
            checked={selectedIds.includes(amenity.id)}
            onCheckedChange={(checked) => toggle(amenity.id, checked === true)}
          />
          {amenity.name}
        </label>
      ))}
    </div>
  );
}
