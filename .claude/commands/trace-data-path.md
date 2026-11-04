Trace the complete data path for: $ARGUMENTS

Read the actual source files to map every step of this data's journey. Do NOT guess — read the code.

## 1. User Trigger
- Which component handles the user action?
- What event handler fires? (onClick, onSubmit, useEffect, etc.)
- What state changes happen locally? (Zustand store, React state)

## 2. API Call Chain
For each API call in the flow:
```
[Component] → fetch('/api/xxx', { method, body })
  → [route.ts]: guardRoute(tier) → parseBody(schema) → [lib function]
  → Response: { fields }
```

## 3. Database Writes
For each DB write:
```
Table: [name]
Columns written: [list]
Written by: [which lib/db/ function]
Called from: [which API route]
Key constraints: [FK, unique, not null]
```

## 4. Database Reads
For each place this data is read back:
```
Table: [name]
Columns read: [list]
Read by: [which lib/db/ function]
Called from: [which API route or page]
Consumed by: [which component renders this data]
```

## 5. Data Transformation Points
List every place the data shape changes:
- Raw user input → Zod validated shape
- DB row → TypeScript type cast
- API response → Component props
- Any intermediate transformations (scoring, LLM processing, etc.)

## 6. Complete Path Diagram
```
[User Action]
  ↓
[Component: xxx.tsx] — state: [store/local]
  ↓
[API: POST /api/xxx] — validation: [schema]
  ↓
[lib/db/xxx.ts: functionName()] — table: [TableName]
  ↓ (write)
[DB: TableName.column]
  ↓ (read by)
[lib/db/xxx.ts: otherFunction()] 
  ↓
[API: GET /api/yyy]
  ↓
[Component: yyy.tsx] — renders: [what user sees]
```

## 7. Risk Points
Flag any:
- 🔴 Missing error handling (what if API returns 500?)
- 🔴 Missing null checks (what if DB returns no rows?)
- 🟠 Race conditions (concurrent writes to same row?)
- 🟠 Stale data (localStorage vs DB mismatch?)
- 🟡 Missing validation (data could be malformed?)

**Do NOT modify any code. This is analysis only.**
