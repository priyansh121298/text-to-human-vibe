import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScanLine, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/detector")({
  component: DetectorPage,
  head: () => ({
    meta: [
      { title: "AI Detector — Check if text sounds AI-generated" },
      {
        name: "description",
        content:
          "Free AI detector. Paste any text to estimate how likely it was written by AI, then humanize it to sound natural.",
      },
      { property: "og:title", content: "AI Detector — Check if text sounds AI-generated" },
      {
        property: "og:description",
        content:
          "Free AI detector. Paste any text to estimate how likely it was written by AI, then humanize it to sound natural.",
      },
      { property: "og:url", content: "https://text-to-human-vibe.lovable.app/detector" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://text-to-human-vibe.lovable.app/detector" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How does an AI detector work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "AI detectors look for statistical signals that text was machine-generated: low burstiness (uniform sentence length), low perplexity (predictable word choices), heavy use of formal connectors like 'furthermore' and 'moreover', and an absence of contractions and personal voice.",
              },
            },
            {
              "@type": "Question",
              name: "Can I bypass AI detectors?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Vary sentence length, use contractions, drop stock connectors, and add a short personal hook at the start. Our humanizer applies these rewrites automatically.",
              },
            },
          ],
        }),
      },
    ],
  }),
});

// Heuristic AI-likelihood scorer. Not a model — a transparent breakdown of
// the same signals real detectors weight: burstiness, formality, hedges,
// contractions, and lexical variety.
const AI_TELLS = [
  "furthermore",
  "moreover",
  "however",
  "therefore",
  "subsequently",
  "in addition",
  "in conclusion",
  "it is important to note",
  "it should be noted",
  "delve into",
  "navigate the complexities",
  "in the realm of",
  "in today's world",
  "utilize",
  "commence",
  "endeavor",
  "a multitude of",
  "numerous",
  "tapestry",
  "underscore",
];

const CONTRACTIONS = /\b(don't|can't|won't|it's|that's|you're|they're|we're|i'm|i've|didn't|doesn't|isn't|aren't|wasn't|weren't)\b/gi;

type Analysis = {
  score: number; // 0-100
  verdict: string;
  tone: "good" | "warn" | "bad";
  signals: { label: string; detail: string; weight: number }[];
};

function analyze(text: string): Analysis | null {
  const trimmed = text.trim();
  if (trimmed.length < 40) return null;

  const sentences = trimmed.split(/[.!?]+\s+/).filter((s) => s.trim().length > 0);
  const words = trimmed.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const wordCount = words.length;

  // 1. Burstiness — variance of sentence length. Low = AI-ish.
  const sentLens = sentences.map((s) => s.split(/\s+/).length);
  const mean = sentLens.reduce((a, b) => a + b, 0) / Math.max(sentLens.length, 1);
  const variance =
    sentLens.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(sentLens.length, 1);
  const burstiness = Math.sqrt(variance);
  const burstinessScore = Math.max(0, 30 - burstiness * 4); // 0-30

  // 2. Stock AI connectors.
  const lower = trimmed.toLowerCase();
  const tellHits = AI_TELLS.filter((t) => lower.includes(t));
  const tellsScore = Math.min(25, tellHits.length * 6); // 0-25

  // 3. Contractions — AI rarely uses them.
  const contractionCount = (trimmed.match(CONTRACTIONS) ?? []).length;
  const contractionsPerHundred = (contractionCount / Math.max(wordCount, 1)) * 100;
  const contractionsScore = Math.max(0, 20 - contractionsPerHundred * 8); // 0-20

  // 4. Lexical variety — type/token ratio. Very high = AI-ish on long text.
  const unique = new Set(words).size;
  const ttr = unique / Math.max(wordCount, 1);
  const varietyScore = wordCount > 80 && ttr > 0.7 ? 15 : 0;

  // 5. First-person voice — AI rarely uses "I" / "my".
  const firstPerson = (trimmed.match(/\b(i|my|me|mine)\b/gi) ?? []).length;
  const firstPersonScore = firstPerson === 0 && wordCount > 60 ? 10 : 0;

  const raw =
    burstinessScore + tellsScore + contractionsScore + varietyScore + firstPersonScore;
  const score = Math.min(100, Math.round(raw));

  let verdict = "Likely human";
  let tone: Analysis["tone"] = "good";
  if (score >= 65) {
    verdict = "Likely AI-generated";
    tone = "bad";
  } else if (score >= 35) {
    verdict = "Mixed signals";
    tone = "warn";
  }

  const signals = [
    {
      label: "Sentence rhythm",
      detail:
        burstiness < 4
          ? "Sentences are uniform in length — a classic AI tell."
          : "Varied sentence length, which reads naturally.",
      weight: Math.round(burstinessScore),
    },
    {
      label: "Stock connectors",
      detail:
        tellHits.length === 0
          ? "No formulaic phrases detected."
          : `Found: ${tellHits.slice(0, 5).join(", ")}${tellHits.length > 5 ? "…" : ""}`,
      weight: tellsScore,
    },
    {
      label: "Contractions",
      detail:
        contractionCount === 0
          ? "No contractions — formal, which reads as AI."
          : `${contractionCount} contractions used (natural).`,
      weight: Math.round(contractionsScore),
    },
    {
      label: "Lexical variety",
      detail:
        varietyScore > 0
          ? "Vocabulary is unusually wide for the length — common in AI output."
          : "Vocabulary range looks natural.",
      weight: varietyScore,
    },
    {
      label: "Personal voice",
      detail:
        firstPersonScore > 0
          ? "No first-person pronouns — feels detached."
          : "Personal voice present.",
      weight: firstPersonScore,
    },
  ];

  return { score, verdict, tone, signals };
}

function DetectorPage() {
  const [text, setText] = useState("");
  const MAX = 5000;
  const tooLong = text.length > MAX;

  const [result, setResult] = useState<Analysis | null>(null);

  const handleAnalyze = () => {
    if (tooLong) {
      toast.error(`Text is too long. Max ${MAX} characters.`);
      return;
    }
    const r = analyze(text);
    if (!r) {
      toast.error("Paste at least a couple of sentences (40+ characters).");
      return;
    }
    setResult(r);
  };

  const toneClass = useMemo(() => {
    if (!result) return "";
    if (result.tone === "good") return "text-emerald-400";
    if (result.tone === "warn") return "text-amber-400";
    return "text-rose-400";
  }, [result]);

  return (
    <div className="dark min-h-screen bg-background text-foreground relative overflow-hidden">
      <Toaster />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-bg)" }}
      />
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl -z-10"
        style={{ background: "var(--gradient-primary)" }}
      />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-6">
            <ScanLine className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">AI detector</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Does your text sound{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              AI-generated?
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Paste any text to score it on the same signals real detectors weight — then
            humanize the parts that read as machine-written.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 shadow-[var(--shadow-elegant)] mb-6">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="detector-input" className="text-sm font-semibold">
              Text to analyze
            </label>
            <span className={`text-xs ${tooLong ? "text-destructive" : "text-muted-foreground"}`}>
              {text.length}/{MAX}
            </span>
          </div>
          <Textarea
            id="detector-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a paragraph or two..."
            maxLength={MAX}
            className="min-h-[220px] resize-none bg-input/40 border-border focus-visible:ring-primary/40 text-base leading-relaxed"
          />
          <div className="flex justify-end mt-4">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={tooLong || text.trim().length === 0}
              className="px-8 py-5 text-base font-semibold rounded-xl text-primary-foreground border-0 hover:scale-[1.02] hover:shadow-[var(--shadow-glow)]"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <ScanLine className="w-5 h-5 mr-2" />
              Analyze
            </Button>
          </div>
        </section>

        {result && (
          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-[var(--shadow-elegant)] mb-10">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  AI likelihood
                </p>
                <p className={`text-5xl font-bold ${toneClass}`}>{result.score}%</p>
              </div>
              <p className={`text-sm font-medium ${toneClass}`}>{result.verdict}</p>
            </div>
            <div className="w-full h-2 rounded-full bg-input/40 overflow-hidden mb-6">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${result.score}%`,
                  backgroundImage: "var(--gradient-primary)",
                }}
              />
            </div>
            <ul className="space-y-3">
              {result.signals.map((s) => (
                <li
                  key={s.label}
                  className="flex items-start justify-between gap-4 border-t border-border/50 pt-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.detail}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    +{s.weight}
                  </span>
                </li>
              ))}
            </ul>
            {result.score >= 35 && (
              <div className="mt-6 pt-5 border-t border-border/50 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Reads as AI? Run it through the humanizer.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <Sparkles className="w-4 h-4" />
                  Humanize text
                </Link>
              </div>
            )}
          </section>
        )}

        <section className="prose prose-invert max-w-none text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground mb-3">How AI detectors work</h2>
          <p className="text-sm leading-relaxed mb-3">
            AI detectors don't read your text the way a person does. They measure statistical
            fingerprints that large language models tend to leave behind:
          </p>
          <ul className="text-sm space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">Burstiness</strong> — humans vary sentence
              length wildly. AI writes in even rhythms.
            </li>
            <li>
              <strong className="text-foreground">Perplexity</strong> — humans pick surprising
              words. AI picks the most probable next word.
            </li>
            <li>
              <strong className="text-foreground">Stock connectors</strong> — "furthermore,"
              "moreover," "in conclusion" appear far more often in AI output.
            </li>
            <li>
              <strong className="text-foreground">No contractions, no voice</strong> — AI
              defaults to formal, third-person prose.
            </li>
          </ul>
          <p className="text-sm leading-relaxed mt-4">
            This detector scores those same signals locally in your browser — nothing is sent
            to a server. Use it to spot-check your writing before submitting it, and to verify
            that the{" "}
            <Link to="/" className="text-primary hover:underline">
              humanizer
            </Link>{" "}
            actually moved the needle.
          </p>
        </section>

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          Heuristic only. No detector is 100% accurate — treat the score as a guide.
        </footer>
      </main>
    </div>
  );
}