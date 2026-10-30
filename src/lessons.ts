import type { Argument, Kind, Proposition } from "./core/model";

export const LESSON_IDS = ["two-worlds", "conversion", "inhabitant", "chain"] as const;
export type LessonId = (typeof LESSON_IDS)[number];
export interface Lesson {
  id: LessonId;
  title: string;
  subtitle: string;
  question: string;
  instruction: string;
  premises: Proposition[];
  conclusion: Proposition;
  existence: number;
  world: number;
  reading: string;
  source: string;
  steps: string[];
}
export const lessons: Lesson[] = [
  {
    id: "two-worlds",
    title: "The horse & the stone",
    subtitle: "Two worlds, the same premises",
    question: "Must every C be A?",
    instruction:
      "Both premises hold in the starting world. Pin it. Can you put a C outside A while keeping both premises true?",
    premises: [
      { kind: "all", subject: 1, predicate: 0 },
      { kind: "none", subject: 2, predicate: 1 },
    ],
    conclusion: { kind: "all", subject: 2, predicate: 0 },
    existence: 7,
    world: 40,
    reading: "two-worlds",
    source: "I.4 · 26a2–9",
    steps: [
      "Pin the starting world. Its true conclusion does not yet establish a deduction.",
      "Remove object 6 (A and C). Place object 5 (C only). Both premises still hold.",
      "Read the horse and stone substitutions. Change the proposed conclusion to ‘No C is A’: the first world now refutes it.",
    ],
  },
  {
    id: "conversion",
    title: "Turn the sentence around",
    subtitle: "Every is not reversible",
    question: "Does every B is A mean every A is B?",
    instruction:
      "Keep every B inside A. Add an object in A but outside B. Then try the weaker conclusion ‘Some A is B’.",
    premises: [{ kind: "all", subject: 1, predicate: 0 }],
    conclusion: { kind: "all", subject: 0, predicate: 1 },
    existence: 2,
    world: 8,
    reading: "conversion",
    source: "I.2 · 25a7–9, 17–19",
    steps: [
      "Add object 2, in A only. Does it break the premise, the conclusion, or both?",
      "Change the proposed conclusion to ‘Some A is B’. Look for a counterexample with B required to exist.",
      "Allow B to be empty. Remove every B object. Read why existence changes the result in this modern experiment.",
    ],
  },
  {
    id: "inhabitant",
    title: "Take one of the Cs",
    subtitle: "The inhabitant doing the work",
    question: "Where does ‘some’ come from?",
    instruction:
      "Every C is A and every C is B. One C gives a shared object. Remove it, then compare requiring C to exist with allowing C to be empty.",
    premises: [
      { kind: "all", subject: 2, predicate: 0 },
      { kind: "all", subject: 2, predicate: 1 },
    ],
    conclusion: { kind: "some", subject: 1, predicate: 0 },
    existence: 4,
    world: 128,
    reading: "inhabitant",
    source: "I.6 · 28a17–26",
    steps: [
      "The shared object is a witness to ‘Some B is A’. Pin this world.",
      "Remove object 8. Place object 1 outside all three circles. With C required, this world is inadmissible.",
      "Uncheck ‘C has an inhabitant’. Both universals are now true, but the particular conclusion is false. This tests a modern empty-class convention; it is not an error attributed to Aristotle.",
    ],
  },
  {
    id: "chain",
    title: "Follow every",
    subtitle: "A conclusion you cannot break",
    question: "Can a C escape A without breaking a premise?",
    instruction:
      "Every C is B, and every B is A. Try placing a C outside A. Identify the premise your object violates.",
    premises: [
      { kind: "all", subject: 1, predicate: 0 },
      { kind: "all", subject: 2, predicate: 1 },
    ],
    conclusion: { kind: "all", subject: 2, predicate: 0 },
    existence: 0,
    world: 128,
    reading: "chain",
    source: "I.4 · 25b37–40",
    steps: [
      "Add an object in C outside A. Follow its B membership to locate the broken premise.",
      "Inspect every possible pattern. No counterexample exists in this model; the explanation below shows why this finite check is complete.",
      "Switch the proposed conclusion to ‘Some C is A’. Does the chain guarantee a C exists?",
    ],
  },
];
export function lesson(id: LessonId): Lesson {
  const found = lessons.find((item) => item.id === id);
  if (!found) throw new Error("Unknown investigation.");
  return found;
}
export function argumentFor(id: LessonId, kind: Kind): Argument {
  const item = lesson(id);
  return { premises: item.premises, conclusion: { ...item.conclusion, kind } };
}
