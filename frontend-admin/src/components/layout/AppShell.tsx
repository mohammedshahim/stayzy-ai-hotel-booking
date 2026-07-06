import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen flex-1 bg-base">
        <Topbar />
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
