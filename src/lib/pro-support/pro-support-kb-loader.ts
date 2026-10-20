import * as fs from "fs";
import * as path from "path";

export interface HardQA {
  phrase: string;
  label: string;
}

export interface Dossier {
  id: string;
  title: string;
  sections: Record<string, string>;
  hardQA: HardQA[];
}

export interface PositiveHook {
  topicId: string;
  hook: string;
}

export interface NegativeHook {
  topicId: string;
  phrase: string;
}

export interface RightGate {
  topicId: string;
  gateId: string;
  status: string;
  safeReturn?: string;
}

export interface VersionRule {
  topicId: string;
  dimension: string;
  rule: string;
}

function kbDir(): string {
  return path.join(process.cwd(), "src", "lib", "pro-support-kb");
}

function readCsv(name: string): string[][] {
  try {
    const raw = fs.readFileSync(path.join(kbDir(), name), "utf8");
    return raw
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0)
      .map((l) => l.split(",").map((c) => c.replace(/^"|"$/g, "").trim()));
  } catch {
    return [];
  }
}

function withHeader(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[h] = r[i] ?? ""));
    return o;
  });
}

let _dossiers: Dossier[] | null = null;

export function loadDossiers(): Dossier[] {
  if (_dossiers) return _dossiers;
  const dir = path.join(kbDir(), "03_10_TOPIC_KNOWLEDGE");
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    _dossiers = [];
    return _dossiers;
  }
  _dossiers = files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const idMatch = raw.match(/^(ACAD-[A-Z0-9]{2,3}-\d{2})/);
    const id = idMatch ? idMatch[1] : f.slice(0, 14);
    const title = (raw.match(/^#\s*(.+)$/m) || [])[1]?.trim() || f;
    const sections: Record<string, string> = {};
    const hardQA: HardQA[] = [];
    const lines = raw.split(/\r?\n/);
    let cur = "";
    for (const ln of lines) {
      const head = ln.match(/^##\s*(.+)$/);
      if (head) {
        cur = head[1].trim();
        sections[cur] = "";
      } else if (cur) {
        sections[cur] = (sections[cur] || "") + ln + "\n";
      } else if (ln.startsWith("#")) {
        continue;
      } else {
        sections.__frontmatter = (sections.__frontmatter || "") + ln + "\n";
      }
    }
    for (const k of Object.keys(sections)) {
      const text = sections[k].replace(/\n+$/, "");
      for (const sl of text.split(/\r?\n/)) {
        if (!sl.trim().startsWith("-")) continue;
        const arrowIdx = sl.indexOf("→");
        if (arrowIdx < 0) continue;
        const phrase = sl.slice(0, arrowIdx).replace(/^-\s*/, "").replace(/[？?：:。\s]+$/, "").trim();
        const label = sl.slice(arrowIdx + 1).replace(/[\s。；;】]+$/, "").trim().toUpperCase();
        if (phrase && label && /BLOCK|RIGHTS|SAFETY|CURRENTNESS|ALLOW|ROUTE|CHECK|FACT_TRAP|UA_|CRISIS/i.test(label)) {
          hardQA.push({ phrase, label });
        }
      }
    }
    return { id, title, sections, hardQA };
  });
  return _dossiers;
}

let _posHooks: PositiveHook[] | null = null;
export function loadPositiveHooks(): PositiveHook[] {
  if (_posHooks) return _posHooks;
  _posHooks = withHeader(readCsv("BM25_RAG_POSITIVE_HOOKS.csv")).map((r) => ({
    topicId: (r["topic_id"] || r["topic"] || "").toUpperCase(),
    hook: r["positive_hook"] || r["hook"] || r["keyword"] || "",
  })).filter((s) => s.hook);
  return _posHooks;
}

let _negHooks: NegativeHook[] | null = null;
export function loadNegativeHooks(): NegativeHook[] {
  if (_negHooks) return _negHooks;
  _negHooks = withHeader(readCsv("BM25_RAG_NEGATIVE_HOOKS.csv")).map((r) => ({
    topicId: (r["topic_id"] || r["topic"] || "").toUpperCase(),
    phrase: r["negative_hook"] || r["phrase"] || r["hook"] || r["keyword"] || "",
  })).filter((s) => s.phrase);
  return _negHooks;
}

export function hasNegativeHook(topicId: string, query: string): boolean {
  const q = query.toLowerCase();
  return loadNegativeHooks().some((n) => n.topicId.toUpperCase() === topicId.toUpperCase() && q.includes(n.phrase.toLowerCase()));
}

let _rights: RightGate[] | null = null;
export function loadRights(): RightGate[] {
  if (_rights) return _rights;
  _rights = withHeader(readCsv("RIGHTS_GATING.csv")).map((r) => ({
    topicId: (r["topic_id"] || r["topic"] || r["dossier_id"] || "").toUpperCase(),
    gateId: r["gate_id"] || r["id"] || r["rights_gate"] || "",
    status: (r["status"] || r["gate"] || "").toUpperCase(),
    safeReturn: r["safe_return"] || r["safe"] || "",
  })).filter((s) => s.status);
  return _rights;
}

let _versions: VersionRule[] | null = null;
export function loadVersions(): VersionRule[] {
  if (_versions) return _versions;
  _versions = withHeader(readCsv("VERSION_ROUTING_MASTER.csv")).map((r) => ({
    topicId: (r["topic_id"] || r["topic"] || r["dossier_id"] || "").toUpperCase(),
    dimension: r["dimension"] || r["version_dimension"] || "",
    rule: r["rule"] || r["routing_rule"] || "",
  })).filter((s) => s.rule);
  return _versions;
}