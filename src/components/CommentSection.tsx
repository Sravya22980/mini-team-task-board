"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";
import { Paperclip, Pencil, Trash2, Check, X, FileText } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function CommentSection({
  cardId,
  currentUserId,
}: {
  cardId: string;
  currentUserId: string;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadComments() {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("id, card_id, user_id, content, file_url, file_name, created_at, updated_at, profiles:user_id(name)")
      .eq("card_id", cardId)
      .order("created_at", { ascending: true });
    setComments((data as unknown as Comment[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  async function handlePost() {
    if (!text.trim() && !file) return;
    setPosting(true);
    setError(null);

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const path = `${cardId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("card-attachments")
        .upload(path, file);

      if (uploadError) {
        setPosting(false);
        setError("Couldn't upload file.");
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("card-attachments")
        .getPublicUrl(path);
      fileUrl = publicUrlData.publicUrl;
      fileName = file.name;
    }

    const { error: insertError } = await supabase.from("comments").insert({
      card_id: cardId,
      user_id: currentUserId,
      content: text.trim(),
      file_url: fileUrl,
      file_name: fileName,
    });

    setPosting(false);

    if (insertError) {
      setError("Couldn't post comment.");
      return;
    }

    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadComments();
  }

  async function handleSaveEdit(id: string) {
    const trimmed = editText.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("comments")
      .update({ content: trimmed, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, content: trimmed } : c))
      );
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("comments").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="mt-2">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">Comments</h3>

      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400">No comments yet.</p>
        ) : (
          comments.map((c) => {
            const isAuthor = c.user_id === currentUserId;
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className="rounded-lg border border-gray-100 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700">
                      {c.profiles?.name ?? "Someone"}{" "}
                      <span className="font-normal text-gray-400">
                        · {timeAgo(c.created_at)}
                      </span>
                    </p>

                    {isEditing ? (
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(c.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleSaveEdit(c.id)}
                          className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"
                          aria-label="Save comment"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-50"
                          aria-label="Cancel edit"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {c.content && (
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-800">
                            {c.content}
                          </p>
                        )}
                        {c.file_url && (
                          <a
                            href={c.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {c.file_name ?? "Attachment"}
                          </a>
                        )}
                      </>
                    )}
                  </div>

                  {isAuthor && !isEditing && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setEditText(c.content);
                        }}
                        aria-label="Edit comment"
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-indigo-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        aria-label="Delete comment"
                        className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 rounded-lg border border-gray-200 p-2">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="w-full resize-none border-0 p-0 text-sm focus:outline-none focus:ring-0"
        />
        {file && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
            <Paperclip className="h-3.5 w-3.5" />
            {file.name}
            <button
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-gray-400 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <EmojiPicker onSelect={(emoji) => setText((t) => t + emoji)} />
          </div>
          <button
            onClick={handlePost}
            disabled={posting || (!text.trim() && !file)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}