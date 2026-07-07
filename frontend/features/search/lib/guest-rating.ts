export function getGuestRatingLabel(guestRating: number): string {
  if (guestRating >= 9) return "Excellent";
  if (guestRating >= 8) return "Very Good";
  if (guestRating >= 7) return "Good";
  return "Pleasant";
}
