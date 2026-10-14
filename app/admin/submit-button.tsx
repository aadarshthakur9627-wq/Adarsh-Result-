"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, pendingLabel }: { children: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-live="polite">
      {pending ? (
        <span className="submit-pending">
          <span className="submit-spinner" aria-hidden="true" />
          {pendingLabel}
        </span>
      ) : children}
    </button>
  );
}
