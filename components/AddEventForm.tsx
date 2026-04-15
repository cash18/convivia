"use client";

import { useI18n } from "@/components/I18nProvider";
import { createCalendarEvent } from "@/lib/actions/calendar";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function dayKeyToDatetimeLocal(dayKey: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return null;
  return `${dayKey}T12:00`;
}

type Member = { id: string; name: string };

export function AddEventForm({
  houseId,
  defaultDayKey,
  members,
}: {
  houseId: string;
  defaultDayKey?: string | null;
  members: Member[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startsRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const dayKeyForForm = useMemo(() => {
    const u = searchParams.get("day");
    if (u && /^\d{4}-\d{2}-\d{2}$/.test(u)) return u;
    if (defaultDayKey && /^\d{4}-\d{2}-\d{2}$/.test(defaultDayKey)) return defaultDayKey;
    return null;
  }, [searchParams, defaultDayKey]);

  useEffect(() => {
    const el = startsRef.current;
    const v = dayKeyForForm ? dayKeyToDatetimeLocal(dayKeyForForm) : null;
    if (el && v) el.value = v;
  }, [dayKeyForForm]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await createCalendarEvent(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form id="nuovo-evento" onSubmit={onSubmit} className="cv-card-solid flex scroll-mt-24 flex-col gap-3 p-5 sm:p-6">
      <h2 className="text-sm font-bold text-slate-900">{t("calendarForm.title")}</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder={t("calendarForm.titlePlaceholder")}
        className="cv-input-sm"
      />
      <textarea
        name="description"
        placeholder={t("calendarForm.descriptionPlaceholder")}
        rows={2}
        className="cv-input-sm"
      />
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name="allDay" className="rounded border-emerald-300 text-emerald-600" />
        {t("calendarForm.allDay")}
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          {t("calendarForm.startsAt")}
          <input
            ref={startsRef}
            name="startsAt"
            required
            type="datetime-local"
            className="cv-input-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          {t("calendarForm.endsAt")}
          <input name="endsAt" type="datetime-local" className="cv-input-sm" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
        {t("calendarForm.recurrenceLabel")}
        <select name="recurrencePreset" className="cv-input-sm" defaultValue="">
          <option value="">{t("calendarForm.recurrenceNone")}</option>
          <option value="daily">{t("calendarForm.recurrenceDaily")}</option>
          <option value="weekly">{t("calendarForm.recurrenceWeekly")}</option>
          <option value="biweekly">{t("calendarForm.recurrenceBiweekly")}</option>
          <option value="monthly">{t("calendarForm.recurrenceMonthly")}</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
        {t("calendarForm.recurrenceUntilLabel")}
        <input name="recurrenceUntil" type="date" className="cv-input-sm" />
      </label>
      <p className="text-[11px] leading-snug text-slate-500">{t("calendarForm.recurrenceUntilHint")}</p>

      {members.length > 0 ? (
        <fieldset className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2.5">
          <legend className="px-1 text-xs font-semibold text-slate-700">{t("calendarForm.participantsLabel")}</legend>
          <p className="mb-2 text-[11px] leading-snug text-slate-600">{t("calendarForm.participantsHint")}</p>
          <ul className="flex max-h-36 flex-col gap-1.5 overflow-y-auto sm:max-h-48">
            {members.map((m) => (
              <li key={m.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-slate-800 hover:bg-white/80">
                  <input type="checkbox" name="participantIds" value={m.id} className="rounded border-emerald-300 text-emerald-600" />
                  <span className="min-w-0 truncate">{m.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="cv-btn-primary"
      >
        {pending ? t("calendarForm.submitting") : t("calendarForm.submit")}
      </button>
    </form>
  );
}
