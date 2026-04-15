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
import { InlineSpinner } from "@/components/InlineSpinner";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const [newItemName, setNewItemName] = useState("");
  /** Stato «fatto» ottimistico finché il server non conferma (props `items`). */
  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>({});
  const [toggleSyncing, setToggleSyncing] = useState<Record<string, boolean>>({});
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [renameListPending, setRenameListPending] = useState(false);
  const [deleteListPending, setDeleteListPending] = useState(false);

  useEffect(() => {
    setDoneOverrides((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const row = items.find((i) => i.id === id);
        if (row && row.done === next[id]) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items]);

  const doneItems = useMemo(
    () => items.filter((i) => (i.id in doneOverrides ? doneOverrides[i.id] : i.done)),
    [items, doneOverrides],
  );
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
    const raw = newItemName.trim();
    const res = await addListItem(houseId, listId, raw);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setNewItemName("");
    router.refresh();
  }

  async function onToggle(itemId: string, done: boolean) {
    setError(null);
    setDoneOverrides((p) => ({ ...p, [itemId]: done }));
    setToggleSyncing((p) => ({ ...p, [itemId]: true }));
    const res = await toggleListItem(houseId, itemId, done);
    setToggleSyncing((p) => {
      const n = { ...p };
      delete n[itemId];
      return n;
    });
    if (res.error) {
      setError(res.error);
      setDoneOverrides((p) => {
        const n = { ...p };
        delete n[itemId];
        return n;
      });
      return;
    }
    void router.refresh();
  }

  async function onDeleteItem(itemId: string) {
    setError(null);
    setDeletingItemId(itemId);
    const res = await deleteListItem(houseId, itemId);
    setDeletingItemId(null);
    if (res.error) setError(res.error);
    void router.refresh();
  }

  async function onRenameList(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setRenameListPending(true);
    const input = e.currentTarget.elements.namedItem("listName") as HTMLInputElement;
    const res = await updateShoppingList(houseId, listId, input.value);
    setRenameListPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRenameOpen(false);
    void router.refresh();
  }

  async function onDeleteList() {
    if (!confirm(formatMessage(t("listsPage.deleteListConfirm"), { name }))) return;
    setError(null);
    setDeleteListPending(true);
    const res = await deleteShoppingList(houseId, listId);
    setDeleteListPending(false);
    if (res.error) setError(res.error);
    void router.refresh();
  }

  async function onSaveItemName(itemId: string, raw: string) {
    setError(null);
    const res = await updateShoppingListItem(houseId, itemId, raw);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditingId(null);
    void router.refresh();
  }

  const headerActionsDisabled = renameListPending || deleteListPending || reopenPending;

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
          className="cv-btn-outline inline-flex w-fit items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
        >
          {reopenPending ? <InlineSpinner className="h-3.5 w-3.5 border-emerald-700/40" /> : null}
          {reopenPending ? t("common.loading") : t("listsPage.reopenList")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="cv-card-solid flex flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {renameOpen ? (
            <form onSubmit={(e) => void onRenameList(e)} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <input
                name="listName"
                required
                defaultValue={name}
                disabled={renameListPending}
                className="cv-input-sm min-w-0 flex-1 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={renameListPending}
                className="cv-btn-primary inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-60"
              >
                {renameListPending ? <InlineSpinner className="h-3 w-3 border-white/80" /> : null}
                {renameListPending ? t("listsPage.savingListName") : t("listsPage.save")}
              </button>
              <button
                type="button"
                disabled={renameListPending}
                onClick={() => setRenameOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50"
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
                disabled={headerActionsDisabled}
                onClick={() => setRenameOpen(true)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
              >
                {t("listsPage.rename")}
              </button>
              <button
                type="button"
                disabled={headerActionsDisabled}
                onClick={() => void onDeleteList()}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 disabled:pointer-events-none disabled:opacity-40"
              >
                {deleteListPending ? <InlineSpinner className="h-3 w-3 border-red-500/50" /> : null}
                {t("listsPage.deleteList")}
              </button>
            </div>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <form onSubmit={(e) => void onAddItem(e)} className="mt-3 flex gap-2">
          <input
            name="item"
            required
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            disabled={pending}
            placeholder={t("listsPage.addItemPlaceholder")}
            className="cv-input-sm flex-1 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending}
            className="cv-btn-primary inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
          >
            {pending ? <InlineSpinner className="h-3.5 w-3.5 border-white/80" /> : null}
            {pending ? t("listsPage.addingItem") : t("listsPage.add")}
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {items.length === 0 ? (
            <li className="text-sm text-slate-500">{t("listsPage.listEmpty")}</li>
          ) : (
            items.map((it) => {
              const checked = it.id in doneOverrides ? doneOverrides[it.id] : it.done;
              const rowToggleBusy = !!toggleSyncing[it.id];
              const rowDeleteBusy = deletingItemId === it.id;
              const rowBusy = rowToggleBusy || rowDeleteBusy;
              return (
              <li
                key={it.id}
                aria-busy={rowBusy}
                className={`flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm shadow-sm backdrop-blur-sm transition ${
                  rowBusy ? "ring-2 ring-emerald-400/35 ring-offset-1 ring-offset-emerald-50/50" : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    id={`item-done-${it.id}`}
                    type="checkbox"
                    checked={checked}
                    disabled={rowBusy}
                    onChange={(e) => void onToggle(it.id, e.target.checked)}
                    className={`shrink-0 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-70 ${
                      rowToggleBusy ? "motion-safe:animate-pulse" : ""
                    }`}
                    aria-label={checked ? t("listsPage.markTodoAria") : t("listsPage.markDoneAria")}
                  />
                  {editingId === it.id ? (
                    <ItemNameEditor
                      initial={it.name}
                      onSave={(v) => onSaveItemName(it.id, v)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <label
                      htmlFor={`item-done-${it.id}`}
                      className={`min-w-0 flex-1 ${rowBusy ? "cursor-wait" : "cursor-pointer"} ${checked ? "text-slate-400 line-through" : "text-slate-900"}`}
                    >
                      {it.name}
                    </label>
                  )}
                </div>
                {editingId !== it.id ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={rowBusy}
                      onClick={() => setEditingId(it.id)}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900 disabled:pointer-events-none disabled:opacity-40"
                    >
                      {t("listsPage.edit")}
                    </button>
                    <button
                      type="button"
                      disabled={rowBusy}
                      onClick={() => void onDeleteItem(it.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 disabled:pointer-events-none disabled:opacity-40"
                    >
                      {rowDeleteBusy ? <InlineSpinner className="h-3 w-3 border-red-500/50" /> : null}
                      {rowDeleteBusy ? t("listsPage.removingItem") : t("listsPage.removeItem")}
                    </button>
                  </div>
                ) : null}
              </li>
            );
            })
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
  onSave: (v: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={saving}
        className="cv-input-sm min-w-0 flex-1 py-1 disabled:opacity-60"
        autoFocus
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          void (async () => {
            setSaving(true);
            try {
              await Promise.resolve(onSave(val));
            } finally {
              setSaving(false);
            }
          })();
        }}
        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 disabled:opacity-50"
      >
        {saving ? <InlineSpinner className="h-3 w-3 border-emerald-600/50" /> : null}
        {saving ? t("common.saving") : t("listsPage.ok")}
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="text-xs text-slate-500 disabled:opacity-40"
      >
        {t("listsPage.cancel")}
      </button>
    </span>
  );
}
