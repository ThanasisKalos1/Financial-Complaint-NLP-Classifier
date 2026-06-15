export interface TriageResult {
  predicted_product: string;
  suggested_team: string;
  priority: string;
  triage_note: string;
}

export interface PredictResponse {
  results?: TriageResult[];
  error?: string;
}

export const MODEL_STATS = [
  { label: "Macro F1", value: "0.85" },
  { label: "Weighted F1", value: "0.86" },
  { label: "Error rate", value: "13.7%" },
  { label: "Categories", value: "5" },
];

// Display metadata per product category (label + color used for badges).
export const CATEGORY_META: Record<
  string,
  { label: string; color: string }
> = {
  credit_card: { label: "Credit card", color: "bg-sky-100 text-sky-800" },
  credit_reporting: {
    label: "Credit reporting",
    color: "bg-violet-100 text-violet-800",
  },
  debt_collection: {
    label: "Debt collection",
    color: "bg-rose-100 text-rose-800",
  },
  mortgages_and_loans: {
    label: "Mortgages & loans",
    color: "bg-amber-100 text-amber-800",
  },
  retail_banking: {
    label: "Retail banking",
    color: "bg-emerald-100 text-emerald-800",
  },
};

export function categoryLabel(product: string): string {
  return (CATEGORY_META[product]?.label ?? product) || "—";
}

export function categoryColor(product: string): string {
  return CATEGORY_META[product]?.color ?? "bg-slate-100 text-slate-700";
}

export const EXAMPLE_COMPLAINTS: string[] = [
  "There is an incorrect late payment on my credit report that I never missed.",
  "A debt collector keeps calling me about a debt I already paid off two years ago.",
  "My mortgage servicer miscalculated my escrow and raised my monthly payment.",
  "I was charged an annual fee on my credit card that I was told would be waived.",
  "The bank placed a hold on my deposit and overdrew my checking account.",
];

export async function predictTexts(texts: string[]): Promise<TriageResult[]> {
  const res = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts }),
  });
  const data: PredictResponse = await res.json().catch(() => ({
    error: "The server returned an unreadable response.",
  }));
  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Request failed (${res.status}).`);
  }
  return data.results ?? [];
}
