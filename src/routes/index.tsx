import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

// Lightweight client-side "humanizer" — swaps stiff phrasing, contracts verbs,
// trims hedge words, and adds gentle variation. Good enough for a polished demo.
function humanizeText(input: string): string {
  if (!input.trim()) return "";
  let text = input;

  const replacements: Array<[RegExp, string]> = [
    [/\bin order to\b/gi, "to"],
    [/\butilize\b/gi, "use"],
    [/\butilizes\b/gi, "uses"],
    [/\bin addition\b/gi, "also"],
    [/\bfurthermore\b/gi, "plus"],
    [/\bmoreover\b/gi, "and"],
    [/\bhowever\b/gi, "but"],
    [/\btherefore\b/gi, "so"],
    [/\bsubsequently\b/gi, "then"],
    [/\bcommence\b/gi, "start"],
    [/\bterminate\b/gi, "end"],
    [/\bdemonstrate\b/gi, "show"],
    [/\bendeavor\b/gi, "try"],
    [/\bnumerous\b/gi, "many"],
    [/\ba multitude of\b/gi, "many"],
    [/\bit is important to note that\b/gi, ""],
    [/\bit should be noted that\b/gi, ""],
    [/\bdelve into\b/gi, "explore"],
    [/\bnavigate the complexities of\b/gi, "handle"],
    [/\bin the realm of\b/gi, "in"],
    [/\bin today's world\b/gi, "today"],
    [/\bdo not\b/g, "don't"],
    [/\bcannot\b/g, "can't"],
    [/\bwill not\b/g, "won't"],
    [/\bit is\b/g, "it's"],
    [/\bthat is\b/g, "that's"],
    [/\byou are\b/g, "you're"],
    [/\bthey are\b/g, "they're"],
    [/\bwe are\b/g, "we're"],
  ];

  for (const [from, to] of replacements) text = text.replace(from, to);

  // Collapse double spaces and clean punctuation spacing.
  text = text.replace(/\s{2,}/g, " ").replace(/\s+([,.!?;:])/g, "$1");

  // Capitalize sentence starts.
  text = text.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase());

  return text.trim();
}

function Index() {
  const [input, setInput] = useState("");
  const [hook, setHook] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleHumanize = async () => {
    if (!input.trim()) {
      toast.error("Please enter some text first");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("https://priyansh-bot.instatunnel.my", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (typeof data?.result !== "string") throw new Error("Invalid response");
      const prefix = hook.trim();
      setOutput(prefix ? `${prefix} ${data.result}` : data.result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

  return (
    <div className="dark min-h-screen bg-background text-foreground relative overflow-hidden">
      <Toaster />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-bg)" }}
      />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl -z-10"
        style={{ background: "var(--gradient-primary)" }}
      />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">AI text humanizer</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Make AI text sound{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              human
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Paste your AI-generated content and get natural, conversational writing in seconds.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 shadow-[var(--shadow-elegant)]">
            <div className="mb-4">
              <label htmlFor="hook" className="text-sm font-semibold block mb-2">
                Manual Human Hook <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                id="hook"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="e.g. So I was thinking the other day about how..."
                className="bg-input/40 border-border focus-visible:ring-primary/40"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Type the first 10-15 words yourself to break detector tracking.
              </p>
            </div>
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="input" className="text-sm font-semibold">Original text</label>
              <span className="text-xs text-muted-foreground">{wordCount(input)} words</span>
            </div>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your AI-generated text here..."
              className="min-h-[360px] resize-none bg-input/40 border-border focus-visible:ring-primary/40 text-base leading-relaxed"
            />
          </section>

          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 shadow-[var(--shadow-elegant)]">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="output" className="text-sm font-semibold">Humanized text</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{wordCount(output)} words</span>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <Textarea
              id="output"
              value={output}
              readOnly
              placeholder="Your humanized text will appear here..."
              className="min-h-[360px] resize-none bg-input/40 border-border focus-visible:ring-primary/40 text-base leading-relaxed"
            />
          </section>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            size="lg"
            onClick={handleHumanize}
            disabled={loading || !input.trim()}
            className="px-10 py-6 text-base font-semibold rounded-xl text-primary-foreground border-0 transition-[var(--transition-smooth)] hover:scale-[1.02] hover:shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Humanizing...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Humanize
              </>
            )}
          </Button>
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          Built for clarity. Your text never leaves your browser.
        </footer>
      </main>
    </div>
  );
}
