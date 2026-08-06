# Mentoring

I've run internal sessions for developers I was mentoring. These are practical, not academic — focused on things that save time and reduce mistakes in day-to-day work.

## How to Use Git Effectively

This session came from seeing our main/master branches get messy. Commits like "test commit", "fixing stuff", "wip" — no structure, no context. It worked because no one was auditing it, but it's not a habit worth keeping.

Two things I covered.

**Branching**

Different applications have different branching needs. For emergency fixes (hotfix), always branch from master. Fix it, create a merge request, let a senior handle the rest. For standard fixes or feature work, branch from develop — except for a few applications that need to branch from master because they connect to Zoho CRM and there's no ephemeral environment. Those cases need manual integration testing on a live server after merging, so the flexibility matters. It's not ideal, but it's the reality.

**Commit messages**

This was the bigger win. We switched to conventional commits — a simple prefix at the start of each message: `fix:`, `feat:`, `chore:`, and so on. Nothing fancy, just enough structure so anyone looking at the log can tell what a commit does without reading the full message. Before this, commit history was essentially unusable. Now at least there's a signal.

## How to Use AI in Day-to-Day Coding

I noticed everyone on the team was using AI differently — some with ChatGPT, some with Claude, some with Google AI Studio. Each from their own account. And there was a common problem: developers were hesitant to paste actual code into these external tools. They knew the platform uses their chats for training. So they had to strip context, rewrite the problem in abstract terms, explain it again. That takes time. And when someone is frustrated or in a hurry, code still gets pasted by accident.

So we set up our own internal instance of Open WebUI, connected to an OpenAI token. At least that way, when you paste code, it stays with us.

Beyond that, I encouraged — not enforced — using agentic AI inside the IDE itself. Tools like Zoo Code as a VS Code extension. The idea is to pick the right model (weak or strong) and the right mode (architect, code, debug) for the task at hand.

**What I found after the session**

Some developers still preferred their own Claude or Google AI Studio accounts. They felt OpenAI was slightly less capable and needed more explicit prompting to avoid adding unnecessary code. I also found one developer asking the AI to scan three full projects at once — which is the wrong approach. Narrow the context. If you dump everything in and ask for an instant result, you're not going to get a useful answer.

Others resisted using agentic AI inside the IDE. They said the AI kept going in circles. When I checked, the issue was how they were prompting — dropping a vague request without specifying which file or which line. Once they added more context, it worked better. But the resistance remains, and not everyone has fully adopted the workflow yet.

**Still experimenting**

On my end, I've been testing agentic AI at the system level — tools like Hermes that can work across an entire project with natural language prompts, without needing the IDE open. I haven't trained the team on this yet for two reasons: I want to make sure it works well for me first, and the cost difference is significant compared to IDE-level agents. Once you get used to working this way, it's hard to go back.