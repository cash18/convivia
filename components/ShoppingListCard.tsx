"use client";

import { addListItem, deleteListItem, toggleListItem } from "@/lib/actions/lists";
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

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">{name}</h3>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={onAddItem} className="mt-3 flex gap-2">
        <input
          name="item"
          required
          placeholder="Aggiungi articolo…"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          Aggiungi
        </button>
      </form>
      <ul className="mt-4 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-zinc-500">Lista vuota.</li>
        ) : (
          items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={it.done}
                  onChange={(e) => onToggle(it.id, e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span className={it.done ? "text-zinc-400 line-through" : "text-zinc-900"}>{it.name}</span>
              </label>
              <button
                type="button"
                onClick={() => onDeleteItem(it.id)}
                className="shrink-0 text-xs text-red-600 hover:text-red-800"
              >
                Rimuovi
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
