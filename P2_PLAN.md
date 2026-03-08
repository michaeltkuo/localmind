# LocalMind — P2 Plan

## Context

| Phase | Theme | Status |
|-------|-------|--------|
| P0 | ChatGPT-style UX foundation (sidebar, composer, theming) | ✅ Merged |
| P1 | Message interactions + document workflow (actions bar, tool timeline, doc drawer) | ✅ PR #15 open |
| **P2** | **Power-user productivity + model management** | 🔜 This doc |

---

## Theme: Power-User Productivity

P1 gave users *control over messages*. P2 gives users *control over models, context, and workflow* — moving LocalMind from a functional chatbot toward a tool power users reach for daily.

---

## Features

### 1. Model Management UI
**Priority: High**

Currently users must pull/delete models via the terminal. Bring this into the app.

- **Pull model**: Input field + "Download" button; show progress bar (stream from `POST /api/pull`)
- **Delete model**: Trash icon per model with confirmation dialog
- **Disk usage**: Show GB used per model next to its name in the selector
- **Status indicator**: Show if a model is downloading / already loaded into memory

**Entry point:** Settings panel → new "Models" tab  
**Backend:** Existing `ollama.service.ts` already maps to `/api/pull`, `/api/delete`, `/api/tags`

---

### 2. Full-Text Conversation Search
**Priority: High**

Current search only matches conversation *titles*. Users need to find answers they got days ago.

- Search input in sidebar searches across **all message content**, not just titles
- Highlight matching text in the result preview
- Show which conversation + approximate position (e.g. "3rd message")
- Keyboard shortcut: `⌘F` opens search, `Escape` clears / closes

**Implementation:** Filter runs over `conversations[].messages[].content` in memory (no new service needed for local datasets; can add debounce for large stores)

---

### 3. Prompt Library
**Priority: Medium**

Users reuse the same prompts (summarize, translate, explain code, etc.). Let them save them.

- Dedicated "Prompts" section accessible from the `+` attachment menu or a new sidebar icon
- **Save prompt**: button in the composer toolbar to save current input as a named prompt
- **Prompt drawer**: searchable list of saved prompts; clicking one fills the composer
- **Built-in presets**: 5–6 starter prompts (Summarize, Translate, Explain code, Debug, ELI5, Draft email)
- Stored in `localStorage` alongside conversations

---

### 4. Conversation Branching (Fork)
**Priority: Medium**

Sometimes a conversation goes in the wrong direction and users want to try a different path from an earlier point.

- "Fork from here" option in the message action bar (P1 `MessageActionBar`)
- Creates a new conversation with all messages up to and including the selected message, marked as `[forked from: <title>]`
- Original conversation is untouched

**Implementation:** New `forkConversation(conversationId, messageIndex)` store action; lightweight — just slice + copy

---

### 5. Context Window Indicator
**Priority: Medium**

Users have no visibility into how much context is left before the model truncates.

- Thin progress bar below the composer showing `tokens_used / context_length`
- Color: green → yellow → red as it fills
- Tooltip showing exact numbers on hover
- Data sourced from the response's `context` field that Ollama already returns on each `/api/chat` call

---

### 6. Image / Multimodal Input
**Priority: Low–Medium** *(model-dependent)*

Models like `llava`, `moondream`, and `llama3.2-vision` support image input. Surface this in LocalMind.

- Image attach button appears only when the selected model is flagged as multimodal
- Supports drag-and-drop or file picker; preview thumbnail shown in composer
- Image is base64-encoded and sent in the `images` field of the Ollama chat API
- Graceful fallback: if the model doesn't support images, show a tooltip explaining why

---

### 7. Conversation Folders / Projects
**Priority: Low**

For users with 50+ conversations, flat lists become unwieldy.

- Create named folders from the conversation `…` menu ("Move to folder")
- Folders shown as collapsible sections in the sidebar above the flat list
- Rename / delete folders (conversations move back to root, not deleted)
- Stored as a `folderId` field on the `Conversation` type

---

## Non-Feature Work

| Item | Why |
|------|-----|
| Persist `uploadedDocuments` across sessions | Documents currently lost on reload |
| `chatStore.ts` split into slices | File is growing; split into `conversationSlice`, `modelSlice`, `settingsSlice` |
| Ollama connection retry / health-check loop | App silently fails if Ollama restarts mid-session |
| CI Node matrix → single LTS version | CI runs two identical jobs on Node 20.x — deduplicate |

---

## Suggested Sequencing

```
Week 1
  ├── Full-text search          (high value, self-contained)
  └── Model management UI       (high value, uses existing service layer)

Week 2
  ├── Prompt library            (medium, new data model)
  └── Conversation branching    (medium, ~1 store action + UI)

Week 3
  ├── Context window indicator  (medium, low risk)
  └── Image input               (gated on vision model availability)

Backlog
  └── Conversation folders      (lower urgency)
```

---

## Success Criteria for P2

- [ ] User can pull and delete models without touching the terminal
- [ ] User can find any past message using `⌘F` full-text search
- [ ] User can save, browse, and inject prompt templates from the composer
- [ ] User can fork a conversation from any assistant message
- [ ] Context usage is visible in the composer at all times
