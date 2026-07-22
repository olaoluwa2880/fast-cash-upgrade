import { type ReactNode } from "react";

// Lightweight, safe markdown-ish renderer for the Legal Center.
// Supports: # / ## / ### headings, - bullet lists, and blank-line paragraphs.
// Plain text only — no HTML injection.
export function renderLegal(content: string): ReactNode {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={`p-${key++}`} className="text-[13px] leading-relaxed text-white/80">
        {paragraph.join(" ")}
      </p>,
    );
    paragraph = [];
  };
  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`u-${key++}`} className="list-disc pl-5 space-y-1 text-[13px] leading-relaxed text-white/80">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  const flushAll = () => { flushParagraph(); flushBullets(); };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushAll(); continue; }
    if (line.startsWith("### ")) {
      flushAll();
      blocks.push(<h3 key={`h3-${key++}`} className="text-sm font-bold text-white mt-3">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      flushAll();
      blocks.push(<h2 key={`h2-${key++}`} className="text-base font-extrabold text-white mt-4">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      flushAll();
      blocks.push(<h1 key={`h1-${key++}`} className="text-xl font-extrabold text-white mt-2">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ")) {
      flushParagraph();
      bullets.push(line.slice(2));
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushAll();
  return <div className="space-y-2">{blocks}</div>;
}
