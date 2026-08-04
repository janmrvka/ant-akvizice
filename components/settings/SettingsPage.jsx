"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#0ea5e9",
];

export default function SettingsPage() {
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newInitials, setNewInitials] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function fetchSalespeople() {
    setLoading(true);
    const res = await fetch("/api/salespeople");
    if (res.ok) setSalespeople(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchSalespeople();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim() || !newInitials.trim()) return;
    setSaving(true);
    const res = await fetch("/api/salespeople", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        initials: newInitials.trim().toUpperCase().slice(0, 2),
        color: newColor,
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewInitials("");
      setNewColor(PRESET_COLORS[0]);
      await fetchSalespeople();
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("Opravdu smazat?")) return;
    await fetch(`/api/salespeople/${id}`, { method: "DELETE" });
    await fetchSalespeople();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="font-semibold">Nastavení</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Obchodníci */}
        <section>
          <h2 className="text-lg font-semibold mb-1">Obchodníci</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Přidej členy týmu pro přiřazování leadů.
          </p>

          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="space-y-2 mb-6">
              {salespeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.initials}
                  </div>
                  <span className="flex-1 font-medium">{person.name}</span>
                  {person.name !== "Nepřiřazeno" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(person.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <Separator className="mb-6" />

          <form onSubmit={handleAdd} className="space-y-4">
            <h3 className="font-medium">Přidat obchodníka</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Jméno</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Jana Nováková"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Iniciály (2 znaky)</Label>
                <Input
                  value={newInitials}
                  onChange={(e) => setNewInitials(e.target.value)}
                  placeholder="JN"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Barva</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newColor === color ? "scale-125 ring-2 ring-offset-1 ring-foreground" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" disabled={saving || !newName.trim() || !newInitials.trim()}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Přidat
            </Button>
          </form>
        </section>

        <Separator />

        {/* DB init */}
        <section>
          <h2 className="text-lg font-semibold mb-1">Databáze</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Inicializuj databázi při prvním spuštění.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              const res = await fetch("/api/init");
              const data = await res.json();
              alert(data.ok ? "Databáze inicializována!" : `Chyba: ${data.error}`);
            }}
          >
            Inicializovat DB
          </Button>
        </section>
      </main>
    </div>
  );
}
