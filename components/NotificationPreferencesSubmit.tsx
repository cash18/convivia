"use client";

import { useFormStatus } from "react-dom";

function SubmitInner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cv-btn-primary self-start px-6 py-2.5 text-sm disabled:opacity-60"
    >
      {pending ? "Salvataggio…" : "Salva preferenze"}
    </button>
  );
}

export function NotificationPreferencesSubmit() {
  return <SubmitInner />;
}
