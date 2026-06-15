"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  categoryColor,
  categoryLabel,
  EXAMPLE_COMPLAINTS,
  MODEL_STATS,
  predictTexts,
  type TriageResult,
} from "./lib";

type Tab = "single" | "batch";

export default function Home() {
  const [tab, setTab] = useState<Tab>("single");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Header />

      <div className="mt-8 inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton active={tab === "single"} onClick={() => setTab("single")}>
          Single complaint
        </TabButton>
        <TabButton active={tab === "batch"} onClick={() => setTab("batch")}>
          Batch CSV
        </TabButton>
      </div>

      <div className="mt-6">{tab === "single" ? <SinglePanel /> : <BatchPanel />}</div>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header>
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
        Financial Complaint NLP
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">
        Complaint Triage Assistant
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Paste a consumer financial complaint, or upload a CSV of many, and the
        model predicts the product category and suggests which team should handle
        it and at what priority. Built on a TF-IDF + Linear SVM classifier.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {MODEL_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm"
          >
            <div className="text-lg font-semibold text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </header>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white shadow"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}

function CategoryBadge({ product }: { product: string }) {
  if (!product) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor(
        product
      )}`}
    >
      {categoryLabel(product)}
    </span>
  );
}

function SinglePanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClassify() {
    if (!text.trim()) {
      setError("Please enter a complaint first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const [res] = await predictTexts([text.trim()]);
      setResult(res ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <label htmlFor="complaint" className="block text-sm font-medium text-slate-700">
        Complaint narrative
      </label>
      <textarea
        id="complaint"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="e.g. There is an incorrect late payment on my credit report..."
        className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-slate-800 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">Try an example:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLE_COMPLAINTS.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setText(ex);
                setResult(null);
                setError("");
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {ex.length > 48 ? ex.slice(0, 48) + "…" : ex}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleClassify}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Classifying…" : "Classify complaint"}
        </button>
        {text && (
          <button
            type="button"
            onClick={() => {
              setText("");
              setResult(null);
              setError("");
            }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {result && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Predicted product:</span>
            <CategoryBadge product={result.predicted_product} />
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Suggested team
              </dt>
              <dd className="mt-1 font-medium text-slate-800">
                {result.suggested_team}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Priority
              </dt>
              <dd className="mt-1 font-medium text-slate-800">{result.priority}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Triage note
              </dt>
              <dd className="mt-1 text-slate-600">{result.triage_note}</dd>
            </div>
          </dl>
        </div>
      )}
    </Card>
  );
}

interface BatchRow extends TriageResult {
  text: string;
}

function BatchPanel() {
  const [fileName, setFileName] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [selectedCol, setSelectedCol] = useState("");
  const [results, setResults] = useState<BatchRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError("");
    setResults(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        if (cols.length === 0) {
          setError("Could not read any columns. Make sure the CSV has a header row.");
          return;
        }
        setColumns(cols);
        setRows(res.data);
        // Auto-pick a likely text column.
        const guess =
          cols.find((c) => /narrative|complaint|text|description/i.test(c)) ??
          cols[0];
        setSelectedCol(guess);
      },
      error: (err) => setError(`Failed to parse CSV: ${err.message}`),
    });
  }

  async function handleClassify() {
    if (!selectedCol) {
      setError("Pick the column that contains the complaint text.");
      return;
    }
    const texts = rows.map((r) => (r[selectedCol] ?? "").toString());
    if (texts.length === 0) {
      setError("No data rows found in the file.");
      return;
    }
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const preds = await predictTexts(texts);
      setResults(preds.map((p, i) => ({ ...p, text: texts[i] })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!results) return;
    const csv = Papa.unparse(
      results.map((r) => ({
        complaint: r.text,
        predicted_product: r.predicted_product,
        suggested_team: r.suggested_team,
        priority: r.priority,
        triage_note: r.triage_note,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "triaged_complaints.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const summary = useMemo(() => {
    if (!results) return [];
    const counts = new Map<string, number>();
    for (const r of results) {
      if (!r.predicted_product) continue;
      counts.set(r.predicted_product, (counts.get(r.predicted_product) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [results]);

  return (
    <Card>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center"
      >
        <p className="text-slate-600">
          Drag a CSV here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-indigo-600 hover:underline"
          >
            choose a file
          </button>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          The file is parsed in your browser; only the complaint text column is
          sent for classification.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {fileName && (
          <p className="mt-3 text-sm font-medium text-slate-700">{fileName}</p>
        )}
      </div>

      {columns.length > 0 && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Complaint text column
            </label>
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <span className="pb-2 text-sm text-slate-500">{rows.length} rows</span>
          <button
            type="button"
            onClick={handleClassify}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Classifying…" : `Classify ${rows.length} complaints`}
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {results && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {summary.map(([product, count]) => (
                <span
                  key={product}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${categoryColor(
                    product
                  )}`}
                >
                  {categoryLabel(product)}
                  <span className="font-bold">{count}</span>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Download CSV
            </button>
          </div>

          <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Complaint</th>
                  <th className="px-4 py-2 font-medium">Predicted</th>
                  <th className="px-4 py-2 font-medium">Team</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => (
                  <tr key={i} className="align-top hover:bg-slate-50">
                    <td className="max-w-md px-4 py-2 text-slate-600">
                      {r.text.length > 160 ? r.text.slice(0, 160) + "…" : r.text}
                    </td>
                    <td className="px-4 py-2">
                      <CategoryBadge product={r.predicted_product} />
                    </td>
                    <td className="px-4 py-2 text-slate-700">{r.suggested_team}</td>
                    <td className="px-4 py-2 text-slate-700">{r.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
      <p>
        This is a triage aid built on a TF-IDF + Linear SVM model
        (macro F1 0.85). It supports human review and should not be used as a
        final compliance or legal decision-maker. Some categories share
        vocabulary, especially credit reporting and debt collection.
      </p>
    </footer>
  );
}
