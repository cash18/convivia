"use client";

import {
  addListItem,
  deleteListItem,
  deleteShoppingList,
  toggleListItem,
  updateShoppingList,
  updateShoppingListItem,
} from "@/lib/actions/lists";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  id: string;
  name: string;
  done: boolean;
};

export function ShoppingListCard({
  houseId,
  listId,
  name,
  items,
}: {
  houseId: string;
  listId: string;
  name: string;
  items: Item[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);

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
    if (!confirm(`Eliminare la lista «${name}» e tutte le voci?`)) return;
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

  return (
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
              Salva
            </button>
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
            >
              Annulla
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
              Rinomina
            </button>
            <button
              type="button"
              onClick={() => void onDeleteList()}
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              Elimina lista
            </button>
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={onAddItem} className="mt-3 flex gap-2">
        <input
          name="item"
          required
          placeholder="Aggiungi articolo…"
          className="cv-input-sm flex-1"
        />
        <button type="submit" disabled={pending} className="cv-btn-primary shrink-0 px-4 py-2 text-sm">
          Aggiungi
        </button>
      </form>
      <ul className="mt-4 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500">Lista vuota.</li>
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
                  aria-label={it.done ? "Segna da fare" : "Segna fatto"}
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
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(it.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-800"
                  >
                    Rimuovi
                  </button>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
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
        OK
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-slate-500">
        Annulla
      </button>
    </span>
  );
}
