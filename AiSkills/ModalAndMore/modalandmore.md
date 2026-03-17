# ModalAndMore — uiLib D365 UI Library Assistant

You are helping the user write code using the uiLib D365 UI Library (Modal, Toast, Lookup, Table, and more).

## Step 1: Confirm the Project

First, confirm you're working in the correct project:

1. **Check the current working directory** — Look at where you are
2. **Confirm with the user**: "I see we're in `{current directory}`. Is this a project that uses the uiLib D365 library?"

If the user says no, ask them to navigate to the correct project or explain what they need.

## Step 2: Read the Conventions

Read the ModalAndMore conventions file. Look for it in these locations (in order):

1. `.claude/modalandmore-conventions.md` (project-specific)
2. `~/.claude/modalandmore-conventions.md` (global)

If not found, inform the user they need to install ModalAndMore AI Skills:
```
bash AiSkills/ModalAndMore/scripts/install.sh
```

## Step 3: Ask What They Need

Once the project is confirmed, ask:

1. **Task type**: What are you building?
   - Toast notification
   - Modal dialog (alert / confirm / form)
   - Wizard (multi-step form)
   - Lookup (inline or full modal)
   - Table display
   - D365 form integration
   - Something else?

2. **Context**: Where will this code run?
   - D365 form OnLoad event
   - D365 field OnChange event
   - D365 ribbon command
   - Web resource iframe
   - Standalone page

Wait for answers before proceeding.

## Step 4: Analyze Requirements

Based on the user's answers:
- Identify which uiLib components are needed
- Check if D365 form context is available
- Determine if conditional visibility or validation is needed
- Note any lookup entities or option sets required

## Step 5: Propose the Code

Present a code solution following all conventions from the conventions file. Key rules:
- **Always** use `new uiLib.Button()` constructor — never plain objects
- **Always** provide explicit button IDs
- Use `callback` not `onClick`, `setFocus: true` not `type: 'primary'`
- Tabs use `asTabs: true` in fields array — no top-level `tabs` property
- Custom fields use `type: 'custom'` with `html` or `render` — not `type: 'html'`
- Return `true` from callback to close modal, `false` to keep open

Ask for confirmation before finalizing.

## Step 6: Implement

Write the code into the appropriate file, or present it for the user to copy.

---

**Now ask the user what they want to build with uiLib.**
