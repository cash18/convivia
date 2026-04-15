"use client";

import { createHouseChore } from "@/lib/actions/house-chores";
import { useI18n } from "@/components/I18nProvider";
import { addDaysToDateKey } from "@/lib/calendar-all-day";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type Member = { id: string; name: string };

export function AddHouseChoreForm({
  houseId,
  members,
  embedded = false,
}: {
  houseId: string;
  members: Member[];
  embedded?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => members.slice(0, Math.min(2, members.length)).map((m) => m.id));

  const nameById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m.name])), [members]);

  const toggleMember = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        return next.length >= 2 ? next : prev;
      }
      return [...prev, id];
    });
  }, []);

  const move = useCallback((index: number, dir: -1 | 1) => {
    setSelectedIds((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[index]!;
      next[index] = next[j]!;
      next[j] = tmp;
      return next;
    });
  }, []);

  const rotationOrder = selectedIds.join(",");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("rotationOrder", rotationOrder);
    startTransition(async () => {
      const res = await createHouseChore(houseId, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      e.currentTarget.reset();
      setSelectedIds(members.slice(0, Math.min(2, members.length)).map((m) => m.id));
      const d = new Date();
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      const nextAnchor = `${y}-${mo}-${da}`;
      setAnchorKey(nextAnchor);
      setRecurrenceEndKey(addDaysToDateKey(nextAnchor, 365));
      router.refresh();
    });
  }

  const defaultAnchor = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }, []);

  const [anchorKey, setAnchorKey] = useState(defaultAnchor);
  const maxEndKey = useMemo(() => addDaysToDateKey(anchorKey, 365), [anchorKey]);
  const [recurrenceEndKey, setRecurrenceEndKey] = useState(() => addDaysToDateKey(defaultAnchor, 365));

  useEffect(() => {
    setRecurrenceEndKey((prev) => {
      if (prev < anchorKey) return anchorKey;
      if (prev > maxEndKey) return maxEndKey;
      return prev;
    });
  }, [anchorKey, maxEndKey]);

  const outer = embedded ? "pt-1" : "cv-card-solid p-4 sm:p-5";

  return (
    <div className={outer}>
      <h2 className={embedded ? "sr-only" : "text-sm font-bold text-slate-900"}>{t("houseChores.formTitle")}</h2>
      {!embedded ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{t("houseChores.formIntro")}</p> : null}

      <form className={embedded ? "mt-3 space-y-4" : "mt-4 space-y-4"} onSubmit={onSubmit}>
        <div>
          <label className="block text-xs font-semibold text-slate-700" htmlFor="hc-title">
            {t("houseChores.fieldTitle")}
          </label>
          <input
            id="hc-title"
            name="title"
            required
            className="cv-input mt-1 w-full"
            placeholder={t("houseChores.titlePlaceholder")}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700" htmlFor="hc-desc">
            {t("houseChores.fieldDescription")}
          </label>
          <textarea
            id="hc-desc"
            name="description"
            rows={2}
            className="cv-input mt-1 w-full resize-y"
            placeholder={t("houseChores.descriptionPlaceholder")}
          />
        </div>

        <details className="group rounded-xl border border-slate-200/80 bg-slate-50/50 open:bg-slate-50/80">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-slate-600 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              <span>{t("houseChores.formDatesSummary")}</span>
              <span className="text-slate-400 transition-transform group-open:rotate-90">›</span>
            </span>
          </summary>
          <div className="grid gap-4 border-t border-slate-200/60 px-3 pb-3 pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700" htmlFor="hc-every">
                {t("houseChores.fieldEveryDays")}
              </label>
              <select id="hc-every" name="everyDays" className="cv-input mt-1 w-full" defaultValue="7">
                <option value="1">{t("houseChores.everyOption1")}</option>
                <option value="2">{t("houseChores.everyOption2")}</option>
                <option value="3">{t("houseChores.everyOption3")}</option>
                <option value="7">{t("houseChores.everyOption7")}</option>
                <option value="14">{t("houseChores.everyOption14")}</option>
                <option value="30">{t("houseChores.everyOption30")}</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">{t("houseChores.everyHint")}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700" htmlFor="hc-anchor">
                {t("houseChores.fieldAnchor")}
              </label>
              <input
                id="hc-anchor"
                name="anchorDate"
                type="date"
                required
                value={anchorKey}
                onChange={(e) => setAnchorKey(e.target.value)}
                className="cv-input mt-1 w-full"
              />
              <p className="mt-1 text-[11px] text-slate-500">{t("houseChores.anchorHint")}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700" htmlFor="hc-rec-until">
                {t("houseChores.fieldRecurrenceEnd")}
              </label>
              <input
                id="hc-rec-until"
                name="recurrenceEndDate"
                type="date"
                required
                value={recurrenceEndKey}
                min={anchorKey}
                max={maxEndKey}
                onChange={(e) => setRecurrenceEndKey(e.target.value)}
                className="cv-input mt-1 w-full"
              />
              <p className="mt-1 text-[11px] text-slate-500">{t("houseChores.recurrenceEndHint")}</p>
            </div>
          </div>
        </details>

        <div>
          <p className="text-xs font-semibold text-slate-700">{t("houseChores.fieldRotation")}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{t("houseChores.rotationHint")}</p>
          <ul className="mt-2 space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  {m.name}
                </label>
              </li>
            ))}
          </ul>
          {selectedIds.length >= 2 ? (
            <ol className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2 text-sm">
              {selectedIds.map((id, i) => (
                <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-white/90 px-2 py-1.5">
                  <span className="min-w-0 truncate">
                    <span className="tabular-nums text-slate-400">{i + 1}.</span> {nameById[id]}
                  </span>
                  <span className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      aria-label={t("houseChores.moveUp")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      disabled={i === selectedIds.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label={t("houseChores.moveDown")}
                    >
                      ↓
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-xs font-medium text-amber-800">{t("houseChores.pickAtLeastTwo")}</p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
          <input type="checkbox" name="syncCalendar" defaultChecked className="mt-1 rounded border-slate-300 text-emerald-600" />
          <span>
            <span className="font-semibold">{t("houseChores.syncCalendarLabel")}</span>
            <span className="mt-0.5 block text-xs font-normal text-slate-600">{t("houseChores.syncCalendarHint")}</span>
          </span>
        </label>

        <input type="hidden" name="rotationOrder" value={rotationOrder} readOnly />

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button type="submit" disabled={pending || selectedIds.length < 2} className="cv-btn-primary w-full sm:w-auto">
          {pending ? t("houseChores.submitting") : t("houseChores.submit")}
        </button>
      </form>
    </div>
  );
}
