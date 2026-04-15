"use client";

import { CreateHouseForm } from "@/components/CreateHouseForm";
import { JoinHouseForm } from "@/components/JoinHouseForm";
import { useI18n } from "@/components/I18nProvider";
import { useCallback, useId, useState } from "react";

type Step = "closed" | "choose" | "join" | "create";

export function CaseAddHousePanel() {
  const { t } = useI18n();
  const panelId = useId();
  const [step, setStep] = useState<Step>("closed");

  const openChoose = useCallback(() => setStep("choose"), []);
  const close = useCallback(() => setStep("closed"), []);

  return (
    <div className="w-full sm:w-auto sm:min-w-[20rem]">
      {step === "closed" ? (
        <button
          type="button"
          onClick={openChoose}
          className="cv-btn-primary w-full touch-manipulation shadow-md shadow-emerald-700/15 sm:w-auto"
        >
          {t("case.addHomeButton")}
        </button>
      ) : null}

      {step !== "closed" ? (
        <div
          id={panelId}
          className="mt-4 rounded-[1.75rem] border border-emerald-200/60 bg-white/95 p-4 shadow-lg shadow-emerald-900/5 backdrop-blur-md sm:p-5"
          role="region"
          aria-label={t("case.addHomePanelAria")}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-900">{t("case.addHomeSheetTitle")}</p>
            <button
              type="button"
              onClick={close}
              className="touch-manipulation rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              {t("case.addHomeClose")}
            </button>
          </div>

          {step === "choose" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep("join")}
                className="flex flex-col items-start gap-1 rounded-2xl border-2 border-slate-200/90 bg-slate-50/80 p-4 text-left transition hover:border-emerald-400/70 hover:bg-emerald-50/50 active:scale-[0.99]"
              >
                <span className="text-sm font-bold text-slate-900">{t("case.addHomeChoiceJoinTitle")}</span>
                <span className="text-xs leading-snug text-slate-600">{t("case.addHomeChoiceJoinDesc")}</span>
              </button>
              <button
                type="button"
                onClick={() => setStep("create")}
                className="flex flex-col items-start gap-1 rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-4 text-left transition hover:border-emerald-400 hover:from-emerald-50 hover:to-teal-50/80 active:scale-[0.99]"
              >
                <span className="text-sm font-bold text-emerald-950">{t("case.addHomeChoiceCreateTitle")}</span>
                <span className="text-xs leading-snug text-emerald-900/85">{t("case.addHomeChoiceCreateDesc")}</span>
              </button>
            </div>
          ) : null}

          {step === "join" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="text-xs font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
              >
                ← {t("case.addHomeBack")}
              </button>
              <JoinHouseForm embedded />
            </div>
          ) : null}

          {step === "create" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="text-xs font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
              >
                ← {t("case.addHomeBack")}
              </button>
              <CreateHouseForm embedded />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
