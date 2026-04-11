---
name: Always ask for docs
description: Never intuit XRPL transaction fields — always ask user for official docs before coding
type: feedback
---

Never intuit XRPL transaction fields or RPC shapes. Always ask the user for the official documentation before writing or fixing code.

**Why:** XRPL lending primitives (XLS-65/66) are new and bleeding-edge. Field names, flags, and RPC responses may differ from assumptions. The user explicitly requested this.

**How to apply:** Before writing any XRPL transaction code, ask for the doc URL. The pattern is `https://xrpl.org/docs/references/protocol/transactions/types/{txname_lowercase}`. Always verify against the actual doc content.
