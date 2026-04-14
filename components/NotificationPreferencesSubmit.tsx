"use client";

import { useI18n } from "@/components/I18nProvider";
import { useFormStatus } from "react-dom";

function SubmitInner() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cv-btn-primary self-start px-6 py-2.5 text-sm disabled:opacity-60"
    >
      {pending ? t("settings.saving") : t("settings.savePrefs")}
    </button>
  );
}

export function NotificationPreferencesSubmit() {
  return <SubmitInner />;
}
