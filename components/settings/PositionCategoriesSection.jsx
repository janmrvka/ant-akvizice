"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Check, X, Pencil, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import ColorPicker, { PRESET_COLORS } from "@/components/ColorPicker";
import { TagChip } from "@/components/leads/TagPicker";

function CategoryForm({ initial, salespeople, onSubmit, onCancel, submitLabel }) {
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color);
  const [keywords, setKeywords] = useState(initial.keywords);
  const [fallback, setFallback] = useState(initial.fallback);
  const [assigneeId, setAssigneeId] = useState(initial.assignee_id ?? "");
  const [saving, setSaving] = useState(false);

  const people = salespeople.filter((p) => p.name !== "Nepřiřazeno");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      name: name.trim(),
      color,
      keywords,
      fallback,
      assignee_id: assigneeId ? parseInt(assigneeId) : null,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="p-3 border border-primary rounded-lg bg-card space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Název</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Předpřiřadit člověka</Label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full h-8 text-sm border border-border rounded-md px-2 bg-background text-foreground"
          >
            <option value="">Nikoho</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Klíčová slova v názvu pozice</Label>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          rows={3}
          className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Oddělit čárkou, diakritika nehraje roli. <code>seo</code> = celé slovo, <code>brand*</code> = začátek
          slova, <code>-brand ambassador</code> = když se najde, kategorie se nepoužije.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={fallback} onChange={(e) => setFallback(e.target.checked)} />
        Záložní kategorie: použít, jen když nesedí žádná jiná
      </label>
      <div className="space-y-1">
        <Label className="text-xs">Barva</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button size="sm" type="button" variant="ghost" onClick={onCancel}>
            <X className="w-3 h-3" />
            Zrušit
          </Button>
        )}
      </div>
    </form>
  );
}

const EMPTY = { name: "", color: PRESET_COLORS[9], keywords: "", fallback: false, assignee_id: null };

export default function PositionCategoriesSection({ salespeople }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState(null);

  async function fetchCategories() {
    const res = await fetch("/api/position-categories");
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  function report(data) {
    const changed = data?.stats?.changed ?? data?.changed;
    if (changed != null) setMessage(`Přepočítáno, změněno ${changed} leadů.`);
  }

  async function request(url, method, body) {
    setWorking(true);
    setMessage(null);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) setMessage(`Chyba: ${data?.error ?? res.status}`);
    else report(data);
    await fetchCategories();
    setWorking(false);
    return res.ok;
  }

  async function move(index, dir) {
    const a = categories[index];
    const b = categories[index + dir];
    if (!b) return;
    setWorking(true);
    await fetch(`/api/position-categories/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort: b.sort }),
    });
    setWorking(false);
    await request(`/api/position-categories/${b.id}`, "PATCH", { sort: a.sort });
  }

  async function handleDelete(cat) {
    if (!confirm(`Smazat kategorii „${cat.name}“?`)) return;
    await request(`/api/position-categories/${cat.id}`, "DELETE");
  }

  const nameOf = (id) => salespeople.find((p) => p.id === id)?.name;

  return (
    <section>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-lg font-semibold">Kategorie pozic</h2>
        <Button
          variant="outline"
          size="sm"
          disabled={working}
          onClick={() => request("/api/position-categories/reclassify", "POST")}
        >
          {working ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Přepočítat leady
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Pozice se zařadí podle klíčových slov v názvu inzerátu. Nepřiřazený lead dostane člověka podle první
        kategorie v pořadí, která ho má nastaveného. Ruční přiřazení ani ručně upravené kategorie se
        nepřepisují.
      </p>
      {message && <p className="text-sm mb-3">{message}</p>}

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2 mb-6">
          {categories.map((cat, i) =>
            editingId === cat.id ? (
              <CategoryForm
                key={cat.id}
                initial={cat}
                salespeople={salespeople}
                submitLabel="Uložit"
                onCancel={() => setEditingId(null)}
                onSubmit={async (body) => {
                  if (await request(`/api/position-categories/${cat.id}`, "PATCH", body)) setEditingId(null);
                }}
              />
            ) : (
              <div key={cat.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
                <div className="flex flex-col">
                  <button
                    disabled={i === 0 || working}
                    onClick={() => move(i, -1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={i === categories.length - 1 || working}
                    onClick={() => move(i, 1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TagChip tag={cat} />
                    {cat.fallback && <span className="text-[10px] text-muted-foreground">záložní</span>}
                    {cat.assignee_id && (
                      <span className="text-xs text-muted-foreground">→ {nameOf(cat.assignee_id)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={cat.keywords}>
                    {cat.leads} leadů · {cat.keywords}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(cat.id)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cat)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {adding ? (
        <CategoryForm
          initial={EMPTY}
          salespeople={salespeople}
          submitLabel="Přidat"
          onCancel={() => setAdding(false)}
          onSubmit={async (body) => {
            if (await request("/api/position-categories", "POST", body)) setAdding(false);
          }}
        />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4" />
          Přidat kategorii
        </Button>
      )}
    </section>
  );
}
