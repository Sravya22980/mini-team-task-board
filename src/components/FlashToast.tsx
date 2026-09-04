"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import {
  FLASH_DURATION_MS,
  FLASH_EVENT,
  FLASH_KEY,
  clearSuccessFlash,
} from "@/lib/flash";

export default function FlashToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function dismiss() {
      setMessage(null);
      clearSuccessFlash();
      if (timer) clearTimeout(timer);
    }

    function show(text: string, remaining = FLASH_DURATION_MS) {
      setMessage(text);
      if (timer) clearTimeout(timer);
      timer = setTimeout(dismiss, remaining);
    }

    try {
      const raw = sessionStorage.getItem(FLASH_KEY);
      if (raw) {
        const { message: stored, at } = JSON.parse(raw) as {
          message: string;
          at: number;
        };
        const remaining = FLASH_DURATION_MS - (Date.now() - at);
        if (stored && remaining > 0) {
          show(stored, remaining);
        } else {
          clearSuccessFlash();
        }
      }
    } catch {
      clearSuccessFlash();
    }

    function onFlash(event: Event) {
      const text = (event as CustomEvent<string>).detail;
      if (text) show(text);
    }

    window.addEventListener(FLASH_EVENT, onFlash);
    return () => {
      window.removeEventListener(FLASH_EVENT, onFlash);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed right-8 top-6 z-[60] flex justify-end">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-800">{message}</p>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            clearSuccessFlash();
          }}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}