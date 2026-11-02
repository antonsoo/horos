import { existenceMap } from "../src/core/existence";
import { KINDS } from "../src/core/model";
import { argumentFor, lessons } from "../src/lessons";

for (const lesson of lessons)
  for (const kind of KINDS) {
    const argument = argumentFor(lesson.id, kind);
    console.log(JSON.stringify({ lesson: lesson.id, kind, argument, ...existenceMap(argument) }));
  }
