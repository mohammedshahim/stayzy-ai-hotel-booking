import { Checkbox } from "@/components/ui/checkbox";
import { useGetRoomFeaturesQuery } from "@/features/room-features/roomFeaturesApi";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function RoomTypeFeaturesPicker({ selectedIds, onChange }: Props) {
  const { data: roomFeatures, isLoading } = useGetRoomFeaturesQuery();

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((existingId) => existingId !== id));
  }

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading room features...</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {roomFeatures?.map((roomFeature) => (
        <label key={roomFeature.id} className="flex items-center gap-2 text-sm text-text-secondary">
          <Checkbox
            checked={selectedIds.includes(roomFeature.id)}
            onCheckedChange={(checked) => toggle(roomFeature.id, checked === true)}
          />
          {roomFeature.name}
        </label>
      ))}
    </div>
  );
}
