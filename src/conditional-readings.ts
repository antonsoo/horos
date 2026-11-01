export interface ConditionalWord {
  greek: string;
  latin: string;
  note: string;
}
export interface ConditionalReading {
  id: string;
  title: string;
  reference: string;
  page: 92 | 93;
  /** Approximate vertical position as a fraction of the complete image. */
  focus: number;
  greek: string;
  english: string;
  latin: string;
  note: string;
  words: ConditionalWord[];
}

export const conditionalEdition =
  "Sextus Empiricus, Outlines of Pyrrhonism (Πυρρώνειοι ὑποτυπώσεις) II.110–114. Hermann Mutschmann, Sexti Empirici Opera, volume I (Leipzig: B. G. Teubner, 1912), complete printed pages 92–93. This is a modern printed witness to an ancient report, not a surviving work by Philo or Diodorus.";
export const conditionalPolicy =
  "The Greek was checked against the retained printed pages. Line endings are joined; punctuation and typographic apostrophes are normalized. Square brackets in the fourth account retain the editor’s deletion of ἀξίωμα. The English and teaching Latin are new. The Latin is a teaching translation, not an ancient or Renaissance witness. No independent scholarly review is claimed.";

export const conditionalReadings: ConditionalReading[] = [
  {
    id: "philo",
    title: "Philo: one forbidden combination",
    reference: "II.110",
    page: 92,
    focus: 0.18,
    greek:
      "ὁ μὲν γὰρ Φίλων φησὶν ὑγιὲς εἶναι συνημμένον τὸ μὴ ἀρχόμενον ἀπὸ ἀληθοῦς καὶ λῆγον ἐπὶ ψεῦδος, οἷον ἡμέρας οὔσης καὶ ἐμοῦ διαλεγομένου τὸ ‘εἰ ἡμέρα ἔστιν, ἐγὼ διαλέγομαι’.",
    english:
      "Philo says that a sound conditional is one that does not begin from something true and end in something false: for example, when it is day and I am talking, ‘If it is day, I am talking.’",
    latin:
      "Philo sanum esse conexum dicit quod non a vero incipit et in falsum desinit; velut, cum dies sit et ego disseram: ‘Si dies est, ego dissero.’",
    note: "‘Begins’ and ‘ends’ name the clauses, not events occurring in sequence. Here ὑγιές means sound or acceptable as a conditional; this is different from the validity of an argument with several premises. Talking translates διαλέγομαι, which can mean conversing or discussing.",
    words: [
      {
        greek: "συνημμένον",
        latin: "conexum",
        note: "synēmménon: something joined together; here a conditional statement. A perfect passive participle used as a noun.",
      },
      {
        greek: "ὑγιὲς",
        latin: "sanum",
        note: "hygiès: sound, literally healthy. Sextus is reporting rival standards for an acceptable conditional.",
      },
      {
        greek: "ἀπὸ ἀληθοῦς",
        latin: "a vero",
        note: "apò alēthoûs: from something true. The first clause is the antecedent; it is not an earlier event.",
      },
      {
        greek: "ἐπὶ ψεῦδος",
        latin: "in falsum",
        note: "epì pseûdos: to something false. Philo excludes the true-antecedent / false-consequent combination.",
      },
      {
        greek: "ἡμέρας οὔσης",
        latin: "cum dies sit",
        note: "hēméras oúsēs: ‘it being day’. This genitive absolute sets the facts for the example.",
      },
      {
        greek: "διαλέγομαι",
        latin: "dissero",
        note: "dialégomai: I converse or discuss. The workshop shortens this to ‘I am talking’. It does not mean that daylight causes the speech.",
      },
    ],
  },
  {
    id: "diodorus",
    title: "Diodorus: more than this moment",
    reference: "II.110–111, excerpt",
    page: 92,
    focus: 0.27,
    greek:
      "ὁ δὲ Διόδωρος, ὃ μήτε ἐνεδέχετο μήτε ἐνδέχεται ἀρχόμενον ἀπὸ ἀληθοῦς λήγειν ἐπὶ ψεῦδος· καθ’ ὃν τὸ μὲν εἰρημένον συνημμένον ψεῦδος εἶναι δοκεῖ, ἐπεὶ ἡμέρας μὲν οὔσης ἐμοῦ δὲ σιωπήσαντος ἀπὸ ἀληθοῦς ἀρξάμενον ἐπὶ ψεῦδος καταλήξει.",
    english:
      "Diodorus, however, [calls sound] one which neither was nor is capable of beginning from something true and ending in something false. On his account the conditional just mentioned seems false: when it is day but I have fallen silent, it will begin from something true and end in something false.",
    latin:
      "Diodorus autem id [sanum dicit] quod neque poterat neque potest a vero incipiens in falsum desinere. Secundum eum illud conexum falsum esse videtur: die enim manente, si tacuerim, a vero incipiens in falsum desinet.",
    note: "The words in square brackets complete the elliptical Greek in English and Latin. Sextus's criterion includes past and present possibility, and his example invokes becoming silent. A finite table of chosen cases cannot certify this temporal and modal claim. The workshop therefore gives Diodorus no computed verdict.",
    words: [
      {
        greek: "μήτε ἐνεδέχετο μήτε ἐνδέχεται",
        latin: "neque poterat neque potest",
        note: "mḗte enedékheto mḗte endékhetai: neither was it possible nor is it possible. The tense change is part of the criterion, not an instruction to count a few observed moments.",
      },
      {
        greek: "σιωπήσαντος",
        latin: "si tacuerim",
        note: "siōpḗsantos: having fallen silent. Day may remain while speech stops; the first clause can stay true as the second becomes false.",
      },
    ],
  },
  {
    id: "atoms",
    title: "A deliberately uncomfortable example",
    reference: "II.111, excerpt",
    page: 92,
    focus: 0.36,
    greek:
      "ἐκεῖνο δὲ ἀληθές ‘εἰ οὐκ ἔστιν ἀμερῆ τῶν ὄντων στοιχεῖα, ἔστιν ἀμερῆ τῶν ὄντων στοιχεῖα’· ἀεὶ γὰρ ἀπὸ ψεύδους ἀρχόμενον τοῦ ‘οὐκ ἔστιν ἀμερῆ τῶν ὄντων στοιχεῖα’ εἰς ἀληθὲς καταλήξει κατ’ αὐτὸν τὸ ‘ἔστιν ἀμερῆ τῶν ὄντων στοιχεῖα’.",
    english:
      "But this [conditional seems] true: ‘If there are no partless elements of existing things, there are partless elements of existing things.’ For on his account it will always begin from the false ‘There are no partless elements of existing things’ and end in the true ‘There are partless elements of existing things.’",
    latin:
      "Illud autem [conexum verum videtur]: ‘Si non sunt rerum elementa sine partibus, sunt rerum elementa sine partibus.’ Secundum eum enim semper a falso incipiet et in verum desinet.",
    note: "Sextus reports what is true ‘on his account’ (Diodorus's); the workshop does not assert that ancient atomism or its negation is true. This example separates a fixed false antecedent from the alleged connection. It is preserved in the reading but is not assigned an empirical truth value by the controls. The Latin condenses the repeated quoted clauses.",
    words: [
      {
        greek: "ἀμερῆ",
        latin: "sine partibus",
        note: "amerê: without parts, partless. This reports the example's philosophical vocabulary, rather than measurements of modern physical atoms.",
      },
      {
        greek: "κατ’ αὐτὸν",
        latin: "secundum eum",
        note: "kat’ autòn: according to him. The attribution prevents a reported premise from becoming the reader's own assertion.",
      },
    ],
  },
  {
    id: "connection",
    title: "Connection: try the opposite of the ending",
    reference: "II.111–112, excerpt",
    page: 92,
    focus: 0.46,
    greek:
      "οἱ δὲ τὴν συνάρτησιν εἰσάγοντες ὑγιὲς εἶναί φασι συνημμένον, ὅταν τὸ ἀντικείμενον τῷ ἐν αὐτῷ λήγοντι μάχηται τῷ ἐν αὐτῷ ἡγουμένῳ· καθ’ οὓς τὰ μὲν εἰρημένα συνημμένα ἔσται μοχθηρά, ἐκεῖνο δὲ ἀληθές ‘εἰ ἡμέρα ἔστιν, ἡμέρα ἔστιν’.",
    english:
      "Those who introduce connection say that a conditional is sound when the opposite of its consequent conflicts with its antecedent. On their account the conditionals mentioned above will be bad, but this one true: ‘If it is day, it is day.’",
    latin:
      "Qui autem conexionem introducunt sanum esse conexum dicunt, cum id quod consequenti opponitur cum antecedente pugnet. Secundum eos superiora conexa vitiosa erunt, hoc autem verum: ‘Si dies est, dies est.’",
    note: "Sextus does not name these proponents here. The finite experiment represents ‘conflicts’ by excluding every admitted case with a true antecedent and false consequent. That is an explicit modern compatibility model, not a complete reconstruction of ancient connection, relevance, or necessity. Choosing the table is an additional assumption.",
    words: [
      {
        greek: "συνάρτησιν",
        latin: "conexionem",
        note: "synártēsin: connection or coherence. The question is stronger than whether the two clauses happen to agree right now.",
      },
      {
        greek: "τὸ ἀντικείμενον",
        latin: "id quod opponitur",
        note: "tò antikeímenon: what is opposed. In the experiment the opposite of ‘I am talking’ is ‘I am not talking’.",
      },
      {
        greek: "λήγοντι",
        latin: "consequenti",
        note: "lḗgonti: the ending clause, the consequent. The dative goes with ‘what is opposed to’.",
      },
      {
        greek: "μάχηται",
        latin: "pugnet",
        note: "mákhētai: conflicts or fights. The model tests co-admission in a finite case set; it cannot independently decide what is truly incompatible.",
      },
      {
        greek: "ἡγουμένῳ",
        latin: "antecedente",
        note: "hēgouménōi: the leading clause, the antecedent. A true antecedent with a false consequent is the witness to look for.",
      },
    ],
  },
  {
    id: "containment",
    title: "A fourth account resists the easy answer",
    reference: "II.112–113, excerpt",
    page: 92,
    focus: 0.58,
    greek:
      "οἱ δὲ τῇ ἐμφάσει κρίνοντές φασιν ὅτι ἀληθές ἐστι συνημμένον οὗ τὸ λῆγον ἐν τῷ ἡγουμένῳ περιέχεται δυνάμει· καθ’ οὓς τὸ ‘εἰ ἡμέρα ἔστιν, ἡμέρα ἔστι’ καὶ πᾶν τὸ διαφορούμενον [ἀξίωμα] συνημμένον ἴσως ψεῦδος ἔσται· αὐτὸ γάρ τι ἐν ἑαυτῷ περιέχεσθαι ἀμήχανον.",
    english:
      "Those who judge by indication say that a conditional is true when its consequent is contained potentially in its antecedent. On their account, ‘If it is day, it is day’ and every repeated conditional will perhaps be false: for a thing's being contained in itself is impossible.",
    latin:
      "Qui ex indicatione iudicant verum esse conexum dicunt cuius consequens in antecedente potentia continetur. Secundum eos ‘Si dies est, dies est’ et omne conexum repetitum fortasse falsum erit: nihil enim in se ipso contineri potest.",
    note: "‘Indication’ translates the difficult ἔμφασις here; ‘force’ or ‘meaning’ are other renderings. Sextus presents this as another reported account, and uses ‘perhaps’ for his objection. His report of its treatment of the repeated conditional must not be silently replaced by the modern identity result. This room computes no verdict for this account. The editor brackets ἀξίωμα for deletion; the English omits that bracketed noun. ‘Repeated’ is an interpretive rendering of διαφορούμενον in light of the day/day example, not its unambiguous everyday meaning. The apparatus records διφορούμενον in EAB and a different spelling in L; the displayed Greek follows the printed main text.",
    words: [
      {
        greek: "διαφορούμενον",
        latin: "repetitum",
        note: "diaphoroúmenon: rendered ‘repeated’ here from the day/day example. The main text prints διαφορούμενον; the apparatus at printed page 92, line 17 records διφορούμενον in EAB and διαφορόμενον in L (with an erased letter). Read this as a textual and interpretive difficulty, not a settled vocabulary equivalence.",
      },
      {
        greek: "ἐμφάσει",
        latin: "indicatione",
        note: "emphásei: by indication, force, or meaning. Translating the term does not settle which precise relation its proponents intended.",
      },
      {
        greek: "δυνάμει",
        latin: "potentia",
        note: "dynámei: potentially, in capacity. This is not a numerical ‘power’ used by the program.",
      },
      {
        greek: "ἴσως",
        latin: "fortasse",
        note: "ísōs: perhaps. Keep the qualification in Sextus's reported objection.",
      },
    ],
  },
  {
    id: "dispute",
    title: "Who gets to choose the test?",
    reference: "II.114, excerpt",
    page: 93,
    focus: 0.13,
    greek:
      "ζητουμένου δὲ περὶ τοῦ πῶς κρινοῦμεν τὴν ἀκολουθίαν τοῦ λήγοντος πρὸς τὸ ἡγούμενον, ὁ διάλληλος εὑρίσκεται τρόπος. ἵνα μὲν γὰρ ἡ κρίσις τοῦ συνημμένου ἀποδειχθῇ, τὸ συμπέρασμα τοῖς λήμμασι τῆς ἀποδείξεως ἀκολουθεῖ, ὡς προειρήκαμεν· ἵνα δὲ πάλιν τοῦτο πιστευθῇ, δεῖ τὸ συνημμένον καὶ τὴν ἀκολουθίαν ἐπικεκρίσθαι· ὅπερ ἄτοπον.",
    english:
      "When it is being asked how we shall judge the consequent's following from the antecedent, the circular mode is found. To prove the criterion for the conditional, the conclusion follows from the proof's premises, as we said before; but for that in turn to be trusted, the conditional and the following must already have been judged. That is absurd.",
    latin:
      "Cum quaeratur quomodo consequentiam iudicemus, modus circularis invenitur. Ut enim iudicium conexi probetur, conclusio probationis ex praemissis sequitur; ut autem hoc credatur, conexum et consequentia iam iudicata esse debent. Quod absurdum est.",
    note: "This is Sextus's challenge to the use of a disputed consequence relation to certify its own criterion. It is not the workshop declaring that all logic or proof is impossible. The Latin is an abridgment. The program's finite search proves a result only after its modern rules and considered cases have been fixed.",
    words: [
      {
        greek: "ἀκολουθίαν",
        latin: "consequentiam",
        note: "akolouthían: following or consequence. The dispute asks what entitles us to say the consequent follows.",
      },
      {
        greek: "διάλληλος",
        latin: "circularis",
        note: "diállēlos: reciprocal or circular. Here a proof appeals to the very relation whose test is disputed.",
      },
    ],
  },
];
