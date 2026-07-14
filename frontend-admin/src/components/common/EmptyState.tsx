import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  icon: LucideIcon;
  heading: string;
  body: string;
  action?: ReactNode;
  iconClassName?: string;
};

export function EmptyState({ icon: Icon, heading, body, action, iconClassName = "text-text-faint" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Icon className={`size-10 ${iconClassName}`} />
      <p className="text-base font-medium text-text-muted">{heading}</p>
      <p className="max-w-xs text-center text-sm text-text-faint">{body}</p>
      {action}
    </div>
  );
}
