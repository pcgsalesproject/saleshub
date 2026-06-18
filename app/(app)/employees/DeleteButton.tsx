"use client";

import { useTransition } from "react";
import { deleteEmployee } from "@/lib/actions/employees";

export default function DeleteButton({ id, name }: { id: number; name: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteEmployee(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6h14z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
