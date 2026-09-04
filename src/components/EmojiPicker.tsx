"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "😅", "😊", "😍", "🤔", "😎", "😢",
  "😮", "🙌", "👍", "👎", "🙏", "👏", "🔥", "🎉",
  "✅", "❌", "⚠️", "💡", "🚀", "🐛", "📌", "❤️",
];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Add emoji"
        aria-expanded={open}
        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
      >
        <Smile className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2 grid w-56 grid-cols-8 gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="rounded-md p-1 text-lg hover:bg-gray-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}