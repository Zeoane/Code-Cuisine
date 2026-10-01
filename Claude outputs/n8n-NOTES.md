# n8n rework — mentor items 12 (use credentials) and 13 (use an output parser)

Reworked files in this folder:

| File | Purpose |
|---|---|
| `Recipe Generation.json` | import into n8n (keeps credential ids/names) |
| `Recipe Quota Status.json` | import into n8n |
| `Recipe Generation.example.json` | for the public repo — every credential id/name empty |
| `Recipe Quota Status.example.json` | for the public repo |

No secret material is in any of these four files: the private key is gone entirely (it
is now inside the n8n credential), and `quotaIpSalt` is empty in the real `.json` files
too — you type it in once per workflow after importing (see step 4 below).

`Error Notifications.json` is untouched, it had neither inline credentials nor an LLM call.

---

## 1. What changed, node by node

### `Recipe Generation` (22 nodes, was 23)

| Old | New | What happened |
|---|---|---|
| `Set Service Account  Credentials` (Set) | **`Set Quota IP Salt`** (Set, same node, renamed) | Only `quotaIpSalt` is left. `serviceAccountEmail` and `serviceAccountPrivateKey` are gone — they live in the n8n credential now. Renamed because a node called "Set Service Account Credentials" that holds no service account credentials is misleading; nothing references it by name (`Compute Quota Keys` deliberately reads `$json.quotaIpSalt`, not the node). |
| `Build & Sign Firestore JWT` (Code) | **deleted** | The `googleApi` credential signs the RS256 assertion itself. |
| `Exchange JWT for Access Token` (HTTP) | **deleted** | The credential does the `oauth2.googleapis.com/token` exchange itself. |
| `Store Access Token` (Code) | **deleted** | No token to carry forward any more. |
| `Reserve Quota Slot` (HTTP) | same node, re-authenticated | `Authorization: Bearer {{ … }}` header removed; now `authentication: predefinedCredentialType`, `nodeCredentialType: googleApi`, credential `Firestore Service Account`. Body/URL unchanged. |
| `Release Quota Slot` (HTTP) | same node, re-authenticated | Same change. |
| `Validate Request Payload` (Code) | same node, extended | Added the per-unit quantity cap (change 3, details below). |
| `Build LLM Request` (Code) | same node, slimmed to ~a third | Now produces only `promptRequest` (the compact JSON the prompt works from). The JSON schema, the `response_format` block, the `messages` array and the `MODEL` constant are gone from the code. |
| `OpenAI: Generate Recipes` (HTTP Request to `api.openai.com`) | **`OpenAI: Generate Recipes`** (`@n8n/n8n-nodes-langchain.chainLlm`, typeVersion 1.7) | Same node name, so the canvas and the error wiring stay recognisable. `promptType: define`, `text: {{ $json.promptRequest }}`, `hasOutputParser: true`, and the old system prompt **verbatim** as a System message. `onError: continueErrorOutput` kept. |
| — | **`OpenAI Chat Model`** (`lmChatOpenAi`, typeVersion 1.2) | New sub-node. Model `gpt-6-luna` (taken from the old `MODEL` constant — change it here from now on), `options.timeout: 60000`, `options.maxRetries: 2`. Uses your existing credential `OpenAI account 2` (id `qXmdRSJivefpurUF`). |
| — | **`Recipe Output Parser`** (`outputParserStructured`, typeVersion 1.3) | New sub-node, `schemaType: manual`, `inputSchema` = the **byte-identical** JSON schema the HTTP node used in `response_format.json_schema`. So the contract with Angular does not change. |
| `Validate & Normalise Recipes` (Code) | same node, trimmed | The `choices[0].message.content` reading and the `JSON.parse` are gone (the parser does that). It now unwraps the parser's `{ output: { recipes: [...] } }` and otherwise does exactly what it did before: repairs steps/cook numbers, enforces the `firestore.rules` caps, forces `servings`/`cuisineStyle` back to the user's choice, throws when unusable. |
| `Generate Fallback Recipes` (Code) | unchanged | Still fed by **both** error outputs (chain + validation), so the user always gets three recipes. |

Unchanged: webhook, `Extract Client IP`, `IP Valid?`, both 400 responders, `Payload Valid?`,
`Compute Quota Keys`, `Parse Quota Reservation`, `Check Quota Limits`,
`Build Quota Exceeded Response`, the 429 and 200 responders.

New chain wiring in `connections` (not `main`):

```json
"OpenAI Chat Model":    { "ai_languageModel": [[{ "node": "OpenAI: Generate Recipes", "type": "ai_languageModel", "index": 0 }]] },
"Recipe Output Parser": { "ai_outputParser":  [[{ "node": "OpenAI: Generate Recipes", "type": "ai_outputParser",  "index": 0 }]] }
```

The old retry on the HTTP node (`retryOnFail` / `maxTries: 2`) moved into the model's
`options.maxRetries: 2` — retrying the whole chain on top of that would just double the
cost of a bad minute.

### `Recipe Quota Status` (10 nodes, was 13)

| Old | New |
|---|---|
| `Set Service Account Credentials1` | **`Set Quota IP Salt1`**, only `quotaIpSalt` left |
| `Build & Sign Firestore JWT1`, `Exchange JWT for Access Token1`, `Store Access Token1` | **deleted** |
| `Read IP Quota Counter1`, `Read Global Quota Counter1` | Bearer header removed, now `predefinedCredentialType` + `googleApi` + credential `Firestore Service Account`. `Never Error` stays on, so a missing document still counts as 0. |

Everything else (webhook, IP extraction/validation, `Compute Quota Keys1`,
`Build Status Response1`, both responders) is unchanged.

### Change 3 — quantity cap in `Validate Request Payload`

```js
const MIN_QUANTITY = 1;
const MAX_QUANTITY = { gram: 2000, ml: 2000, piece: 20 };
```

The Angular app posts `ingredients` as plain names (`["Rice", "Chicken"]`), so there is
nothing to cap in a normal request. A direct caller may send an amount, and the node now
handles both ways of doing that:

* an object `{ name, quantity, unit }` — unit must be `gram`/`ml`/`piece` (abbreviations
  accepted), otherwise 400; a non-numeric quantity is a 400;
* an amount inside the string — `"250 g Rice"`, `"250g Rice"`, `"2 pieces Egg"`,
  `"2500,5 g Rice"`, `"-5 ml Milk"`; a bare number (`"99999 Rice"`) uses the form's
  default unit, gram.

Out-of-range amounts are **clamped**, not rejected (a slightly over-eager client still
gets recipes), and every clamp is recorded in `payloadWarnings`. Everything is normalised
back to `string[]` before it leaves the node, so `Build LLM Request`,
`Generate Fallback Recipes` and the response contract are unaffected. A word that is not
a unit stays part of the name (`"2 Eggs"`, `"3 kg Flour"` are left alone).

Tested locally against 16 payload shapes (names only, each unit over/under the cap,
negative, decimal comma, objects, bad unit, bad quantity, empty array, bad servings).

---

## 2. What you have to do in n8n

**Before you import anything: copy your current `quotaIpSalt` out of n8n.** Open
`Recipe Generation` → `Set Service Account  Credentials` and copy the salt into a safe
note. Importing replaces the node, and if you type a different salt afterwards, today's
counters live under different document ids and the badge jumps back to "3 of 3".

### Step 1 — create the Firestore credential (once)

n8n → **Credentials → Create credential → "Google Service Account API"**:

| Field | Value |
|---|---|
| Name (top of the dialog) | `Firestore Service Account` — exactly this, the workflows reference it by name |
| Region | leave at `global` (only used by Vertex nodes) |
| Service Account Email | the `client_email` from the Firebase service-account JSON |
| Private Key | the `private_key` from that JSON, without the surrounding quotes |
| Impersonate a User | off |
| **Set up for use in HTTP Request node** | **on — mandatory** |
| Scope(s) | `https://www.googleapis.com/auth/datastore` |

The toggle is not cosmetic: n8n's credential code returns the request unsigned when it is
off, so every Firestore call would come back 401.

The OpenAI credential you already have (`OpenAI account 2`) is reused as-is.

### Step 2 — import, in this order

1. `Error Notifications` already exists; leave it.
2. Import `Recipe Generation.json` (Workflows → "…" → Import from File).
3. Import `Recipe Quota Status.json`.

Importing over the existing workflows keeps their ids (`bBp22hiN3lYEhYiS`,
`hboDsphIhdr7KZU0`) and therefore the production webhook URLs, so nothing in
`environment.ts` changes.

### Step 3 — pick the credential in the four HTTP nodes

I could not know the id n8n will give your new credential, so each node carries the name
but an empty id. Open each of these and select `Firestore Service Account` in
**Credential for Google Service Account API**:

* `Recipe Generation` → `Reserve Quota Slot`, `Release Quota Slot`
* `Recipe Quota Status` → `Read IP Quota Counter1`, `Read Global Quota Counter1`

Also check that `OpenAI Chat Model` shows `OpenAI account 2`.

### Step 4 — put the salt back

`Recipe Generation` → `Set Quota IP Salt` and `Recipe Quota Status` → `Set Quota IP Salt1`:
paste the **same** salt into both (the one you copied before importing). At least 16
characters, otherwise `Compute Quota Keys` throws on purpose.

### Step 5 — the settings block, again

As your README already notes, "Import from File" does not apply the `settings` block. In
each workflow, "…" → Settings:

* **Error Workflow** → `Error Notifications`
* *Save successful production executions* / *Save failed production executions* → **Do not save**
* *Save manual executions* and *Save execution progress* → off

Then save, and make sure both workflows are **Active**.

### Step 6 — smoke test

1. `GET /quota-status` → `{ "ipRemaining": …, "totalRemaining": … }`. This exercises the
   new credential without spending an OpenAI call.
2. One generation from the app → three recipes, badge counts down.
3. Fallback path: disable the OpenAI credential for a moment and generate once — you
   should still get three recipes.

---

## 3. What I verified, and what I could not

### Verified against n8n's own source (master and the released tag `n8n@1.120.0`)

* `authentication: "predefinedCredentialType"` + `nodeCredentialType` are the real
  parameter names (`nodes-base/nodes/HttpRequest/V3/Description.ts`), and that field
  accepts credentials matching `has:authenticate` — `googleApi` has an `authenticate()`
  method, so it is offered. The same file even has a notice that only fires for
  `nodeCredentialType: 'googleApi'`: *"Make sure you have specified the scope(s) for the
  Service Account in the credential"*. So Firestore-over-HTTP with a service account is a
  supported combination; the README's claim that n8n Cloud offers no usable
  service-account credential is wrong (that list is in the HTTP Request node's
  *Credential Type* dropdown, not in the node panel).
* `GoogleApi.credentials.ts`: credential type name `googleApi`, display name
  "Google Service Account API", fields `email` / `privateKey` / `httpNode` / `scopes`.
  Its `authenticate()` signs exactly the JWT your Code node signed (RS256,
  `aud: oauth2.googleapis.com/token`, your scopes), POSTs it to the same token endpoint
  and sets `Authorization: Bearer …` — and it returns the request **unchanged** when
  `httpNode` is false.
* Connection keys `ai_languageModel` / `ai_outputParser` (`NodeConnectionTypes` in
  `packages/workflow/src/interfaces.ts`), and the direction: `getInputConnectionData`
  resolves sub-nodes through `connectionsByDestinationNode`, i.e. the sub-node is the
  *source* key and the chain is the target — which is how I wrote them.
* `chainLlm` parameters `promptType` (`define`), `text`, `hasOutputParser`,
  `messages.messageValues[].type` (`SystemMessagePromptTemplate`) and `.message`
  (`nodes/chains/ChainLLM/methods/config.ts`). Message text is run through
  `.replace(/[{}]/g, m => m + m)` before it reaches LangChain, so braces in the prompt
  are safe, and the user message is passed as a *value* for `{query}`, so the JSON in
  `promptRequest` is safe too.
* `outputParserStructured` parameters `schemaType: "manual"` + `inputSchema`, and the
  wrapping: `fromZodJsonSchema` builds `z.object({ output: yourSchema })`, so the chain
  emits `{ output: { recipes: [...] } }`. That is why `Validate & Normalise Recipes` reads
  `$json.output.recipes` (with a fallback to `$json.recipes`, so a parser version change
  cannot break it).
* typeVersions all exist in released n8n 1.120.0: `chainLlm` up to 1.7,
  `outputParserStructured` up to 1.3, `lmChatOpenAi` up to 1.3. Your export carries the
  `availableInMCP` workflow setting, which exists in 1.120 but not in 1.110, so your
  instance is at least 1.120. I picked `lmChatOpenAi` **1.2** rather than 1.3 on purpose:
  1.3 adds a "Use Responses API" switch that defaults to on, and there is no reason to
  change the API surface in the same step.
* `onError: "continueErrorOutput"` on the chain is the documented way to survive a parser
  failure — n8n's own error text for the structured parser says *"change the 'On Error'
  parameter in the root node's settings"*.
* I ran the schema through `@n8n/json-schema-to-zod` (the exact package n8n uses): it
  converts without error, accepts a well-formed answer, and rejects a missing field.

### Could not verify / check after the first import

* **Whether n8n re-links a credential by name when the id is empty.** The docs only say
  exports "include credential names and IDs" and say nothing about the matching rule.
  Assume it does not, and do step 3 above.
* **`additionalProperties: false` is now enforced more strictly than before.** It is part
  of the schema I carried over verbatim, and `json-schema-to-zod` turns it into zod
  `.strict()` — an *extra* field in the model's answer now fails the parse (I confirmed
  this locally). With the old `response_format: { strict: true }` OpenAI prevented that
  server-side; the parser only asks nicely in the prompt. The behaviour on failure is
  correct (error output → `Generate Fallback Recipes`), but if you see the fallback firing
  often, delete the two `"additionalProperties": false` lines from the
  `Recipe Output Parser` schema — nothing else depends on them.
* **The "70% of the user's ingredients" rule is not in the current prompt.** The closest
  line in your file is `- Build them around the ingredients the user already has; use as
  many of them as sensible.` I kept the prompt verbatim rather than inventing a number.
  If you want the 70% rule, add it as one more `-` line in the System message of
  `OpenAI: Generate Recipes`.
* **Model id `gpt-6-luna`** came from the old `MODEL` constant; it is stored as a
  resource-locator value picked "from list". If your account cannot serve it, the node
  will say so — change it in `OpenAI Chat Model`.
* **`messages.messageValues[].type` value** `SystemMessagePromptTemplate` is LangChain's
  `lc_name()` of the system template class. That is how n8n matches the message class, and
  it is the value the editor writes — but I could not open your editor to diff it byte for
  byte. If the System message shows up empty or as "AI" after import, re-pick "System" in
  the dropdown; the text itself is in the file.
* **The example files** empty the credential `id` *and* `name` (as asked). Your previous
  `*.example.json` deleted the whole `credentials` block instead; the credential names are
  still written in each node's note, so nothing is lost. They also drop the
  instance-specific `errorWorkflow` id, same as before.
* **`n8n/README.md` now contradicts the workflows** and needs a pass: the "Why
  `.example.json`" paragraph (no private key is pasted anywhere any more), the "No
  Google/Firestore n8n credential needed" paragraph (the opposite is now true), the
  `Set Service Account Credentials` instructions, and rows 6–8 / 13–14 of the
  `generate-recipe` node table. I left the README untouched.
