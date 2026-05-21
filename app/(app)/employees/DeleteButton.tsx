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
      className="rounded px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
