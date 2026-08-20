"use client";

import { useActionState, useEffect, useState } from "react";
import { Link2, Play, Plus, ShieldCheck, Trash2, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteSupportVideo, storeSupportVideo } from "../actions";

const initialState = { error: null as string | null };

type VideoRow = {
  id: number;
  title: string;
  description: string | null;
  videoType: string;
  videoUrl: string | null;
  videoPath: string | null;
  createdAt: string | null;
};

function VideoForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(storeSupportVideo, initialState);
  const [videoType, setVideoType] = useState<"upload" | "youtube">("youtube");
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onDone}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">Add support video</h2>
          <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <div>
            <label htmlFor="video_title" className="label">Title</label>
            <input id="video_title" name="title" required maxLength={255} className="input" placeholder="e.g. How to book an appointment" />
          </div>
          <div>
            <label htmlFor="video_desc" className="label">Description</label>
            <textarea id="video_desc" name="description" rows={2} className="input" />
          </div>
          <div>
            <label className="label">Video source</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVideoType("youtube")}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  videoType === "youtube"
                    ? "border-brand-300 bg-brand-50 text-brand-800"
                    : "border-slate-200 text-slate-500 hover:border-brand-200"
                }`}
              >
                <YoutubeLink /> YouTube link
              </button>
              <button
                type="button"
                onClick={() => setVideoType("upload")}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  videoType === "upload"
                    ? "border-brand-300 bg-brand-50 text-brand-800"
                    : "border-slate-200 text-slate-500 hover:border-brand-200"
                }`}
              >
                <UploadFileIcon /> Upload file
              </button>
            </div>
          </div>
          <input type="hidden" name="video_type" value={videoType} />
          {videoType === "youtube" ? (
            <div>
              <label htmlFor="video_url" className="label">YouTube URL</label>
              <input id="video_url" name="video_url" type="url" maxLength={255} className="input" placeholder="https://www.youtube.com/watch?v=…" />
            </div>
          ) : (
            <div>
              <label htmlFor="video_file" className="label">Video file (MP4, WEBM, MOV — under 200 MB)</label>
              <input id="video_file" name="video_file" type="file" accept="video/mp4,video/webm,video/quicktime,.m4v" className="input" />
            </div>
          )}

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Saving…" : "Add video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadFileIcon() {
  return <Video className="mr-1.5 inline h-4 w-4" />;
}

function YoutubeLink() {
  return <Link2 className="mr-1.5 inline h-4 w-4" />;
}

export function SupportVideosPanel({ videos }: { videos: VideoRow[] }) {
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function handleDelete(video: VideoRow) {
    if (confirmDelete !== video.id) {
      setConfirmDelete(video.id);
      return;
    }
    setConfirmDelete(null);
    const res = await deleteSupportVideo(video.id);
    if (res.error) setMsg({ type: "err", text: res.error });
    else {
      setMsg({ type: "ok", text: `Video "${video.title}" deleted.` });
      router.refresh();
    }
  }

  return (
    <div className="card mt-8 p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
          <Play className="h-4.5 w-4.5" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-base font-bold text-slate-900">Support videos</h2>
          <p className="text-xs text-slate-500">How-to videos shown to doctors and staff in the help centre.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="btn-ghost">
          <Plus className="h-4 w-4" /> Add video
        </button>
      </div>

      {msg && (
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            msg.type === "ok" ? "border-accent-200 bg-accent-50 text-accent-800" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      {videos.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No videos yet.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {videos.map((v) => (
            <div key={v.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{v.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {v.videoType === "youtube" ? "YouTube" : "Uploaded"}
                    {v.videoType === "youtube" && v.videoUrl ? ` · ${v.videoUrl}` : ""}
                  </p>
                  {v.description && <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{v.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(v)}
                  className={`shrink-0 rounded-lg border p-2 transition-colors ${
                    confirmDelete === v.id
                      ? "border-red-300 bg-red-600 text-white"
                      : "border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                  aria-label={confirmDelete === v.id ? `Confirm delete ${v.title}` : `Delete ${v.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <VideoForm onDone={() => setAdding(false)} />}
    </div>
  );
}