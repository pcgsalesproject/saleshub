"use client";

import { useFormStatus } from "react-dom";

interface Props {
  label: string;
  pendingLabel?: string;
  disabled?: boolean;
}

export default function SubmitButton({ label, pendingLabel, disabled }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {pending ? (pendingLabel ?? "Saving…") : label}
    </button>
  );
}
