"use client";

import { useEffect, useState } from "react";
import { MessageCircleIcon } from "lucide-react";

import { useCompareSelection } from "@/features/compare/hooks/useCompareSelection";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { useChatStream } from "@/features/chat/hooks/useChatStream";
import { usePageContext } from "@/features/chat/hooks/usePageContext";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const chat = useChatStream();
  const { hydrate } = chat;
  const { context, label } = usePageContext(isOpen);
  const { ids } = useCompareSelection();

  const isTrayShowing = ids.length > 0;

  useEffect(() => {
    if (isOpen) hydrate();
  }, [isOpen, hydrate]);

  if (isOpen) {
    return (
      <ChatPanel
        chat={chat}
        context={context}
        label={label}
        onClose={() => setIsOpen(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label="Open the assistant"
      className={`fixed right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary text-white shadow-elevated transition-colors hover:bg-accent-hover ${
        isTrayShowing ? "bottom-32 sm:bottom-6" : "bottom-6"
      }`}
    >
      <MessageCircleIcon className="h-5 w-5" />
    </button>
  );
}
