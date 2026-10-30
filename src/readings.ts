export interface WordNote {
  phrase: string;
  latin: string;
  note: string;
}
export interface Reading {
  id: string;
  title: string;
  location: string;
  page: number;
  /** Approximate excerpt area in the retained 2175 x 2917 page, including adjoining context. */
  focus: { x: number; y: number; width: number; column: "left" | "right" };
  greek: string;
  english: string;
  latin: string;
  note: string;
  words: WordNote[];
}
export const readings: Reading[] = [
  {
    id: "deduction",
    title: "What has to follow",
    location: "I.1 · 24b18–20",
    page: 24,
    focus: { x: 1110, y: 1640, width: 1030, column: "right" },
    greek:
      "συλλογισμὸς δέ ἐστι λόγος ἐν ᾧ τεθέντων τινῶν ἕτερόν τι τῶν κειμένων ἐξ ἀνάγκης συμβαίνει τῷ ταῦτα εἶναι.",
    english:
      "A deduction is an account in which, when certain things have been laid down, something different from what was laid down follows of necessity because those things are so.",
    latin:
      "Syllogismus est ratio in qua, quibusdam positis, aliquid aliud ab iis quae posita sunt necessario sequitur, eo quod haec ita sunt.",
    note: "The passage distinguishes a consequence that must follow from one that merely happens to be true. ‘Deduction’ translates syllogismos here; this workshop treats only a small, non-modal part of the Prior Analytics. The name Horos comes from ὅρος, ‘term’, defined just before this passage at 24b16–18.",
    words: [
      {
        phrase: "συλλογισμὸς",
        latin: "syllogismus",
        note: "syllogismós: a deduction. The word is broader here than a classroom formula of two premises and one conclusion.",
      },
      {
        phrase: "τεθέντων τινῶν",
        latin: "quibusdam positis",
        note: "tethéntōn tinōn: ‘certain things having been laid down’. A genitive absolute supplies the conditions of the deduction.",
      },
      {
        phrase: "ἐξ ἀνάγκης",
        latin: "necessario",
        note: "ex anánkēs: ‘of necessity’. A true conclusion in one example is weaker than this requirement.",
      },
      {
        phrase: "τῷ ταῦτα εἶναι",
        latin: "eo quod haec ita sunt",
        note: "tō̂i taûta eînai: ‘because these things are so’. The consequence must depend on what was laid down.",
      },
    ],
  },
  {
    id: "two-worlds",
    title: "The horse and the stone",
    location: "I.4 · 26a2–9",
    page: 26,
    focus: { x: 100, y: 270, width: 1030, column: "left" },
    greek:
      "εἰ δὲ τὸ μὲν πρῶτον παντὶ τῷ μέσῳ ὑπάρχει, τὸ δὲ μέσον μηδενὶ τῷ ἐσχάτῳ ὑπάρχει, οὐκ ἔσται συλλογισμὸς τῶν ἄκρων· οὐδὲν γὰρ ἀναγκαῖον συμβαίνει τῷ ταῦτα εἶναι· καὶ γὰρ παντὶ καὶ μηδενὶ ἐνδέχεται τὸ πρῶτον τῷ ἐσχάτῳ ὑπάρχειν, ὥστε οὔτε τὸ κατὰ μέρος οὔτε τὸ καθόλου γίνεται ἀναγκαῖον· μηδενὸς δὲ ὄντος ἀναγκαίου διὰ τούτων οὐκ ἔσται συλλογισμός. ὅροι τοῦ παντὶ ὑπάρχειν ζῷον—ἄνθρωπος—ἵππος, τῷ μηδενὶ ζῷον—ἄνθρωπος—λίθος.",
    english:
      "If the first belongs to every middle, but the middle belongs to none of the last, there will be no deduction connecting the extremes. Nothing necessary follows because these things are so: the first can belong both to every last and to none. Thus neither a particular nor a universal result becomes necessary. With nothing necessary through these premises, there will be no deduction. Terms for belonging to every: animal, human, horse; for belonging to none: animal, human, stone.",
    latin:
      "Si primum omni medio convenit, medium autem nulli extremo, syllogismus extremorum non erit. Nihil enim necessarium ex his sequitur. Termini, ubi primum omni extremo convenit: animal, homo, equus; ubi nulli: animal, homo, lapis.",
    note: "The transcription follows the retained Bekker page: ὑπάρχει at 26a2 and τῷ μηδενὶ at 26a9. The Latin condenses the passage. In the two substitutions A = animal, B = human; C is first horse, then stone. The premise forms stay the same while the interpretation of C changes. Our buttons supply small illustrative membership worlds, not Aristotle's actual diagram or a complete inventory of animals. Starting with all three classes inhabited avoids an empty-class shortcut.",
    words: [
      {
        phrase: "παντὶ τῷ μέσῳ",
        latin: "omni medio",
        note: "pantì tō̂i mésōi: ‘to every middle’. The dative names what the predicate applies to. A belongs to every B means every B is A, not every A is B.",
      },
      {
        phrase: "μηδενὶ",
        latin: "nulli",
        note: "mēdenì: ‘to none’. A universal negative excludes every shared object.",
      },
      {
        phrase: "τῶν ἄκρων",
        latin: "extremorum",
        note: "tō̂n ákrōn: ‘of the extremes’. Here A and C are the extremes; B is the middle term.",
      },
      {
        phrase: "ὅροι",
        latin: "termini",
        note: "hóroi: terms. The sequence animal–human–horse names A, B, C; it is not itself a chain of valid implications.",
      },
      {
        phrase: "λίθος",
        latin: "lapis",
        note: "líthos: stone. Substituting this for horse changes the relation of C to A while preserving the two premise forms.",
      },
    ],
  },
  {
    id: "conversion",
    title: "Reversal, with a smaller claim",
    location: "I.2 · 25a7–9",
    page: 25,
    focus: { x: 45, y: 540, width: 1030, column: "left" },
    greek:
      "τὴν δὲ κατηγορικὴν ἀντιστρέφειν μὲν ἀναγκαῖον, οὐ μὴν καθόλου ἀλλ᾽ ἐν μέρει, οἷον εἰ πᾶσα ἡδονὴ ἀγαθόν, καὶ ἀγαθόν τι εἶναι ἡδονήν.",
    english:
      "The affirmative must convert, though not universally but in part: for example, if every pleasure is a good, some good is also a pleasure.",
    latin:
      "Affirmativam converti necesse est, non tamen universaliter sed particulariter: si omnis voluptas bonum est, aliquod bonum voluptas est.",
    note: "This is a conditional example, not Aristotle endorsing the premise that every pleasure is good. The workshop uses A = good and B = pleasure only as a reading aid. In the modern membership model, the particular conclusion also needs B to have an inhabitant. The checkbox makes that assumption explicit; it does not claim to settle how empty terms function throughout Aristotle's logic. The letter proof is printed nearby at 25a17–19.",
    words: [
      {
        phrase: "ἀντιστρέφειν",
        latin: "converti",
        note: "antistréphein: to convert, or reverse the terms. This is a relation between propositions, not turning a word into its opposite.",
      },
      {
        phrase: "καθόλου",
        latin: "universaliter",
        note: "kathólou: universally. Reversal does not preserve the universal affirmative in the proposed form.",
      },
      {
        phrase: "ἐν μέρει",
        latin: "particulariter",
        note: "en mérei: in part, particularly. ‘Some’ needs a witness; it does not mean ‘some but not all’.",
      },
      {
        phrase: "ἡδονὴ",
        latin: "voluptas",
        note: "hēdonḕ: pleasure. Here it belongs to a hypothetical example, not a conclusion about ethics.",
      },
    ],
  },
  {
    id: "inhabitant",
    title: "Set out one instance",
    location: "I.6 · 28a22–26",
    page: 28,
    focus: { x: 95, y: 1435, width: 1040, column: "left" },
    greek:
      "ἔστι δὲ καὶ διὰ τοῦ ἀδυνάτου καὶ τῷ ἐκθέσθαι ποιεῖν τὴν ἀπόδειξιν· εἰ γὰρ ἄμφω παντὶ τῷ Σ ὑπάρχει, ἂν ληφθῇ τι τῶν Σ οἷον τὸ Ν, τούτῳ καὶ τὸ Π καὶ τὸ Ρ ὑπάρξει, ὥστε τινὶ τῷ Ρ τὸ Π ὑπάρξει.",
    english:
      "The proof can also be made through the impossible and by setting out an instance. For if both belong to every S, and one of the Ss is taken, say N, both P and R will belong to it; so P will belong to some R.",
    latin:
      "Probatio etiam per impossibile et per expositionem fieri potest. Si enim utrumque omni S convenit, et sumitur aliquod S, velut N, huic et P et R convenient; itaque P alicui R conveniet.",
    note: "The excerpt starts with ἔστι at the end of 28a22 and ends at 28a26. The printed terms are Π, Ρ, Σ, with Ν naming the instance. The board renames Π to A, Ρ to B, and Σ to C; object 8 can play the role of Ν. The Greek describes taking an instance. Allowing C to be empty is a modern contrast, not a claim that Aristotle accepts this counterexample against his own inference. This workshop does not adjudicate the scholarly debate about existential import.",
    words: [
      {
        phrase: "τῷ ἐκθέσθαι",
        latin: "per expositionem",
        note: "tō̂i ekthésthai: ‘by setting out’. Often called ekthesis, the move takes an instance to expose the shared predication.",
      },
      {
        phrase: "ἂν ληφθῇ",
        latin: "si sumitur",
        note: "àn lēphthē̂i: ‘if it is taken’. The passive subjunctive occurs in a conditional clause. It is the step to inspect when there is no C to take.",
      },
      {
        phrase: "τι τῶν Σ",
        latin: "aliquod S",
        note: "ti tō̂n S: ‘one of the Ss’. A partitive genitive names the class from which the instance is taken.",
      },
      {
        phrase: "τούτῳ",
        latin: "huic",
        note: "toútōi: ‘to this’. Both predicates apply to the same instance, which supplies the particular conclusion.",
      },
    ],
  },
  {
    id: "chain",
    title: "The universal chain",
    location: "I.4 · 25b37–40",
    page: 25,
    focus: { x: 1100, y: 2220, width: 1030, column: "right" },
    greek:
      "εἰ γὰρ τὸ Α κατὰ παντὸς τοῦ Β καὶ τὸ Β κατὰ παντὸς τοῦ Γ, ἀνάγκη τὸ Α κατὰ παντὸς τοῦ Γ κατηγορεῖσθαι· πρότερον γὰρ εἴρηται πῶς τὸ κατὰ παντὸς λέγομεν.",
    english:
      "For if A is predicated of every B, and B of every C, A must be predicated of every C; we have already said what we mean by ‘of every’.",
    latin:
      "Si A de omni B, et B de omni C praedicatur, necesse est A de omni C praedicari; iam enim dictum est quid significet de omni.",
    note: "The source writes Greek Γ where the board uses C. Take any C. The second premise makes it B, and the first makes it A. If there are no Cs, the modern universal still has no violating instance. A particular conclusion (‘Some C is A’) needs an additional inhabitant. The circles and finite-pattern proof are modern explanations, not diagrams from Bekker's text.",
    words: [
      {
        phrase: "κατὰ παντὸς",
        latin: "de omni",
        note: "katà pantòs: ‘of every’. The genitive after katá expresses the subject range of the predication.",
      },
      {
        phrase: "κατηγορεῖσθαι",
        latin: "praedicari",
        note: "katēgoreîsthai: ‘to be predicated’. The predicate A is said of the subject C; English reverses their surface order in ‘Every C is A’.",
      },
      {
        phrase: "ἀνάγκη",
        latin: "necesse est",
        note: "anánkē: necessity; here ‘it is necessary’. This is what a merely agreeing example cannot show.",
      },
    ],
  },
];
export function reading(id: string): Reading {
  const found = readings.find((r) => r.id === id);
  if (!found) throw new Error("Unknown reading.");
  return found;
}
export const edition =
  "Aristotle, Prior Analytics I. Greek text transcribed from Immanuel Bekker, Aristotelis opera, volume I (Berlin: G. Reimer, 1831), printed pages 24, 25, 26 and 28. Complete page images are retained from Internet Archive item Bekker1831. This is a nineteenth-century printed edition, not an ancient manuscript.";
export const textPolicy =
  "Line breaks and line-end hyphenation are joined; Greek accents and punctuation are normalized for reading, and common ου/στ type ligatures are expanded. Excerpts have explicit boundaries. English and teaching Latin are new translations for this workshop; Latin is not presented as an ancient or medieval textual witness. The two-worlds Latin is an abridgment. The Greek text and printed scans are public domain.";
