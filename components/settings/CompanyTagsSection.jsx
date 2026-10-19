"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Check, X, Pencil, AlertTriangle } from "lucide-react";
import ColorPicker, { PRESET_COLORS } from "@/components/ColorPicker";
import { TagChip } from "@/components/leads/TagPicker";

function WarningToggle({ checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Nechceme oslovovat: na kartě leadu zobrazit varování
    </label>
  );
}

function TagRow({ tag, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [warning, setWarning] = useState(tag.warning);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/company-tags/${tag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color, warning }),
    });
    setSaving(false);
    setEditing(false);
    onSaved();
  }

  if (editing) {
    return (
      <div className="p-3 border border-primary rounded-lg bg-card space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Název</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Barva</Label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <WarningToggle checked={warning} onChange={setWarning} />
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Uložit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X className="w-3 h-3" />
            Zrušit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
      <TagChip tag={tag} />
      {tag.warning && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="w-3 h-3" />
          nechceme
        </span>
      )}
      <span className="flex-1 text-xs text-muted-foreground">{tag.companies} firem</span>
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(tag)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function CompanyTagsSection() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[6]);
  const [newWarning, setNewWarning] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchTags() {
    const res = await fetch("/api/company-tags");
    if (res.ok) setTags(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchTags();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/company-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor, warning: newWarning }),
    });
    if (res.ok) {
      setNewName("");
      setNewWarning(false);
      await fetchTags();
    }
    setSaving(false);
  }

  async function handleDelete(tag) {
    if (!confirm(`Smazat štítek „${tag.name}“? Zmizí u ${tag.companies} firem.`)) return;
    await fetch(`/api/company-tags/${tag.id}`, { method: "DELETE" });
    await fetchTags();
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">Štítky firem</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Štítek platí pro všechny inzeráty firmy. Přidává se přímo na kartě leadu, podle štítků jde filtrovat.
      </p>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2 mb-6">
          {tags.map((tag) => (
            <TagRow key={tag.id} tag={tag} onSaved={fetchTags} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <h3 className="font-medium">Přidat štítek</h3>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Např. Stávající klient"
        />
        <ColorPicker value={newColor} onChange={setNewColor} />
        <WarningToggle checked={newWarning} onChange={setNewWarning} />
        <Button type="submit" disabled={saving || !newName.trim()}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Přidat
        </Button>
      </form>
    </section>
  );
}
