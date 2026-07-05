import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-6 py-12">
      <Card className="w-full max-w-md gap-4 rounded-2xl border border-border-default bg-elevated p-6 shadow-card">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          {description && <p className="text-sm text-text-muted">{description}</p>}
        </div>
        {children}
      </Card>
    </main>
  );
}
