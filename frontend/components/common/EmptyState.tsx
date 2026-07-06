import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  heading: string;
  body: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, heading, body, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Icon className="h-10 w-10 text-text-faint" strokeWidth={1.5} />
      <p className="text-base font-medium text-text-muted">{heading}</p>
      <p className="max-w-xs text-center text-sm text-text-faint">{body}</p>
      {action}
    </div>
  );
}
