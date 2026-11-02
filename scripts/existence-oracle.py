"""Quantify over sets of concrete (A, B, C) triples, independently of the TS evaluator.

Also checks minimal witness size, subset-minimal requirements and upward closure.
Input is actual TS output; no imported implementation or copied truth evaluator.
"""
import itertools
import json
import sys

patterns = list(itertools.product([False, True], repeat=3))
worlds = [set(selection) for n in range(1, 9) for selection in itertools.combinations(patterns, n)]


def satisfies(p, world):
    subject = {x for x in world if x[p["subject"]]}
    predicate = {x for x in world if x[p["predicate"]]}
    return {
        "all": subject <= predicate,
        "none": subject.isdisjoint(predicate),
        "some": bool(subject & predicate),
        "some-not": bool(subject - predicate),
    }[p["kind"]]


def permitted(argument, world, mask):
    return all(satisfies(p, world) for p in argument["premises"]) and all(
        any(x[t] for x in world) for t in range(3) if mask & (2 ** t)
    )


def decode(number):
    return {x for x in patterns if number & (2 ** sum(int(x[t]) * (2 ** t) for t in range(3)))}


cases = 0
for line in sys.stdin:
    case = json.loads(line)
    argument = case["argument"]
    sufficient = []
    results = {}
    for row in case["rows"]:
        mask = row["mask"]
        admissible = [w for w in worlds if permitted(argument, w, mask)]
        refutations = [w for w in admissible if not satisfies(argument["conclusion"], w)]
        verdict = "inconsistent" if not admissible else "invalid" if refutations else "valid"
        assert row["permitted"] == len(admissible), case
        assert row["counterexamples"] == len(refutations), case
        assert row["verdict"] == verdict, case
        if refutations:
            witness = decode(row["smallest"])
            assert witness in refutations, case
            assert len(witness) == min(map(len, refutations)), case
        else:
            assert row["smallest"] is None, case
        if verdict == "valid":
            sufficient.append(mask)
        results[mask] = verdict
        cases += 1
    minimal = [m for m in sufficient if not any(n != m and n & m == n for n in sufficient)]
    assert set(case["minimal"]) == set(minimal), case
    assert {row["mask"] for row in case["rows"] if row["minimal"]} == set(minimal), case
    for mask in sufficient:
        assert all(results[other] in ("valid", "inconsistent") for other in range(8) if other & mask == mask), case
assert cases == 128, cases
print(f"{cases} requirement settings: set-based truth, counts, smallest witnesses and minimal requirements agree.")
