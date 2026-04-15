"use client";

import { useI18n } from "@/components/I18nProvider";
import { createTask } from "@/lib/actions/tasks";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = { id: string; name: string };

export function AddTaskForm({ houseId, members }: { houseId: string; members: Member[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dueHasValue, setDueHasValue] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await createTask(houseId, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    form.reset();
    setDueHasValue(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="cv-card-solid flex flex-col gap-3 p-5 sm:p-6">
      <h2 className="text-sm font-bold text-slate-900">{t("tasksForm.title")}</h2>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      <input
        name="title"
        required
        placeholder={t("tasksForm.titlePlaceholder")}
        className="cv-input-sm"
      />
      <textarea
        name="description"
        placeholder={t("tasksForm.descriptionPlaceholder")}
        rows={2}
        className="cv-input-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="assigneeId" className="cv-input-sm">
          <option value="">{t("tasksForm.assigneeNone")}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          name="dueDate"
          type="datetime-local"
          className="cv-input-sm"
          onChange={(e) => setDueHasValue(Boolean(e.target.value.trim()))}
        />
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          name="syncCalendar"
          disabled={!dueHasValue}
          className="mt-1 rounded border-slate-300 text-emerald-600 disabled:opacity-40"
        />
        <span>
          <span className="font-semibold">{t("tasksForm.syncCalendarLabel")}</span>
          <span className="mt-0.5 block text-xs font-normal text-slate-600">{t("tasksForm.syncCalendarHint")}</span>
        </span>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
        {t("tasksForm.durationLabel")}
        <select name="durationMinutes" className="cv-input-sm" disabled={!dueHasValue}>
          <option value="">{t("tasksForm.durationNone")}</option>
          <option value="15">{t("tasksForm.duration15")}</option>
          <option value="30">{t("tasksForm.duration30")}</option>
          <option value="60">{t("tasksForm.duration60")}</option>
          <option value="120">{t("tasksForm.duration120")}</option>
          <option value="240">{t("tasksForm.durationHalfDay")}</option>
          <option value="480">{t("tasksForm.durationFullDay")}</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="cv-btn-primary"
      >
        {pending ? t("tasksForm.submitting") : t("tasksForm.submit")}
      </button>
    </form>
  );
}
