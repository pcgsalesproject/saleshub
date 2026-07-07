"use client";

import { useActionState } from "react";
import type { FormActionState } from "@/lib/actions/assets";

interface Props {
  action: (prevState: FormActionState | undefined, formData: FormData) => Promise<FormActionState>;
}

export default function ReturnAssetForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-2.5 py-1 ml-3 transition-colors disabled:opacity-50"
      >
        {pending ? "กำลังคืน…" : "คืน"}
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
