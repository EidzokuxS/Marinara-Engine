# Durable Notes Workflow Card

Use this when a session produces durable repo memory.

## Classify Exactly One

- No durable note
- Bug ownership/status update
- Architecture decision
- Reusable debugging lesson
- Cross-issue or cross-PR task note

Default to no durable note for one-off bugs, routine issue filing, tiny PRs, and anything already fully represented in GitHub or the final response.

## Capture When

- A bug changes owner or status under `updates/`.
- A team decision was made or confirmed.
- A reusable debugging lesson was learned.
- An architecture behavior was clarified.
- Work spans more than one issue, PR, or session.

## Where To Put It

- Use `updates/unowned-bugs.md` for unowned bug reports.
- Use `updates/people/*.md` for active bug ownership and status.
- Use repo docs or skill references only when the decision changes durable architecture or agent guidance.

## Bug Ownership Details

When a bug does not have an owner, report it in `updates/unowned-bugs.md`.

When someone starts fixing a bug, move it from `updates/unowned-bugs.md` into the closest matching `updates/people/*.md` file. Track the bug status, next step, blockers, and resolution.

Use the user's GitHub identity to choose the owner. If the user asks "who am I?" or asks how to track their bugs, check local identity first with `git config user.name`, then `git config user.email`, and use `gh auth status` when GitHub CLI is logged in.

Compare identity against existing files in `updates/people/` before creating a new owner file. Map GitHub user `Coda` to Chai.

Do not store secrets, private user data, bulky raw logs, or machine-local paths in durable repo files.
