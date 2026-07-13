"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/common/StarRating";
import { useDeleteReview } from "@/features/reviews/hooks/useDeleteReview";
import { useSubmitReview } from "@/features/reviews/hooks/useSubmitReview";
import type { OwnReview } from "@/features/reviews/types";

type Props = {
  bookingId: string;
  existingReview: OwnReview | null;
};

export function ReviewForm({ bookingId, existingReview }: Props) {
  const router = useRouter();
  const mode = existingReview ? "edit" : "create";
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [description, setDescription] = useState(existingReview?.description ?? "");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { submitReview, isSubmitting, error: submitError } = useSubmitReview();
  const { deleteReview, isDeleting, error: deleteError } = useDeleteReview();

  const isValid = rating >= 1 && description.trim().length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;

    const review = await submitReview(bookingId, mode, { rating, description: description.trim() });
    if (review) {
      router.push(`/bookings/${bookingId}`);
      router.refresh();
    }
  }

  async function handleDelete() {
    const deleted = await deleteReview(bookingId);
    if (deleted) {
      router.push(`/bookings/${bookingId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border-default bg-surface p-5">
      <div className="flex flex-col gap-1.5">
        <Label>Rating</Label>
        <StarRating rating={rating} onChange={setRating} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-description">Your review</Label>
        <Textarea
          id="review-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Share details of your stay…"
          required
          className="min-h-32 rounded-xl border-border-default bg-subtle px-3 py-2.5 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border"
        />
      </div>
      {submitError && <p className="text-sm text-error">{submitError}</p>}
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="h-9 w-fit rounded-xl bg-accent-primary px-4 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving…" : mode === "create" ? "Submit review" : "Save changes"}
      </Button>

      {mode === "edit" && (
        <div className="flex flex-col gap-3 border-t border-border-default pt-4">
          {deleteError && <p className="text-sm text-error">{deleteError}</p>}
          {isConfirmingDelete ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-primary">Delete this review? This can&apos;t be undone.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-9 rounded-xl border border-error/25 bg-error-dim px-4 font-medium text-error transition-colors hover:bg-error/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeleting ? "Deleting…" : "Yes, delete review"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                  className="h-9 rounded-xl border border-border-default bg-elevated px-4 font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-subtle hover:text-text-primary"
                >
                  No, keep it
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="h-9 w-fit rounded-xl border border-error/25 bg-error-dim px-4 font-medium text-error transition-colors hover:bg-error/20"
            >
              Delete review
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
