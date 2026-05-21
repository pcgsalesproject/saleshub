"use client";

import { useFormStatus } from "react-dom";

interface Props {
  label: string;
  pendingLabel?: string;
}

export default function SubmitButton({ label, pendingLabel }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#102E5A] px-5 py-2 text-sm font-medium text-white hover:bg-[#0b2145] disabled:opacity-60 transition-colors"
    >
      {pending ? (pendingLabel ?? "Saving…") : label}
    </button>
  );
}
