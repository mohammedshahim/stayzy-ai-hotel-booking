type Props = {
  score: number;
  label: string;
};

export function GuestRatingBadge({ score, label }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-info-dim px-2 py-1">
      <span className="text-sm font-bold text-info">{score.toFixed(1)}</span>
      <span className="text-xs text-text-secondary">{label}</span>
    </span>
  );
}
