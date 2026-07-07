import { listRoomFeatures } from "../queries/room-features.queries";
import type { RoomFeature } from "../models/room-type.schema";

export async function listRoomFeaturesForPicker(): Promise<RoomFeature[]> {
  return listRoomFeatures();
}
