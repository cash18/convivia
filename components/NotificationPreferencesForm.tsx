"use client";

import { useI18n } from "@/components/I18nProvider";
import { savePushNotificationPreferences } from "@/lib/actions/push-preferences";
import { PUSH_NOTIFY_CATEGORIES, type PushNotifyCategory } from "@/lib/push-categories";
import { NotificationPreferencesSubmit } from "@/components/NotificationPreferencesSubmit";

type Props = {
  prefs: Record<PushNotifyCategory, boolean>;
};

export function NotificationPreferencesForm({ prefs }: Props) {
  const { t } = useI18n();

  return (
    <form action={savePushNotificationPreferences} className="flex flex-col gap-4">
      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200/90 bg-white">
        {PUSH_NOTIFY_CATEGORIES.map((cat) => (
          <li key={cat} className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{t(`pushCat.${cat}.label`)}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{t(`pushCat.${cat}.desc`)}</p>
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 sm:pt-0.5">
              <span className="text-xs font-medium text-slate-500">{t("settings.notifyCategory")}</span>
              <input
                type="checkbox"
                name={cat}
                value="1"
                defaultChecked={prefs[cat]}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </li>
        ))}
      </ul>
      <NotificationPreferencesSubmit />
    </form>
  );
}
