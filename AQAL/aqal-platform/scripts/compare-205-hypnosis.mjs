import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const inventoryPath = path.join(projectRoot, "validation/205_HYPNOSIS_TOPIC_INVENTORY.tsv");
const source203Path = "/home/ubuntu/aqal_rebuild_203/aqal-platform/shared/hypnosisTopics.ts";
const roadmapPath = path.join(projectRoot, "HYPNOSIS_LIBRARY_ROADMAP.md");
const outputPath = path.join(projectRoot, "validation/205_VS_203_HYPNOSIS_COMPARISON.json");

function parseTsv(text) {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split("\t");
  return lines.map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function unescapeTsString(value) {
  return value.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

function parse203Topics(text) {
  const pattern = /\{ id: "([^"]+)", title: "([^"]+)", family: "([^"]+)", target: "([^"]+)",\s*purpose: "((?:\\.|[^"])*)",\s*suggestions: "((?:\\.|[^"])*)",\s*imagery: "((?:\\.|[^"])*)", length: "([^"]+)" \}/gs;
  return [...text.matchAll(pattern)].map((match) => ({
    id: match[1],
    title: match[2],
    family: match[3],
    target: match[4],
    purpose: unescapeTsString(match[5]),
    suggestion_themes: unescapeTsString(match[6]),
    imagery: unescapeTsString(match[7]),
    duration: match[8],
  }));
}

const familyMap = {
  "LINE REHEARSAL": "line",
  "STATE SESSIONS": "state",
  "FUTURE-PACING": "future",
  "HABIT SUPPORT": "habit",
  "RECOVERY & PROCESSING": "recover",
};

function normalizedTitle(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const topics205 = parseTsv(fs.readFileSync(inventoryPath, "utf8"));
const topics203 = parse203Topics(fs.readFileSync(source203Path, "utf8"));
const byId203 = new Map(topics203.map((topic) => [topic.id, topic]));
const differences = [];

for (const topic of topics205) {
  const id = topic.route.replace(/^\/hypnosis\//, "");
  const source = byId203.get(id);
  if (!source) {
    differences.push({ id, field: "record", expected: "present", actual: "missing" });
    continue;
  }
  const expected = {
    title: topic.title,
    family: familyMap[topic.family],
    target: topic.target,
    duration: topic.duration,
    purpose: topic.purpose,
    suggestion_themes: topic.suggestion_themes,
    imagery: topic.imagery,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (source[field] !== value) differences.push({ id, field, expected: value, actual: source[field] });
  }
}

for (const topic of topics203) {
  if (!topics205.some((candidate) => candidate.route === `/hypnosis/${topic.id}`)) {
    differences.push({ id: topic.id, field: "record", expected: "absent", actual: "extra in 203" });
  }
}

const roadmap = fs.readFileSync(roadmapPath, "utf8");
const roadmapTitles = [...roadmap.matchAll(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|/gm)].map((match) => match[1].trim());
const roadmapNormalized = new Set(roadmapTitles.map(normalizedTitle));
const exactRoadmapTitleOverlap = topics205
  .map((topic) => topic.title)
  .filter((title) => roadmapNormalized.has(normalizedTitle(title)));

const result = {
  topics_205: topics205.length,
  topics_203: topics203.length,
  unique_205_routes: new Set(topics205.map((topic) => topic.route)).size,
  unique_203_ids: new Set(topics203.map((topic) => topic.id)).size,
  field_differences: differences.length,
  differences,
  roadmap_topic_count: roadmapTitles.length,
  exact_roadmap_title_overlap_count: exactRoadmapTitleOverlap.length,
  exact_roadmap_title_overlap: exactRoadmapTitleOverlap,
};

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  topics_205: result.topics_205,
  topics_203: result.topics_203,
  field_differences: result.field_differences,
  roadmap_topic_count: result.roadmap_topic_count,
  exact_roadmap_title_overlap_count: result.exact_roadmap_title_overlap_count,
}, null, 2));

if (topics205.length !== 50 || topics203.length !== 50 || differences.length !== 0) process.exit(1);
