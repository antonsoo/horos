# What the board means

Horos uses one modern, classical membership semantics. It does not label a
checkbox “Aristotelian logic” and then equate that historical subject with a
particular rule for empty classes.

## Propositions

Let S be the subject class and P the predicate class. U is a nonempty universe.

| English         | Region condition        | Empty S |
| --------------- | ----------------------- | ------- |
| Every S is P    | S outside P is empty    | True    |
| No S is P       | S inside P is empty     | True    |
| Some S is P     | S inside P is occupied  | False   |
| Some S is not P | S outside P is occupied | False   |

“Some” is existential, not “some but not all”. The checkboxes add separate
requirements that A, B, or C is inhabited. With all unchecked, all three classes
may be empty while an object lies outside them. The entirely empty board is an
editable draft, not an admissible universe.

The internal region index has bit 0 for A, bit 1 for B, and bit 2 for C.
An occupied region has one representative, labeled index + 1. These labels
identify positions, not persistent people or objects transported between worlds.

| Object label | A   | B   | C   |
| ------------ | --- | --- | --- |
| 1            | No  | No  | No  |
| 2            | Yes | No  | No  |
| 3            | No  | Yes | No  |
| 4            | Yes | Yes | No  |
| 5            | No  | No  | Yes |
| 6            | Yes | No  | Yes |
| 7            | No  | Yes | Yes |
| 8            | Yes | Yes | Yes |

Circle areas are possible membership regions. An empty-looking area contains
no object. Circles stay geometrically fixed even when a universal requires
some regions to be empty; the shape does not assert nonempty intersections.

## Completeness

Partition any nonempty universe into the eight membership regions. Replace
each nonempty region by one representative and discard its other objects.
Each universal's absence of violations is preserved. Each particular's
existence of a witness is preserved. Each selected class-existence condition
is preserved. The resulting universe has at most eight objects and exactly
the same truth values for every proposition supported here.

Conversely, each nonzero eight-bit occupancy mask gives a concrete finite
universe. Therefore enumerating masks 1 through 255 is a decision procedure
for the defined language, including its existence requirements. It is not a
bound guessed from testing small domains.

This argument does not extend unchanged to identity, counting quantifiers,
binary relations, modality, or changing time. Those are outside the app.

If the premises have no permitted world, the core reports “inconsistent”
separately. It does not present absence of counterexamples in an inconsistent
premise set as an ordinary valid deduction with satisfiable premises.

## Construct a counterexample without searching

The live explanation in `src/core/constraints.ts` keeps the premises true and
adds the contradictory of the conclusion. Universals forbid regions; particulars,
class-existence conditions, and nonempty U demand witnesses. If a requirement
has no region left after all exclusions, this attempted counterexample is
impossible. Otherwise one allowed representative per requirement constructs a
world. A representative may satisfy several requirements; the construction is
not guaranteed to use the fewest possible objects.

No incompatibility can arise between the chosen representatives: these
propositions impose no upper bounds or relations between objects. This is a
second decision procedure for the specified model. The app displays the
exclusions and the remaining candidate positions, including the exact blocked
requirement when one exists. See [the audit](audit.md) for the complete reasoning.

## Independent counting oracle

The unit suite counts without evaluating occupancy masks. Universals forbid
regions; particulars and existence conditions each require at least one region
from an allowed set. Nonempty U adds one more occupancy obligation. For allowed
regions L and obligation sets E1 ... Ek, inclusion–exclusion gives:

```text
number = sum over subsets J of {1,...,k}
         (-1)^|J| * 2^|L minus union(Ej for j in J)|
```

Adding the negation of the proposed conclusion counts counterexamples.
Adding the conclusion counts agreeing worlds. This independent arithmetic
matches the enumerator for 1,536 combinations of three figures, three
proposition positions with four possible forms, and eight existence settings.
The conversion lesson has one premise and receives a separate full comparison.
Duplicate representatives are also checked against direct quantification over
larger object arrays.

## Source-to-model concordance

The authority for the selected Greek is Bekker's printed 1831 volume, not the
workshop's computational result. Complete retained pages preserve the surrounding
text. Latin below each premise and in the reader is new teaching text.

| Passage       | Printed page     | What is retained                                                                                               | Modern experiment                                                                       |
| ------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| I.1, 24b18–20 | 24, right column | Definition of deduction: something follows necessarily from what was laid down                                 | Separate agreement in a world from entailment                                           |
| I.2, 25a7–9   | 25, left column  | Universal affirmative conversion yields a particular, not a universal; conditional pleasure/good example       | Reverse Every B is A; compare Every A is B with Some A is B and explicit existence of B |
| I.4, 25b37–40 | 25, right column | A of every B, B of every Greek Gamma, hence A of every Gamma                                                   | All B are A; all C are B; every C is A                                                  |
| I.4, 26a2–9   | 26, left column  | First follows every middle; middle belongs to no last; animal/human/horse and animal/human/stone substitutions | Same premise forms admit both an affirmative and negative A–C relation                  |
| I.6, 28a23–26 | 28, left column  | Ekthesis: taking one of the Sigmas, N, to receive both predicates                                              | One C supplies an A-and-B witness; removing existence changes the modern result         |

### Letter mapping

The scan and Greek transcription retain the original letters. The board uses
A, B, C consistently. The mapping for I.6 matters because its middle term is C:

| Context | Source letter | Board role                                               |
| ------- | ------------- | -------------------------------------------------------- |
| I.4     | Α             | A                                                        |
| I.4     | Β             | B                                                        |
| I.4     | Γ             | C                                                        |
| I.6     | Π             | A                                                        |
| I.6     | Ρ             | B                                                        |
| I.6     | Σ             | C, the middle term                                       |
| I.6     | Ν             | Selected instance; object 8 in the starting illustration |

### The horse and the stone

The two buttons give small illustrative populations. They do not claim to
reproduce a drawn figure by Aristotle or classify every creature. In each,
object 4 can be a human animal. The second representative is a horse in A and
C (object 6), or a stone in C alone (object 5). The word substituted for C
changes; the premise _forms_ remain the same. All three classes are inhabited
in the default settings, so the counterexample does not depend on emptiness.

### Existence and interpretation

In I.6, Aristotle describes taking an instance. The app makes a modern
existence requirement explicit, then shows what happens when it is withdrawn.
This does not show that Aristotle's argument fails on his own assumptions.
The workshop does not settle interpretations of existential import across
Aristotle's works. It supplies a precise comparison that the learner can inspect.

The universal chain remains valid under the app's empty-class convention.
Changing its conclusion to a particular requires C to be inhabited. This is a
claim about the specified semantics, distinct from the historical reading.

## Text and asset policy

Greek excerpts have explicit boundaries; no stitched fragments are presented
as continuous text. Line breaks and line-end hyphens are joined, with normalized
accents and punctuation. There are no silently supplied lacunae in these excerpts.
The English is new. The teaching Latin is also new; 26a2–9 is explicitly abridged.
No medieval translation is being attributed or reconstructed.

The four JPEGs are the unmodified responses to the URLs in
`public/sources/manifest.json`. Although the requested width parameter was 1800,
the service returned **2175 × 2917** images. Native dimensions were checked in
the browser and from the JPEGs; the viewer enlarges to the actual width.
`public/sources/NOTICE.txt` records that distinction.

Neither agreement between transcriptions nor a passing test constitutes
independent expert review of the ancient text or philosophical interpretation.
