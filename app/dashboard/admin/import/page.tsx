'use client';

import { useMemo, useRef, useState } from 'react';
import { CheckCircle2Icon, FileSpreadsheetIcon, SendIcon, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/http';

interface Row {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const norm = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

// Noms de colonnes reconnus (accents et majuscules ignorés)
const COLUMNS: Record<keyof Row, string[]> = {
  firstName: ['prenom', 'firstname', 'prenoms'],
  lastName: ['nom', 'lastname', 'nomdefamille', 'nomfamille'],
  email: ['email', 'mail', 'courriel', 'adressemail', 'adresseemail', 'adresseelectronique'],
  phone: ['telephone', 'tel', 'phone', 'portable', 'mobile', 'numerotelephone', 'telephoneportable'],
};

async function parseSheet(buffer: ArrayBuffer): Promise<Row[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const table = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
  return table.map((record) => {
    const row: Row = { firstName: '', lastName: '', email: '', phone: '' };
    for (const [header, value] of Object.entries(record)) {
      const key = norm(header);
      for (const field of Object.keys(COLUMNS) as (keyof Row)[]) {
        if (COLUMNS[field].includes(key)) row[field] = String(value ?? '').trim();
      }
    }
    return row;
  });
}

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ImportVolunteersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState('');
  const [sendInvites, setSendInvites] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number; invited: number; failed: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const checked = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        ok: !!row.firstName && !!row.lastName && emailOk(row.email.toLowerCase()),
      })),
    [rows]
  );
  const validCount = checked.filter((r) => r.ok).length;

  if (!user) return null;
  if (user.role !== 'admin') return <p className="p-6">Cette page est réservée aux administrateurs.</p>;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setResult(null);
    try {
      const parsed = await parseSheet(await file.arrayBuffer());
      if (parsed.length === 0) throw new Error('Aucune ligne trouvée dans ce fichier');
      setRows(parsed);
      setFileName(file.name);
    } catch (error: any) {
      toast.error(error.message || 'Fichier illisible');
    }
  };

  const runImport = async () => {
    setBusy(true);
    setResult(null);
    try {
      const payload = checked.filter((r) => r.ok).map(({ ok, ...row }) => row);
      const data = await api<{ created: { id: string; email: string }[]; skippedExisting: number; invalid: unknown[] }>(
        '/api/users/import',
        { method: 'POST', body: { rows: payload } }
      );

      let invited = 0;
      let failed = 0;
      if (sendInvites && data.created.length > 0) {
        setProgress({ done: 0, total: data.created.length });
        // 3 envois à la fois : assez rapide, sans saturer la boîte d'envoi
        const queue = [...data.created];
        const worker = async () => {
          for (let item = queue.shift(); item; item = queue.shift()) {
            try {
              await api(`/api/users/${encodeURIComponent(item.id)}/invite`, { method: 'POST' });
              invited++;
            } catch {
              failed++;
            }
            setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
          }
        };
        await Promise.all([worker(), worker(), worker()]);
      }
      setResult({ created: data.created.length, skipped: data.skippedExisting, invited, failed });
      setRows([]);
      setFileName('');
    } catch (error: any) {
      toast.error(error.message || 'Import impossible');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Importer des bénévoles</h1>
        <p className="mt-1 text-muted-foreground">
          Envoyez un fichier Excel ou CSV : chaque personne est créée, et vous pouvez lui envoyer son lien de connexion d’un coup.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">1. Votre fichier</h2>
        <p className="text-sm text-muted-foreground">
          Colonnes reconnues : <strong>Prénom</strong>, <strong>Nom</strong>, <strong>Email</strong>, <strong>Téléphone</strong> (facultatif).
          La première ligne doit contenir ces titres.
        </p>
        <input ref={input} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}>
          <UploadIcon className="mr-2 h-4 w-4" />
          Choisir un fichier
        </Button>
        {fileName && (
          <p className="flex items-center gap-2 text-sm">
            <FileSpreadsheetIcon className="h-4 w-4" /> {fileName} · {rows.length} ligne(s), dont <strong>{validCount} valide(s)</strong>
          </p>
        )}
      </section>

      {rows.length > 0 && (
        <section className="space-y-4 rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-semibold">2. Vérification</h2>
          <div className="max-h-80 overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-2 text-left">Prénom</th>
                  <th className="p-2 text-left">Nom</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Téléphone</th>
                  <th className="p-2 text-left">État</th>
                </tr>
              </thead>
              <tbody>
                {checked.slice(0, 200).map((row, i) => (
                  <tr key={i} className={row.ok ? '' : 'bg-red-50'}>
                    <td className="p-2">{row.firstName}</td>
                    <td className="p-2">{row.lastName}</td>
                    <td className="p-2">{row.email}</td>
                    <td className="p-2">{row.phone}</td>
                    <td className="p-2">{row.ok ? '✓' : 'À corriger'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 200 && <p className="text-sm text-muted-foreground">Aperçu des 200 premières lignes.</p>}

          <label className="flex items-start gap-3 text-base">
            <input type="checkbox" className="mt-1 h-5 w-5" checked={sendInvites} onChange={(e) => setSendInvites(e.target.checked)} />
            <span>
              Envoyer aussi à chacun son <strong>lien de connexion par email</strong>
              <span className="block text-sm text-muted-foreground">Il n’aura plus qu’à cliquer sur le bouton de l’email.</span>
            </span>
          </label>

          <Button onClick={runImport} disabled={busy || validCount === 0} className="h-12 text-base">
            <SendIcon className="mr-2 h-4 w-4" />
            {busy ? 'Import en cours…' : `Importer ${validCount} bénévole(s)`}
          </Button>
          {progress && (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gold-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Envoi des liens : {progress.done} / {progress.total}
              </p>
            </div>
          )}
        </section>
      )}

      {result && (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="flex items-center gap-2 text-lg font-semibold text-green-800">
            <CheckCircle2Icon className="h-5 w-5" /> Import terminé
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base">
            <li>{result.created} bénévole(s) créé(s)</li>
            {result.skipped > 0 && <li>{result.skipped} déjà présent(s), ignoré(s)</li>}
            {sendInvites && <li>{result.invited} lien(s) envoyé(s){result.failed > 0 ? `, ${result.failed} en échec (réessayez depuis la liste des bénévoles)` : ''}</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
