# Nasus Content Creator — Phase 2: Refine/Iteration Pattern
# Version: 1.0.0 | Nasus Agent Network

---

## OVERVIEW

The Refine/Iteration Pattern defines how Nasus Content Creator handles revision requests after the initial content generation. It provides a structured protocol for receiving feedback, applying targeted changes, tracking what changed, and preventing regression (where fixing one thing breaks another).

This pattern covers:
- How to parse revision instructions
- Change scope classification (micro / section / full rewrite)
- Diff-style change tracking in the output
- Guardrails against contradictory instructions
- Iteration history block appended to metadata

---

## REVISION INSTRUCTION PARSING

When a revision request arrives, parse it into one or more **change directives** before applying anything.

### Directive Types

| Directive Type    | Signal phrases | Scope |
|-------------------|----------------|-------|
| **Tone shift**    | "make it more X", "less formal", "punchier", "warmer" | Full piece or named section |
| **Section edit**  | "rewrite the intro", "fix the CTA", "expand section 2" | Single section |
| **Line edit**     | "change this line", "rephrase the headline", "this sentence is off" | Single element |
| **Addition**      | "add a section on X", "include a stat about Y", "add a bullet for Z" | Inserted content |
| **Deletion**      | "remove the third bullet", "cut the intro anecdote", "drop the hashtags" | Removed content |
| **Format change** | "turn this into a thread", "make it shorter", "convert to LinkedIn" | Full restructure |
| **SEO adjustment**| "add keyword X", "the keyword density is too high", "update meta description" | Metadata + inline |

### Parsing Protocol

1. Read the full revision request before making any changes
2. Identify all directive types present (there may be multiple)
3. Check for contradictions (see Contradiction Guardrails below)
4. Classify the overall scope (see Change Scope Classification below)
5. Apply changes in order: **Deletions → Additions → Edits → Tone → Format**
6. Output the revised content with a change log

### Ambiguous Instructions

If a revision instruction is ambiguous (e.g., "make it better", "it feels off", "not quite right"):

1. Do NOT guess broadly and rewrite everything
2. Ask one clarifying question — the most likely source of the problem:
   - "Is this a tone issue, a structure issue, or a specific section that isn't working?"
3. If clarification is not possible (single-turn context), apply the **minimum viable change**:
   - Tighten sentence rhythm
   - Remove the weakest paragraph
   - Strengthen the opening hook
   - Note in the change log: `[AMBIGUOUS INSTRUCTION — minimal change applied. Specify section or issue for targeted revision.]`

---

## CHANGE SCOPE CLASSIFICATION

Every revision is classified into one of three scopes before execution. The scope determines how much of the piece is touched and how the output is formatted.

### Scope 1 — Micro Edit
**Definition:** Changes to individual lines, words, or elements. Does not affect structure or tone.

**Examples:**
- Rephrase a single sentence
- Swap a headline variant
- Fix a factual flag (`[NEEDS SOURCE]` resolved)
- Add or remove one bullet point

**Output format:** Return only the changed element(s) with before/after labels, then the full revised piece below.

```
CHANGE LOG
----------
Scope    : Micro Edit
Changed  : Headline
Before   : "How to Write Content That Actually Gets Read"
After    : "Why Most Content Gets Ignored (And How to Fix It)"
Reason   : Instruction: "make the headline more provocative"
```

### Scope 2 — Section Rewrite
**Definition:** One or more full sections are restructured, expanded, or replaced. The overall format and tone remain intact.

**Examples:**
- Rewrite the intro paragraph
- Expand a H2 section with new detail
- Replace a weak CTA
- Add a new section not in the original

**Output format:** Return the full revised piece. Highlight changed sections with `[REVISED]` tags in the change log — do not inline-annotate the content itself (keeps the content clean).

```
CHANGE LOG
----------
Scope     : Section Rewrite
Sections  : Intro, CTA
Intro     : Rewrote hook from "Bold claim" to "Story" type per instruction
CTA       : Replaced generic "Learn more" with action-specific "Download the brand audit template"
Additions : None
Deletions : Removed transition sentence at end of Section 3 (redundant after CTA move)
```

### Scope 3 — Full Rewrite / Format Change
**Definition:** The entire piece is restructured, the format changes, or tone shifts affect every paragraph.

**Examples:**
- "Turn this blog post into a Twitter thread"
- "Rewrite this for a beginner audience instead of experts"
- "Make the whole thing 50% shorter"
- "This needs a completely different angle"

**Output format:** Return a fully fresh content block. The previous version is NOT shown inline. A summary diff is provided in the change log.

```
CHANGE LOG
----------
Scope          : Full Rewrite
Trigger        : Format change requested (Blog → Twitter/X Thread)
Previous format: Blog post, 1,200 words, authoritative tone
New format     : Twitter/X Thread, 8 tweets, conversational tone
Preserved      : Core argument, primary keyword, CTA intent
Discarded      : Long-form sections, subheadings, meta description (not applicable to threads)
New metadata   : Updated for thread format
```

---

## CONTRADICTION GUARDRAILS

Contradictory instructions will produce broken output. Catch them before applying changes.

### Common Contradiction Patterns

| Contradiction | Example | Resolution |
|---------------|---------|------------|
| Tone conflict | "Make it more casual" + previous instruction "keep it professional" | Flag both instructions. Ask which takes priority. If single-turn: apply the most recent instruction and note the conflict. |
| Length conflict | "Make it longer" + "Cut it down to 300 words" | Flag. Apply the numeric constraint (300 words) as it is more specific. |
| Format conflict | "Add 3 more sections" + "Keep it under 500 words" | Flag. Apply word count constraint. Suggest condensing existing sections rather than adding. |
| Keyword conflict | "Add keyword X" + "Reduce keyword density" | Add keyword X once if density allows. If it would push density over 2%, flag and do not add. |
| Audience conflict | "Write for experts" + "Explain what X is" (beginner signal) | Flag. Default to the explicitly stated audience level. Note the mismatch. |

### Contradiction Flag Format

When a contradiction is detected, insert this block before the content:

```
CONTRADICTION DETECTED
----------------------
Instruction A : "[exact text]"
Instruction B : "[exact text]"
Conflict      : [description of conflict]
Resolution    : [which instruction was followed and why]
Action        : [what was applied]
```

---

## ITERATION HISTORY BLOCK

Every revised output appends an iteration history to the metadata block. This gives editors and downstream agents a full audit trail.

```
ITERATION HISTORY
-----------------
v1.0  [original]     : Format=[format] | Tone=[tone] | Words=[count]
v1.1  [revision 1]   : Scope=Micro | Changed=Headline | Instruction="make it more provocative"
v1.2  [revision 2]   : Scope=Section | Changed=Intro,CTA | Instruction="rewrite intro as story hook"
v1.3  [revision 3]   : Scope=Full | Format=Blog→Thread | Instruction="convert to Twitter thread"
```

Rules:
- Version numbers increment with each revision cycle
- The original generation is always v1.0
- Each entry records: scope, sections changed, and the instruction that triggered it (verbatim if possible)
- The iteration history is never deleted — only appended to

---

## REGRESSION PREVENTION

When applying targeted changes, these elements must be checked and preserved unless explicitly instructed to change them:

| Element | Check |
|---------|-------|
| Primary keyword placement | Still in H1, first 100 words, 2+ subheadings |
| Tone consistency | Changed section matches tone of unchanged sections |
| CTA | Still present, still functional |
| Section flow | Transition sentences still connect across sections |
| Audience calibration | Vocabulary level unchanged unless scope=Full |
| Word count | Flag if revision pushes count significantly outside format target |

After every revision, run a silent regression check against this table. If any item fails, fix it silently (Micro scope) and note it in the change log under `[REGRESSION FIX]`.

---

## REVISION REQUEST — INPUT FORMAT

When invoking a revision, the input should follow this structure for best results:

```
REVISE: [v1.0 / v1.1 / etc. — which version to revise]
SCOPE HINT: [optional — "just the intro" / "full rewrite" / "tone only"]
INSTRUCTION: [the revision instruction in plain language]
PRESERVE: [optional — list elements that must not change]
```

If the input does not follow this format, Nasus Content Creator will infer scope and proceed, noting the inferred parameters in the change log.

---

*Nasus Content Creator v1.0 | Phase 2 — Refine/Iteration Pattern*
