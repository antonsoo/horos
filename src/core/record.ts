import { LESSON_IDS, type LessonId, lesson } from "../lessons";
import { KINDS, type Kind } from "./model";

export interface Snapshot {
  lesson: LessonId;
  kind: Kind;
  existence: number;
  world: number;
}
export interface Notebook {
  format: "horos";
  version: 1;
  current: Snapshot;
  pinned: Snapshot | null;
  note: string;
  citations: string[];
}
export const READING_IDS = [
  "deduction",
  "two-worlds",
  "conversion",
  "inhabitant",
  "chain",
] as const;
export function initial(id: LessonId = "two-worlds"): Snapshot {
  const item = lesson(id);
  return { lesson: id, kind: item.conclusion.kind, existence: item.existence, world: item.world };
}
export function blank(): Notebook {
  return { format: "horos", version: 1, current: initial(), pinned: null, note: "", citations: [] };
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a Horos notebook object.");
  return value as Record<string, unknown>;
}
function integer(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max)
    throw new Error("A saved world or existence setting is out of range.");
  return value;
}
function snapshot(value: unknown): Snapshot {
  const v = object(value);
  if (!LESSON_IDS.includes(v.lesson as LessonId) || !KINDS.includes(v.kind as Kind))
    throw new Error("This notebook names an unknown investigation or conclusion.");
  return {
    lesson: v.lesson as LessonId,
    kind: v.kind as Kind,
    existence: integer(v.existence, 7),
    world: integer(v.world, 255),
  };
}
export function parse(text: string): Notebook {
  if (text.length > 32_000) throw new Error("This notebook is too large (limit 32 KB of text).");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This is not valid notebook JSON.");
  }
  const v = object(value);
  if (v.format !== "horos" || v.version !== 1) throw new Error("Use a version 1 Horos notebook.");
  if (typeof v.note !== "string" || v.note.length > 4000)
    throw new Error("The explanation must contain at most 4,000 characters.");
  if (
    !Array.isArray(v.citations) ||
    v.citations.length > READING_IDS.length ||
    !v.citations.every((c) => READING_IDS.includes(c)) ||
    new Set(v.citations).size !== v.citations.length
  )
    throw new Error("The saved citations are invalid or duplicated.");
  return {
    format: "horos",
    version: 1,
    current: snapshot(v.current),
    pinned: v.pinned === null ? null : snapshot(v.pinned),
    note: v.note,
    citations: v.citations as string[],
  };
}
export function encode(record: Notebook): string {
  return `#notebook=${encodeURIComponent(JSON.stringify(record))}`;
}
export function decode(hash: string): Notebook {
  if (!hash.startsWith("#notebook=") || hash.length > 160_000)
    throw new Error("This is not a supported Horos notebook link.");
  try {
    return parse(decodeURIComponent(hash.slice(10)));
  } catch (error) {
    if (error instanceof URIError) throw new Error("The notebook link has damaged text encoding.");
    throw error;
  }
}
