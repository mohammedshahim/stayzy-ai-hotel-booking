"use client";

import { useState } from "react";
import { CheckIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVATAR_SEEDS, avatarUrlForSeed } from "@/features/profile/constants";

type Props = {
  name: string;
  avatarUrl: string | null | undefined;
};

export function AvatarNamePanel({ name: initialName, avatarUrl }: Props) {
  const [name, setName] = useState(initialName);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(avatarUrl ?? null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  async function handleSelectAvatar(seed: string) {
    const url = avatarUrlForSeed(seed);
    if (url === selectedAvatarUrl) return;
    setIsSavingAvatar(true);
    const { error } = await authClient.updateUser({ avatarUrl: url });
    setIsSavingAvatar(false);
    if (!error) setSelectedAvatarUrl(url);
  }

  async function handleSaveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingName(true);
    setNameSaved(false);
    const { error } = await authClient.updateUser({ name });
    setIsSavingName(false);
    if (!error) setNameSaved(true);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-surface">
      <div className="border-b border-border-default px-5 py-4">
        <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
      </div>
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <Label>Avatar</Label>
          <div className="flex flex-wrap gap-3">
            {AVATAR_SEEDS.map((seed) => {
              const url = avatarUrlForSeed(seed);
              const isSelected = url === selectedAvatarUrl;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => handleSelectAvatar(seed)}
                  disabled={isSavingAvatar}
                  aria-label={`Use ${seed} avatar`}
                  aria-pressed={isSelected}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 transition-colors disabled:opacity-60 ${
                    isSelected ? "border-accent-primary" : "border-border-default hover:border-border-subtle"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- DiceBear-hosted SVG, no next/image domain configured */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {isSelected && (
                    <span className="absolute right-0 bottom-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary text-white">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSaveName} className="flex flex-col gap-1.5">
          <Label htmlFor="name">Display name</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameSaved(false);
              }}
              required
              className="h-10 rounded-xl border-border-default bg-subtle px-3 text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-accent-border"
            />
            <Button
              type="submit"
              disabled={isSavingName || name === initialName}
              className="h-10 shrink-0 rounded-xl bg-accent-primary px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-70"
            >
              {isSavingName ? "Saving..." : "Save"}
            </Button>
          </div>
          {nameSaved && <p className="text-xs text-success">Name updated.</p>}
        </form>
      </div>
    </div>
  );
}
