<!-- MODALANDMORE-AI-SKILLS-START -->
<!-- Managed by ModalAndMore AI Skills - https://github.com/garethcheyne/DYN365CE-Modal-and-More -->

## ModalAndMore — uiLib D365 UI Library

When generating or modifying code that uses the uiLib D365 library, read and follow the conventions in `.github/modalandmore-conventions.md`.

Key rules:
- Buttons MUST use `new uiLib.Button({ label, callback, id })` — never plain objects
- Use `callback` not `onClick`; `setFocus: true` not `type: 'primary'`
- Tabs use `asTabs: true` inside `fields` array — no top-level `tabs` property
- Custom fields use `type: 'custom'` with `html` or `render` — NOT `type: 'html'`
- Return `true` from callback to close modal, `false` to keep open
- Always provide explicit button IDs for reliable `getButton()` lookups

<!-- MODALANDMORE-AI-SKILLS-END -->
