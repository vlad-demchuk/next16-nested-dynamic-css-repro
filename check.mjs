import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const NEXT = ".next";

const findHtml = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...findHtml(p));
    else if (entry.endsWith(".html")) out.push(p);
  }
  return out;
};

const appDir = join(NEXT, "server", "app");
if (!existsSync(appDir)) {
  console.error("no .next/server/app — run `npm run build` first");
  process.exit(1);
}

const html = findHtml(appDir).map((p) => ({ p, body: readFileSync(p, "utf8") }));
const page = html.find((h) => h.body.includes("left column")) ?? html[0];
console.log(`html: ${page.p}\n`);

const linked = [...page.body.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map((m) => m[0]);
console.log(`stylesheet links in HTML: ${linked.length}`);
for (const l of linked) {
  const href = (l.match(/href="([^"]+)"/) ?? [])[1];
  const prec = (l.match(/data-precedence="([^"]+)"/) ?? [])[1] ?? "(none)";
  console.log(`   ${href}   data-precedence=${prec}`);
}
const linkedFiles = new Set(
  linked.map((l) => ((l.match(/href="([^"]+)"/) ?? [])[1] ?? "").split("/").pop())
);

const collectCss = (dir) => {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...collectCss(p));
    else if (entry.endsWith(".css")) out.push(p);
  }
  return out;
};

// turbopack emits CSS under static/chunks, webpack under static/css
const cssFiles = collectCss(join(NEXT, "static"));

const locate = (marker) => {
  const hits = [];
  for (const f of cssFiles) {
    if (readFileSync(f, "utf8").includes(marker)) hits.push(f.split("/").pop());
  }
  return hits;
};

console.log("");
let failed = false;
for (const [label, marker] of [
  ["level 1 (dynamic from a statically imported module)", "levelOneWidget"],
  ["level 2 (dynamic declared inside a dynamically imported module)", "levelTwoGrid"],
]) {
  const hits = locate(marker);
  const isLinked = hits.some((f) => linkedFiles.has(f));
  console.log(`${label}`);
  console.log(`   css chunk(s): ${hits.join(", ") || "NOT EMITTED"}`);
  console.log(`   linked in server HTML: ${isLinked ? "YES" : "NO  <-- no SSR stylesheet link"}`);
  if (!isLinked) failed = true;
}

console.log(
  failed
    ? "\nRESULT: reproduced — the level-2 stylesheet is missing from the server HTML."
    : "\nRESULT: both levels are linked — not reproduced on this version."
);
