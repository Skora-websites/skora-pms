"use client";

import { useActionState, useRef } from "react";
import { Camera } from "lucide-react";
import { uploadProfilePhoto } from "./actions";
import { initials } from "@/lib/utils";

const initialState = { error: null as string | null };

export function PhotoUpload({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(uploadProfilePhoto, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <form action={formAction}>
        <input
          ref={inputRef}
          type="file"
          name="photo"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) e.target.form?.requestSubmit();
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          title="Change photo"
          className="group relative block h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-brand-700 to-accent-600 shadow-lg"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-white">
              {initials(name)}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5" />
          </span>
        </button>
      </form>
      {state.error && (
        <p className="absolute left-0 top-full mt-1 w-48 text-xs text-red-600">{state.error}</p>
      )}
    </div>
  );
}