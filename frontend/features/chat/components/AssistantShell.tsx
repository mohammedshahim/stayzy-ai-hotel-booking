"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { MenuIcon, SparklesIcon } from "lucide-react";

import { useSearchCatalogs } from "@/features/search/hooks/useSearchCatalogs";
import { ChatComposer } from "@/features/chat/components/ChatComposer";
import { ChatThread } from "@/features/chat/components/ChatThread";
import { SessionList } from "@/features/chat/components/SessionList";
import { useAssistantStream } from "@/features/chat/hooks/useAssistantStream";

const PROMPTS = [
  "Find me a 4-star hotel in Paris under $300",
  "Show me my bookings",
  "Which hotels have I saved?",
];

const WELCOME =
  "I can search hotels, compare them, and book, cancel or review on your behalf — I'll always ask before anything is confirmed.";

const BUBBLE_WIDTHS = ["w-2/3", "w-1/2", "w-3/4", "w-2/5"];

function ThreadSkeleton() {
  return (
    <div className="flex-1 p-4">
      <div className="mx-auto w-full max-w-3xl space-y-3">
        {BUBBLE_WIDTHS.map((width, index) => (
          <div
            key={width}
            className={`h-10 animate-pulse rounded-2xl bg-subtle ${width} ${
              index % 2 === 1 ? "ml-auto" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function AssistantShell() {
  const chat = useAssistantStream();
  const catalogs = useSearchCatalogs();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { hydrate } = chat;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isPaused = chat.pending !== null;

  function handleOpen(id: string) {
    setIsDrawerOpen(false);
    chat.openSession(id);
  }

  function handleNewChat() {
    setIsDrawerOpen(false);
    chat.newChat();
  }

  const list = (
    <SessionList
      sessions={chat.sessions}
      activeId={chat.sessionId}
      onOpen={handleOpen}
      onNewChat={handleNewChat}
    />
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-border-default">
        {list}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen} swipeDirection="left">
          <header className="flex items-center gap-2 border-b border-border-default px-4 py-3">
            <Drawer.Trigger
              aria-label="Show your chats"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary lg:hidden"
            >
              <MenuIcon className="h-4 w-4" />
            </Drawer.Trigger>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent-text">
              <SparklesIcon className="h-3.5 w-3.5" />
            </span>
            <p className="text-sm font-medium text-text-primary">Assistant</p>
          </header>

          <Drawer.Portal>
            <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
            <Drawer.Viewport className="fixed inset-0 z-50 flex items-stretch justify-start">
              <Drawer.Popup className="h-full w-72 max-w-[85vw] border-r border-border-default bg-surface outline-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [transform:translateX(var(--drawer-swipe-movement-x))] data-ending-style:[transform:translateX(-100%)] data-starting-style:[transform:translateX(-100%)]">
                <Drawer.Title className="sr-only">Your chats</Drawer.Title>
                {list}
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>

        {chat.isLoading ? (
          <ThreadSkeleton />
        ) : (
          <ChatThread
            messages={chat.messages}
            reply={chat.reply}
            replyActions={chat.replyActions}
            activeTool={chat.activeTool}
            isStreaming={chat.isStreaming}
            error={chat.error}
            catalogs={catalogs}
            welcome={WELCOME}
            prompts={PROMPTS}
            pending={chat.pending}
            isDeciding={chat.isDeciding}
            onDecide={chat.decide}
            onRetry={chat.retry}
            onSuggestion={chat.send}
          />
        )}

        <ChatComposer
          isStreaming={chat.isStreaming || isPaused}
          placeholder={isPaused ? "Answer the confirmation above to continue" : "Ask about hotels…"}
          className="p-4"
          onSend={chat.send}
        />
      </div>
    </div>
  );
}
