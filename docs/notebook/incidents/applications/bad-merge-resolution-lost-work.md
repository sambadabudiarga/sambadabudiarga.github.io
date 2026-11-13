---
title: Bad Merge Resolution — The Conflict Was Fixed, the Code Was Not
summary: One developer resolved a large merge conflict against the integration branch without checking whose code he was overwriting. Two colleagues' completed work was silently reverted, and roughly a third of it came back as bugs. Git recorded nothing unusual, because nothing unusual happened — the resolution commit was perfectly valid.
date: 2026-03-10
tags:
  - git
  - merge-conflict
  - code-review
  - monolith
  - javascript
  - team-process
  - regression
  - single-responsibility
category: applications
severity: Medium
status: Resolved
technologies:
  - Git
  - JavaScript
  - Docker
systems:
  - Internal business application (single-file JavaScript codebase)
  - Staging environment
estimated-reading-time: 8
---

# Bad Merge Resolution — The Conflict Was Fixed, the Code Was Not

## Context

We run around 18 applications. This is one of them, and it holds a large share of the company's day-to-day work.

Three developers worked on it at the same time. In a company of our size that isn't a big allocation — it's half the developers we have. Joe built one feature. Bud fixed three separate defects (A, B, C). John built another feature, markedly simpler than either of the other two.

All of it landed in a codebase where the logic lives in **one large JavaScript file**. Not one module per concern, not one file per feature — one file. Every developer editing that file is editing the same lines that everyone else is editing.

There was a staging environment for this stack, and the workflow was: work on a branch, merge request to `dev`, then up to staging for testing.

Staging availability differs across our estate. We run around 18 applications and not all of them have a staging environment — one of the other incidents in this notebook happened on a stack that didn't, and that absence shaped it. This stack had one, which is why the damage was caught before production and why the failure was in the merge rather than in the deploy.

There was also no merge-request policy. No required reviewer, no diff review, no checklist. "Merge request" was a mechanism for moving code, not a gate.

## Symptoms

Bud noticed it first. His fixes were gone.

Not reverted in a way anyone had asked for — just absent. Code that had been written, tested, and merged was no longer there.

He checked with Joe, who had merged his feature around the same time. Joe's code was not missing. It was worse than missing: it was *changed* — partially present, combined with older logic in a way that turned a working feature into a defective one. A feature had been converted into a bug.

There was no commit that said "remove Bud's work". Nothing to point at. The history looked normal.

## Evidence

- Bud's changes to the shared file were no longer present.
- Joe's changes were partially present — fragments survived, others had reverted to their pre-merge state, producing incorrect behaviour.
- John's feature was fully present and working.
- The three developers' merge requests to `dev` had all been merged. One of them arrived with conflicts; those conflicts were resolved on John's own feature branch, by merging `dev` **into** it, and the resolution was pushed as part of that branch.
- There was no review record, because there was no review.

## Hypotheses

The initial assumption was that the work had been overwritten or lost — a filesystem problem, a bad deploy, someone working on an older copy of the file.

The idea that the code was never lost, but rather *deliberately resolved away* during a merge, took longer to form. That's the uncomfortable part: the loss had a legitimate-looking author and a perfectly valid commit.

## Timeline

Approximate; exact dates were not recorded and the relative order of the first two merges is not reliable in my memory.

- **Weeks 1–2.** Joe and Bud work in parallel. Both test locally, both merge to `dev`. One merge succeeds cleanly; the other conflicts. The two developers talk to each other, resolve the conflict together, and move on. No problems result — and this is worth pausing on, because it's the control group.
- **Weeks 1–5.** John works on the simpler feature. He does not merge to `dev` at any point during those weeks. He was reminded to merge early; he preferred to finish first, and the reminder didn't take.
- **End of week 5.** John's feature is finished. He attempts the merge to `dev`. It conflicts, heavily.
- **Same day.** Rather than resolving the conflict inside the merge request, he merges `dev` into his own feature branch to bring it up to date. That merge conflicts hard, across the shared file.
- **Resolution.** He resolves the conflicts intending to preserve his own feature. Colleagues' changes in the same regions are accepted in their older form, or dropped. He does not ask Joe or Bud, and does not check what their code was supposed to do. He commits the result and the branch merges to `dev` cleanly.
- **Detection.** Bud notices his code is missing. He and Joe investigate, discover roughly 30% of their combined work is either gone or altered into defects.
- **Recovery.** Manual. Effectively a rebuild of the affected work, because the damage was not localized — it was scattered through one large file with no clear boundary.
- **Release.** The release was postponed. Nothing reached production.

## Experiments

**Tracing the loss.** The useful approach was not "who deleted this" but "what does this line look like compared to before". The file had been returned to an earlier state in places, which points to a conflict resolution choosing the wrong side — not to a deletion.

**Checking whether it had reached production.** It had not. The defects were found before the release moved on, and the release was postponed.

**Recovery by reconstruction.** Re-applying the work, rather than reverting the merge, because there was no single commit to revert that would restore the correct combination of three people's work. Reverting the merge would have removed John's feature too; keeping it meant rebuilding the rest around it.

## Dead Ends

- **"Someone lost the files."** Nothing was lost. Every byte was committed, by someone, on purpose.
- **"There's a bad commit, find and revert it."** There wasn't. The resolution commit is a legitimate commit that does what it says; it's simply wrong about the world.
- **"Git will show what was removed."** Git shows the diff of a resolution against *one* side. It does not know what the code was supposed to mean, and by the time anyone looks, the resolution is just history.

## Technical Findings

**The conflict was not the failure. The resolution was.** Merge conflicts are not damage; they're a signal that two people changed the same region. That signal was present and visible. What failed was everything after it.

Three mechanisms combined to hide the damage:

1. **Resolving on the feature branch instead of in the merge request.** By merging `dev` into his own branch, John moved the resolution *inside* his own diff. The deletions of colleagues' work then appear as part of his feature branch's changes — indistinguishable, at a glance, from edits he made himself. A reviewer looking at the branch diff sees a feature; the interesting part is buried in it.
2. **A single shared file.** With one large file, "the same region" is not a small intersection — it means the three developers' work is physically interleaved. Conflict regions are large, resolution requires understanding all three intents, and the result is not verifiable by eye. This is the structural cause, and it predates any of the people involved.
3. **No review of the resolution.** The merge request had no required reviewer and no rule. Merging to staging happened without anyone reading the resulting code. The only thing being checked was whether the developer's own concern worked.

**Nothing automated was in the path.** This application has no automated test suite. Verification was manual, and it was performed by each developer against their own concern — which is exactly the wrong instrument for this failure. A merge resolution has to be verified against *everyone's* concern, and no routine in our process did that. The damage was found because a person opened the file looking for his own code, not because anything checked the result.

**The failure was not detectable by looking at who did what.** Joe also did the same thing later, on a smaller scale, on the same file. Bud and Joe's own conflict, resolved together in conversation, went fine. The variable wasn't competence; it was whether the person resolving had anyone else's intent in front of them.

## Root Cause

A merge conflict involving three developers' overlapping work in one large file was resolved by one person, alone, with the intent of preserving only his own changes — and no review, no policy, and no test boundary existed to catch what that resolution removed.

Beneath that: a codebase that forces every change into one file guarantees that this conflict, not some other one, is the shape of the problem.

## Resolution

Manual reconstruction of the affected work. Roughly 30% of Joe's and Bud's combined changes were missing or converted into defects, scattered rather than clustered, which is why recovery was closer to redoing the work than to repairing it.

The release was postponed until the affected features were restored and re-verified.

## Verification

Manual re-testing of the restored features and of the new feature, after which the postponed release moved on. There was no automated check of the merge result and no record of the previous passing state to compare against — the verification that actually mattered was a person reading the file and remembering what used to be there.

## Prevention

**What was done:** a one-on-one with the developer involved, focused on the specific behaviour — check what the conflicting code *does*, and ask the colleague before accepting a side, rather than resolving outward from your own code. That is a correct instruction. It is also not a control.

**What it achieved:** a correct instruction to one person, and nothing that outlives that person's attention. The conversation addressed the behaviour. It did not touch the conditions: the file was still shared, merge requests still had no reviewer, and the highest-risk moment in the workflow was still unsupervised. Guidance given individually lasts exactly as long as the individual's awareness of it.

**The conclusion I had at the time, and why it was half wrong.** I concluded that there was no way to make this process safer in Git. The accurate version is narrower: Git cannot validate the *meaning* of a resolution. It will record, without complaint, a resolution that deletes a colleague's completed work, because the resulting tree is syntactically valid. Nothing in Git knows that an intent was dropped, and no version control system does.

But Git can do considerably more than we asked of it: require a reviewer on merge requests, restrict who may merge, refuse to merge with conflicts unresolved, refuse to merge without a passing pipeline, and keep the target branch current enough that a resolution stays one reviewable commit. None of that makes a wrong resolution impossible. All of it puts a second person and a machine in front of the moment where the loss actually happens. The gap was a policy gap, not a capability gap — and it existed because nothing had gone wrong yet.

**What the incident actually produced:** the decision to migrate this JavaScript application to a framework that supports separating concerns properly, so that three developers can work in parallel without editing the same file. That decision is a separate story, and this incident is where it started. A monolith doesn't only make the code hard to maintain — it makes collaboration structurally conflict-prone, and every conflict is an opportunity to silently delete someone's work.

## Lessons Learned

- **The merge commit is code.** It needs the same review as any other code, and it's the one commit where a mistake removes *other people's* work — including work that already passed review.
- **Resolving conflicts on your own branch hides the resolution.** Merging the target branch into your feature branch is convenient, but it moves someone else's deletions into your diff, where they look like your edits.
- **"Resolved" does not mean "no conflict markers left".** It means you verified that both sides' intent survived. The first meaning is about syntax; the second is about behaviour, and only the second one matters.
- **A long-lived branch makes the conflict inevitable and the resolution enormous.** Five weeks of divergence in a single file produces a conflict nobody can resolve correctly from memory. Merging to the integration branch continuously isn't tidiness; it keeps the conflict small enough to be resolvable.
- **Conflict resolution is the highest-risk moment for other people's code**, and it's the one moment with no review process, no test of its own, and no visible signal in history.
- **With no automated tests, the only detector is a person noticing.** The damage was found because Bud opened the file and looked for his own code. A process whose last line of defence is someone happening to check is not a control.
- **Blame is the wrong lens.** The developer who complained about it had done the same thing himself, at a smaller scale. And coaching one person can change one person's attention; it cannot change what the file makes inevitable. In a single shared file, this is not a personality trait; it's the predictable output of the structure.

## What this record is missing

Exact dates and the precise order of the first two merges to `dev` — one conflicted and one didn't, and I no longer trust my memory on which came first. It doesn't change the mechanism, but it's the kind of detail I would rather leave marked than guess.

Recovery duration is also unrecorded. It was long enough that "almost a rebuild" is the honest description.

## Technologies

- Git (merge, conflict resolution, merge requests)
- JavaScript (single-file application logic)
- Docker

## References

*Internal. No public references available.*
