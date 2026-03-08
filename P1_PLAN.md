# P1 Execution Plan — Message Actions · Tool Timeline · Doc Drawer

> Branch: `feat/p1-message-actions-tool-timeline-doc-drawer`  
> Baseline: P0 work from `feat/chatgpt-ui-p0-improvements` (merged into main → this branch forks from there)

---

## 0. Scope & Success Criteria

| Feature | Done-when |
|---|---|
| **Per-message actions** | Every completed assistant message shows Copy / Regenerate / Edit / Continue. User messages show Edit-and-resubmit. All actions keyboard-accessible (focus-visible ring). |
| **Tool-run timeline** | A collapsible "Activity" strip appears above assistant content whenever a message involved a tool call (search, thinking). Shows per-step status with timing. Collapsed by default after streaming. |
| **Document drawer** | A pill/badge row above the composer always shows attached docs for the active conversation. Clicking opens a slide-in drawer with remove + attach-state. No new page needed—uses existing `DocumentPanel` internals. |

All three must have unit/integration tests and must not break existing test suite.

---

## 1. File Map

```
src/
  types/index.ts                       ← add ToolEvent to Message
  stores/chatStore.ts                  ← add editAndResubmit(), regenerateAt()
  components/
    Chat/
      ChatMessage.tsx                  ← message action bar + inline edit UI
      ChatContainer.tsx                ← wire editAndResubmit / regenerateAt / doc drawer
      MessageActionBar.tsx             ← NEW: extracted action bar component
      ToolTimeline.tsx                 ← NEW: collapsible tool-run timeline
    Documents/
      DocDrawer.tsx                    ← NEW: slide-in doc drawer shell
      DocDrawerTrigger.tsx             ← NEW: pill row above composer
      DocumentPanel.tsx                ← unchanged (reused inside DocDrawer)
```

---

## 2. Type Changes — `src/types/index.ts`

### 2a. Add `ToolEvent` to track individual tool steps

```ts
export interface ToolEvent {
  type: 'thinking' | 'search' | 'tool_call' | 'tool_result';
  label: string;           // e.g. "Searched: what is RAG"
  startedAt: number;       // ms timestamp
  endedAt?: number;        // set when step completes
  detail?: string;         // optional collapsed detail (query text, result count)
}
```

### 2b. Extend `Message`

```ts
export interface Message {
  // ... existing fields ...
  toolEvents?: ToolEvent[];     // ordered log of tool steps for this turn
  parentMessageId?: string;     // set when this message is a regen/edit branch
  editedFrom?: string;          // original content if this was edited before submit
}
```

**Why `toolEvents` on `Message` vs a separate store slice?**  
Messages are already persisted via `StorageService.saveConversation()`. Attaching events to the message means the timeline is free with zero extra persistence logic.

---

## 3. Store Changes — `src/stores/chatStore.ts`

### 3a. New actions to add to `ChatStore` interface

```ts
interface ChatStore {
  // ... existing ...
  regenerateAt: (assistantMessageIndex: number) => Promise<void>;
  editAndResubmit: (userMessageIndex: number, newContent: string) => Promise<void>;
}
```

### 3b. `regenerateAt` implementation strategy

Current `handleRegenerate` in `ChatContainer` walks backwards to find the preceding user message and calls `sendMessage(content)`. This works but appends new messages; it doesn't replace the stale assistant response.

New `regenerateAt(assistantMessageIndex)`:
1. Find the preceding user message index `ui`.
2. Slice `conversation.messages` to `[0 … ui]` (drop the stale assistant reply and everything after).
3. Call internal `_sendFrom(userContent)` — same body as `sendMessage` but operates on the already-trimmed message array.
4. Set `parentMessageId` on the new assistant message = ID of the message that was dropped.

This gives the conversation a clean linear history while preserving the original in `parentMessageId` for potential future branching UI.

### 3c. `editAndResubmit` implementation strategy

```
editAndResubmit(userMessageIndex, newContent):
  1. Trim messages to [0 … userMessageIndex - 1]  (drop original user msg + everything after)
  2. Set editedFrom = original user content on the new user message
  3. Call sendMessage(newContent)
```

No new streaming logic needed—`sendMessage` already handles everything.

### 3d. `toolEvents` population during streaming

In the existing `sendMessage` flow, the store already sets `status: 'thinking'` and `status: 'searching'` on the assistant placeholder. Extend each of those transitions to also push a `ToolEvent`:

| Existing transition | Also push ToolEvent |
|---|---|
| `status = 'thinking'` set | `{type:'thinking', label:'Thinking', startedAt: now}` |
| Tool call detected (before execution) | `{type:'tool_call', label:'Calling web_search', startedAt: now}` |
| `isSearching = true` / `lastSearchQuery` set | `{type:'search', label: 'Searched: ${query}', startedAt: now}` |
| Tool result received | close previous event (`endedAt = now`), push `{type:'tool_result', label:'Got ${n} results', startedAt: now, endedAt: now}` |

Helper: `appendToolEvent(messageId, event)` — a small Zustand set call that finds the message in `currentConversation.messages` by ID and appends to its `toolEvents` array.

---

## 4. Message Actions — `src/components/Chat/MessageActionBar.tsx` (NEW)

### Props

```ts
interface MessageActionBarProps {
  message: Message;
  messageIndex: number;
  isLatestAssistant: boolean;
  isStreaming: boolean;
  onCopy: () => void;
  copied: boolean;
  onRegenerate?: () => void;
  onContinue?: () => void;
  onEdit?: (newContent: string) => void;   // only for user messages
}
```

### Layout

```
[assistant message]
─────────────────────────────────────────
  Copy  Regenerate  Continue             ← visible on hover OR focus-within
  (icon + label, 28px tall, gap-1)
```

```
[user message]
─────────────────────────────────────────
                              Edit  Copy ← right-aligned, hover/focus
```

### Interaction states

| State | Visual |
|---|---|
| Default | `opacity-0` on the bar container |
| Parent `group` hovered | `group-hover:opacity-100` |
| Any button focused | `focus-within:opacity-100` on bar |
| Streaming | Regenerate + Continue disabled (`cursor-not-allowed opacity-40`) |
| Copied | "Copy" label → "Copied ✓" for 2 s |

### Edit mode (user messages)

When the user clicks **Edit**, the message bubble text swaps to a `<textarea>` pre-filled with `message.content`. Two inline buttons appear: **Submit** (calls `onEdit(newContent)`) and **Cancel** (restores text, exits edit mode). Textarea auto-resizes to content height using `onInput` height-setting pattern.

### Changes to `ChatMessage.tsx`

- Extract the existing action bar `<div>` (Copy + Regenerate + Continue buttons) into `<MessageActionBar>`.
- Remove the duplicate hover-only copy button (`absolute top-2 right-2`) and consolidate into `MessageActionBar`; the absolute button adds visual noise and duplicates Copy.
- Pass `onEdit` for user messages by wiring through `ChatContainer`.
- Keep `isActivelyStreaming` prop as-is; pass directly to `MessageActionBar` to disable actions.

---

## 5. Tool-Run Timeline — `src/components/Chat/ToolTimeline.tsx` (NEW)

### Props

```ts
interface ToolTimelineProps {
  events: ToolEvent[];
  isStreaming: boolean;    // when true, last event shows a live spinner
}
```

### Visual design

```
▼ Activity (2 steps · 1.4 s)               ← collapsed pill, click to expand
────────────────────────────────
  💭 Thinking          0.3 s
  🔎 Searched: "what is RAG"
     ↳ Got 6 results   1.1 s
────────────────────────────────
```

- Collapsed by default once `isStreaming` becomes false.
- During streaming: auto-expanded, last event shows a `animate-pulse` spinner instead of duration.
- Duration shown as `(endedAt - startedAt) / 1000` formatted to 1 decimal.
- Rendered inside assistant message bubble, above the prose content, below any status bubble.
- Controlled with local `useState<boolean>(isStreaming)` — collapses when streaming ends via `useEffect`.

### Integration in `ChatMessage.tsx`

```tsx
// After the status-bubble block, before the prose block:
{message.toolEvents && message.toolEvents.length > 0 && !message.status && (
  <ToolTimeline events={message.toolEvents} isStreaming={isActivelyStreaming} />
)}
```

---

## 6. Document Drawer — `DocDrawerTrigger` + `DocDrawer`

### 6a. `DocDrawerTrigger.tsx` (NEW)

A horizontally scrollable pill row rendered **between** the message list and the composer in `ChatContainer`. Only shown when `uploadedDocuments.length > 0`.

```
[📄 report.pdf  ×]  [📄 notes.txt  ×]  [+ Add doc]
```

- Each pill: `rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs flex items-center gap-2`.
- `×` calls `removeDocument(doc.id)` directly (fast path, no drawer needed).
- Clicking the pill label or **+ Add doc** opens `<DocDrawer>`.
- `[+ Add doc]` also triggers a hidden `<input type="file">` via ref (same logic as existing `DocumentUploadButton`).

### 6b. `DocDrawer.tsx` (NEW)

A slide-in panel anchored to the right edge of the chat column (not full-screen overlay).

```
┌─────────────────────────────────────────────────────────────┐
│  Chat area                              │  Documents    ×   │
│                                         │  ───────────────  │
│                                         │  📄 report.pdf    │
│                                         │     12 chunks · … │
│                                         │                 × │
│                                         │  📄 notes.txt     │
│                                         │     4 chunks · …  │
│                                         │                 × │
│                                         │                   │
│                                         │  + Upload new doc │
└─────────────────────────────────────────────────────────────┘
```

Props:
```ts
interface DocDrawerProps {
  open: boolean;
  onClose: () => void;
  documents: UploadedDocument[];
  onRemove: (id: string) => void;
  onUpload: (file: File) => void;
}
```

- `open` drives a CSS transition: `translate-x-0` vs `translate-x-full` with `transition-transform duration-200`.
- Reuses `DocumentPanel` for the list body (or inlines the same markup—`DocumentPanel` is small enough).
- Width: `w-72` fixed; does not push the chat layout (absolute positioned inside the flex column).
- Close on `Escape` keydown (add `useEffect` listener when `open`).
- Close on backdrop click (transparent backdrop covers the chat area, `z-10` behind the drawer panel).

### 6c. Mount in `ChatContainer.tsx`

```tsx
// State
const [docDrawerOpen, setDocDrawerOpen] = useState(false);

// In JSX, after messages list, before composer:
{uploadedDocuments.length > 0 && (
  <DocDrawerTrigger
    documents={uploadedDocuments}
    onOpen={() => setDocDrawerOpen(true)}
    onRemove={removeDocument}
    onUpload={uploadDocument}
  />
)}

<DocDrawer
  open={docDrawerOpen}
  onClose={() => setDocDrawerOpen(false)}
  documents={uploadedDocuments}
  onRemove={removeDocument}
  onUpload={uploadDocument}
/>
```

---

## 7. Test Plan — `src/components/Chat/__tests__/` and `src/stores/__tests__/`

### 7a. Message actions — `message-actions.test.tsx` (update existing)

| Test | Assertion |
|---|---|
| Copy button shows "Copied" after click | `userEvent.click` → text changes, reverts after 2 s (fake timers) |
| Regenerate disabled while streaming | button has `disabled` attribute when `isStreaming=true` |
| Edit mode: textarea appears on Edit click | `getByRole('textbox')` visible, pre-filled with original content |
| Edit cancel: original content restored | no `onEdit` called, textarea gone |
| Edit submit: `onEdit` called with new content | spy called once with new string |

### 7b. `editAndResubmit` store action — `chatStore.edit.test.ts` (new file)

| Test | Assertion |
|---|---|
| Trims messages correctly | messages after edit index removed before send |
| `editedFrom` set on new user message | new user message has `editedFrom = original content` |
| `sendMessage` called with new content | spy/mock verifies argument |

### 7c. `regenerateAt` store action — `chatStore.regenerate.test.ts` (new file)

| Test | Assertion |
|---|---|
| Stale assistant reply is dropped | conversation length decremented correctly |
| `parentMessageId` set on new assistant message | ID matches dropped message |
| No-op when streaming | `isStreaming` guard prevents execution |

### 7d. ToolTimeline — `tool-timeline.test.tsx` (new file)

| Test | Assertion |
|---|---|
| Collapsed by default after streaming=false | expand button text visible, steps hidden |
| Auto-expands during streaming | steps visible, spinner shown |
| Shows duration when event has endedAt | formatted time string rendered |
| Click to expand/collapse toggles | step list visibility toggles |

### 7e. DocDrawer — `doc-drawer.test.tsx` (new file)

| Test | Assertion |
|---|---|
| Drawer hidden when `open=false` | `translate-x-full` class present |
| Drawer visible when `open=true` | `translate-x-0` class present |
| Escape key closes drawer | `onClose` spy called |
| Remove button calls `onRemove` with correct id | spy called with doc id |
| DocDrawerTrigger renders one pill per doc | correct number of pills |

---

## 8. Accessibility Checklist

- All action buttons: `aria-label` set (e.g. `aria-label="Regenerate response"`).
- Edit textarea: `aria-label="Edit message"`, focus trapped inside edit bubble while active.
- ToolTimeline toggle: `aria-expanded` tracks collapsed state; `aria-controls` points to steps container.
- DocDrawer: `role="dialog"`, `aria-modal="true"`, `aria-label="Document drawer"`. Focus moves to first interactive element on open; returns to trigger on close.
- All interactive elements: `focus-visible:ring-2 focus-visible:ring-blue-500` (consistent with P0 ring styles).

---

## 9. Implementation Order

```
Step 1 — Types                (30 min)   src/types/index.ts
Step 2 — Store actions        (1.5 h)    chatStore.ts  (+2 new test files)
Step 3 — MessageActionBar     (1 h)      new file + ChatMessage.tsx refactor
Step 4 — ToolTimeline         (1 h)      new file + ChatMessage.tsx mount point
Step 5 — DocDrawerTrigger     (45 min)   new file + ChatContainer.tsx mount
Step 6 — DocDrawer            (45 min)   new file (reuses DocumentPanel)
Step 7 — Tests                (1.5 h)    update + new test files
Step 8 — A11y pass            (30 min)   aria attrs, focus management
Step 9 — PR                   (15 min)   gh pr create → base main
```

Total estimated: ~7.5 h focused work.

---

## 10. Deliberate Non-changes (Out of Scope for P1)

- No branching/tree UI — `parentMessageId` is stored but no UI branch picker.  
- No inline "Continue" prompt text editing — Continue always sends literal `"Continue."`.  
- `DocumentPanel.tsx` itself is unchanged — drawer reuses it as-is.  
- No changes to RAG/embedding logic — drawer is UI-only.  
- No changes to `SettingsPanel` (P2 scope).  
- No sidebar collapse (P2 scope).
