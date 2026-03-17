# NextDocs Documentation Assistant

You are helping the user create documentation following NextDocs conventions.

## Step 1: Confirm the Project

First, confirm you're working in the correct project:

1. **Check the current working directory** - Look at where you are
2. **Confirm with the user**: "I see we're in `{current directory}`. Is this the project you want to document?"

If the user says no, ask them to navigate to the correct project or provide the path.

## Step 2: Read the Conventions

Read the NextDocs conventions file. Look for it in these locations (in order):

1. `.claude/nextdocs-conventions.md` (project-specific)
2. `~/.claude/nextdocs-conventions.md` (global)

If not found, inform the user they need to install NextDocs AI Skills conventions.

## Step 3: Ask Setup Questions

Once the project is confirmed, ask:

1. **Documentation location**: Where should docs go within this project?
   - `docs/` (default for standalone repos)
   - `content/docs/` (for NextDocs platform repos)
   - Custom path?

2. **Project name**: What should we call this documentation project?
   (Suggest based on package.json name or directory name)

3. **Audience**: Who is this documentation for?
   - End users
   - Developers/API consumers
   - Internal team
   - All of the above

Wait for answers before proceeding.

## Step 4: Analyze the Project

Once configured, examine:
- Project type (API, web app, library, CLI tool)
- Source code structure
- Existing README or docs
- Package.json or config files

## Step 5: Propose Structure

Present a structure based on the conventions file, like:

```
docs/{project-slug}/
├── _meta.json
├── index.md
├── getting-started/
│   ├── _meta.json
│   ├── index.md
│   ├── installation.md
│   └── quickstart.md
└── guides/
    ├── _meta.json
    └── {relevant-guides}.md
```

Ask for confirmation before creating.

## Step 6: Create Files

Create the structure following all conventions from the conventions file.

---

**Now analyze the current project and propose a documentation structure.**
