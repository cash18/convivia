"use client";

import { AddExpenseForm } from "@/components/AddExpenseForm";
import { useI18n } from "@/components/I18nProvider";
import { createExpenseFromShoppingList } from "@/lib/actions/expenses";
import {
  addListItem,
  deleteListItem,
  deleteShoppingList,
  reopenShoppingList,
  toggleListItem,
  updateShoppingList,
  updateShoppingListItem,
} from "@/lib/actions/lists";
import { formatMessage } from "@/lib/i18n/format-message";
import { intlLocaleTag } from "@/lib/i18n/intl-locale";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  done: boolean;
};

type Member = { id: string; name: string };

export function ShoppingListCard({
  houseId,
  listId,
  name,
  items,
  members,
  completedAt,
}: {
  houseId: string;
  listId: string;
  name: string;
  items: Item[];
  members: Member[];
  completedAt?: string | null;
}) {
  const { t, locale } = useI18n();
  const intlTag = intlLocaleTag(locale);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [reopenPending, setReopenPending] = useState(false);

  const doneItems = useMemo(() => items.filter((i) => i.done), [items]);
  const expenseNotesDefault = useMemo(() => {
    const intro = formatMessage(t("listsPage.expenseNotesListIntro"), { name });
    const lines = doneItems.map((i) => `· ${i.name}`).join("\n");
    return lines ? `${intro}\n${lines}` : intro;
  }, [doneItems, name, t]);

  async function onReopenList() {
    setError(null);
    setReopenPending(true);
    const res = await reopenShoppingList(houseId, listId);
    setReopenPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function onAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const input = e.currentTarget.elements.namedItem("item") as HTMLInputElement;
    const res = await addListItem(houseId, listId, input.value);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function onToggle(itemId: string, done: boolean) {
    setError(null);
    const res = await toggleListItem(houseId, itemId, done);
    if (res.error) setError(res.error);
    router.refresh();
  }

  async function onDeleteItem(itemId: string) {
    setError(null);
    const res = await deleteListItem(houseId, itemId);
    if (res.error) setError(res.error);
    router.refresh();
  }

  async function onRenameList(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const input = e.currentTarget.elements.namedItem("listName") as HTMLInputElement;
    const res = await updateShoppingList(houseId, listId, input.value);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRenameOpen(false);
    router.refresh();
  }

  async function onDeleteList() {
    if (!confirm(formatMessage(t("listsPage.deleteListConfirm"), { name }))) return;
    setError(null);
    const res = await deleteShoppingList(houseId, listId);
    if (res.error) setError(res.error);
    router.refresh();
  }

  async function onSaveItemName(itemId: string, raw: string) {
    setError(null);
    const res = await updateShoppingListItem(houseId, itemId, raw);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  if (completedAt) {
    return (
      <div className="cv-card-solid flex flex-col gap-3 p-5 sm:p-6 opacity-[0.98]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">{name}</h3>
          <span className="rounded-full bg-slate-200/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {t("listsPage.completedBadge")}
          </span>
        </div>
        <p className="text-xs text-slate-600">
          {formatMessage(t("listsPage.completedOn"), {
            date: new Date(completedAt).toLocaleDateString(intlTag, { dateStyle: "medium" }),
          })}
        </p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          disabled={reopenPending}
          onClick={() => void onReopenList()}
          className="cv-btn-outline w-fit px-4 py-2 text-sm disabled:opacity-60"
        >
          {reopenPending ? t("listsPage.creating") : t("listsPage.reopenList")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="cv-card-solid flex flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {renameOpen ? (
            <form onSubmit={onRenameList} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <input
                name="listName"
                required
                defaultValue={name}
                className="cv-input-sm min-w-0 flex-1"
              />
              <button type="submit" className="cv-btn-primary shrink-0 px-3 py-1.5 text-xs">
                {t("listsPage.save")}
              </button>
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
              >
                {t("listsPage.cancel")}
              </button>
            </form>
          ) : (
            <h3 className="min-w-0 flex-1 text-base font-bold text-slate-900">{name}</h3>
          )}
          {!renameOpen ? (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setRenameOpen(true)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                {t("listsPage.rename")}
              </button>
              <button
                type="button"
                onClick={() => void onDeleteList()}
                className="text-xs font-medium text-red-600 hover:text-red-800"
              >
                {t("listsPage.deleteList")}
              </button>
            </div>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <form onSubmit={onAddItem} className="mt-3 flex gap-2">
          <input
            name="item"
            required
            placeholder={t("listsPage.addItemPlaceholder")}
            className="cv-input-sm flex-1"
          />
          <button type="submit" disabled={pending} className="cv-btn-primary shrink-0 px-4 py-2 text-sm">
            {t("listsPage.add")}
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {items.length === 0 ? (
            <li className="text-sm text-slate-500">{t("listsPage.listEmpty")}</li>
          ) : (
            items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm shadow-sm backdrop-blur-sm"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    id={`item-done-${it.id}`}
                    type="checkbox"
                    checked={it.done}
                    onChange={(e) => onToggle(it.id, e.target.checked)}
                    className="shrink-0 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    aria-label={it.done ? t("listsPage.markTodoAria") : t("listsPage.markDoneAria")}
                  />
                  {editingId === it.id ? (
                    <ItemNameEditor
                      initial={it.name}
                      onSave={(v) => void onSaveItemName(it.id, v)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <label
                      htmlFor={`item-done-${it.id}`}
                      className={`min-w-0 flex-1 cursor-pointer ${it.done ? "text-slate-400 line-through" : "text-slate-900"}`}
                    >
                      {it.name}
                    </label>
                  )}
                </div>
                {editingId !== it.id ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(it.id)}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                    >
                      {t("listsPage.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(it.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      {t("listsPage.removeItem")}
                    </button>
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
        {doneItems.length > 0 ? (
          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <p className="text-xs leading-relaxed text-slate-600">{t("listsPage.createExpenseFromCheckedHint")}</p>
            <button
              type="button"
              className="cv-btn-primary mt-3 text-sm"
              onClick={() => setExpenseOpen(true)}
            >
              {t("listsPage.createExpenseFromChecked")}
            </button>
          </div>
        ) : null}
      </div>
      {expenseOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`list-expense-${listId}`}
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <h2 id={`list-expense-${listId}`} className="text-base font-bold text-slate-900">
                {t("listsPage.modalExpenseTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setExpenseOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                {t("common.close")}
              </button>
            </div>
            <AddExpenseForm
              key={`${listId}-${doneItems.map((i) => i.id).join("-")}`}
              houseId={houseId}
              members={members}
              variant="full"
              defaultTitle={name}
              defaultNotes={expenseNotesDefault}
              shoppingListMeta={{ listId, itemIds: doneItems.map((i) => i.id) }}
              expenseAction={createExpenseFromShoppingList}
              onSuccess={() => {
                setExpenseOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function ItemNameEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [val, setVal] = useState(initial);
  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="cv-input-sm min-w-0 flex-1 py-1 text-sm"
        autoFocus
      />
      <button type="button" onClick={() => onSave(val)} className="text-xs font-medium text-emerald-700">
        {t("listsPage.ok")}
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-slate-500">
        {t("listsPage.cancel")}
      </button>
    </span>
  );
}
