# Existence comparison: design and scope

The current class workshop checks one existence mask at a time. Changing a
checkbox changes a verdict, but does not expose which requirements suffice or
whether the extra requirements were doing any work. Extend the four existing
investigations rather than adding another room.

Keep the workshop's existing Literata reading type and Source Sans controls.
Use paper `#f4f3ed`, ink `#26342f`, board `#eeeee4`, muted `#58635c`, green
`#295b4b` for sufficient settings and red `#9b3325` for refutations. Existing
source images and Greek remain the authority; no decorative antiquity or new
illustrative historical claims.

Layout, left aligned:

    Which inhabitant does the work?
    [current premises and proposed conclusion]
    [weakest sufficient requirements, in words]
    Require          Does it follow?       Smallest refutation
    None             No                    [Load object 1]
    A                No                    [Load objects ...]
    B                Yes, weakest          No refutation
    ... all eight settings ...
    [read the related Greek passage]

Review: a lattice of eight decorative cards would make subset relations look
like a dashboard and make comparison harder on a phone. A three-column table
expresses the actual question; order rows by number of required classes and
name each requirement explicitly. Keep all controls at least 44px high. Label
the selected row in words, not color alone. Preserve focus after table actions.

Changing requirements keeps every object. Loading a refutation explicitly
changes both the requirements and the world and says so. Both actions enter
the existing undo history. The notebook's current and pinned snapshots already
store the complete inputs; no file format migration or separate state is needed.
The script-free illustrated export recomputes the full comparison for each
snapshot, including witness inventories and weakest requirements.

This is a modern finite model with a nonempty universe and possibly empty
named classes. Satisfiability is checked before calling a setting sufficient;
inconsistent settings cannot count as a successful repair. Unchecked does not
mean empty. Counts describe occupancy patterns, never probabilities or people.
The feature makes no new claim about Aristotle's treatment of existential import.
