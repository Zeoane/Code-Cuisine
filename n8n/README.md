# n8n workflows — IP-based quota (User Story 11)

Three workflows implement the IP-based quota system: **3 recipes per IP per
day, 12 per day system-wide**, enforced server-side as a cost airbag (not
just in the Angular frontend).

- [`workflows/Recipe Generation.example.json`](workflows/Recipe%20Generation.example.json) —
  the main webhook: validates the request, checks/increments quota, has the
  model write three recipes and returns them.
- [`workflows/Recipe Quota Status.example.json`](workflows/Recipe%20Quota%20Status.example.json) —
  read-only webhook so the Angular app can show "X of 3 left today" before
  the user even tries to generate.
- [`workflows/Error Notifications.example.json`](workflows/Error%20Notifications.example.json) —
  Error Trigger + email, referenced as the other two workflows' Error
  Workflow.

**Why `.example.json`:** no secret is part of any of these files any more —
the service account lives in an n8n credential (see below) and the quota salt
is typed into a Set node after importing. What a raw "Download" from n8n
still carries is instance-specific: the credential **ids** of this n8n
workspace, the `errorWorkflow` id and the workflow ids. `.gitignore`
therefore excludes every other `.json` file under `n8n/workflows/` —
**download from n8n into this folder as often as you like**, using n8n's own
filenames; it's ignored automatically. Only these three sanitized
`*.example.json` files are meant to be committed; in them every credential
`id` and `name` is an empty string and the `errorWorkflow` id is dropped. If
you change the workflow logic and want to update the committed template, copy
your real export over the `.example.json` file and empty those fields again
before saving — the credential names are also written in each node's note, so
nothing is lost.

**Import caveat:** these JSON files were written by hand (no live n8n
instance was available to build/test against), following n8n's documented
export shape. If "Import from File" doesn't come in cleanly — a node type
version mismatch is the likely culprit — use the **node-by-node build
instructions** below instead; every expression/Code-node body is exact and
copy-pasteable regardless of import success.

## 1. Prerequisites (manual, in Firebase + n8n)

1. **Firebase Console → Project Settings → Service Accounts → Generate new
   private key.** Download the JSON. Never commit it — already covered by
   `.gitignore`'s `*firebase-adminsdk*.json` rule. Its `client_email` and
   `private_key` go into the n8n credential in step 4, nowhere else.
2. **An email-sending credential** for `error-notifications` (SMTP, Gmail,
   or whatever n8n's Email node supports in your instance) — self-notifying
   to `codeacuisine@gmail.com` is the simplest setup.
3. **An OpenAI credential** for the recipe generation itself: n8n → Credentials
   → New → *OpenAI*, paste the API key from
   <https://platform.openai.com/api-keys>. The key lives only in n8n; it is
   never part of the exported workflow JSON, which stores just the credential's
   name and id.
4. **A Firestore credential, created before you import anything:** n8n →
   **Credentials → Create credential → "Google Service Account API"**:

   | Field | Value |
   |-------|-------|
   | Name (top of the dialog) | `Firestore Service Account` — exactly this, the workflows reference it by name |
   | Region | leave at `global` (only used by the Vertex nodes) |
   | Service Account Email | the `client_email` from the service-account JSON of step 1 |
   | Private Key | the `private_key` from that JSON, without the surrounding quotes |
   | Impersonate a User | off |
   | **Set up for use in HTTP Request node** | **on — mandatory** |
   | Scope(s) | `https://www.googleapis.com/auth/datastore` |

   That last toggle is not cosmetic: with it off n8n's credential returns the
   request unsigned, and every Firestore call comes back 401.

**How Firestore is authenticated.** The four Firestore `HTTP Request` nodes
use the credential from step 4 — `Authentication: Predefined Credential Type`,
`Credential Type: Google Service Account API` — and n8n does the whole OAuth
dance itself: it signs the RS256 JWT assertion with the private key, POSTs it
to `https://oauth2.googleapis.com/token` and sets the resulting
`Authorization: Bearer <token>` header. Nothing in the workflows builds or
carries a token any more, and the private key never leaves the credential.

**After importing `generate-recipe` and `quota-status`**, one value still has
to be filled in by hand, via a **Set node's form field** rather than in code —
pasting a secret into a JS code editor kept breaking on stray
quotes/commas/escaping picked up along the way; a plain n8n text field takes
any paste as-is, no escaping rules to get wrong:

Both workflows have a **"Set Quota IP Salt"** node (an "Edit Fields (Set)"
node) right before **"Compute Quota Keys"**. Open it and fill in its single
field:

- `quotaIpSalt` ← a random string of at least 16 characters, e.g. from
  `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.
  **Both workflows must use the exact same value**, otherwise
  `quota-status` reads a different document than `generate-recipe` writes
  and the badge always shows 3 of 3. Treat it as a secret: whoever knows
  it can re-derive which IP a counter belongs to.

**Do this only inside n8n, never in the committed JSON files** — the Set
node's field in `workflows/*.example.json` must stay empty; only the copy
living in your n8n workspace should hold the real value.

**If a salt is already live, copy it out before you import.** Importing
replaces the Set node, and a different salt afterwards means today's counters
live under different document ids and the badge jumps back to "3 of 3".

## 2. Import (or build manually)

With the `Firestore Service Account` credential in place, import each JSON
file: n8n → Workflows → **+ Add workflow** → "..." menu → **Import from
File**. Importing over an existing workflow keeps its id and therefore its
production webhook URL, so nothing in `environment.ts` changes. After import,
in this order:

- **Pick the credential in the four Firestore nodes.** The exported files
  carry the credential's name but an empty id, and n8n is not documented to
  re-link a credential by name — so open each of `generate-recipe` →
  **"Reserve Quota Slot"**, **"Release Quota Slot"** and `quota-status` →
  **"Read IP Quota Counter"**, **"Read Global Quota Counter"** and select
  `Firestore Service Account` in *Credential for Google Service Account API*.
  Also check that **"OpenAI Chat Model"** shows your OpenAI credential.
- **Paste the quota salt** into the **"Set Quota IP Salt"** node of both
  workflows, as described above — the same value in both.
- **Re-set the workflow settings** the import ignores (Error Workflow and
  execution-data retention) — see *Set this in n8n, not by importing a file*
  below.
- The `Send Error Email` node needs the email credential from step 1.

**If import fails**, build each workflow from scratch using the node list
below — add nodes by name from n8n's node panel, then paste the exact
parameter values/code shown (all of it is also inline in the JSON files, so
you can copy from there instead of retyping).

### `generate-recipe` — node chain

| # | Node | Type | Notes |
|---|------|------|-------|
| 1 | Webhook: Recipe Generation Request | Webhook | POST, path `generate-recipe`, Respond: "Using Respond to Webhook Node" |
| 2 | Extract Client IP | Code | reads `$json.ip` → `headers['x-forwarded-for']` (first entry) → `x-real-ip`/`cf-connecting-ip`; validates IPv4/IPv6 shape |
| 3 | IP Valid? | IF | `{{ $json.clientIpValid }}` |
| 3a | Respond: 400 Invalid IP | Respond to Webhook | 400, `{error:"invalid_request", message:"..."}` |
| 4 | Validate Request Payload | Code | re-checks `ingredients`/`servings`/`helpers`/enum fields against the same ranges Angular enforces (defense in depth) |
| 5 | Payload Valid? | IF | `{{ $json.payloadValid }}` |
| 5a | Respond: 400 Invalid Request | Respond to Webhook | 400, joined `payloadErrors` |
| 6 | Set Quota IP Salt | Edit Fields (Set) | holds `quotaIpSalt`, the only secret left in the workflow; "Include Other Fields" is on so the value travels with the item |
| 7 | Compute Quota Keys | Code | UTC `date`, `ipDocId = date_sha256(salt\|ip)`, `totalDocId = date`; drops `clientIp` from the item |
| 8 | Reserve Quota Slot | HTTP Request | POST `documents:commit` — one atomic commit that raises `quota_ip/{ipDocId}` and `quota_total/{totalDocId}` by 1 via an `increment` transform and upserts `date`; authenticated with the `Firestore Service Account` credential |
| 9 | Parse Quota Reservation | Code | reads the post-increment counts from `writeResults[].transformResults[0].integerValue` |
| 10 | Check Quota Limits | IF | `{{ $json.ipCount > 3 \|\| $json.totalCount > 12 }}` — the counts already include this request, so the limit trips one step later than with a read-first gate |
| 10a | Release Quota Slot | HTTP Request | same commit with `increment: -1`, handing the slot back before the 429 is sent |
| 10b | Build Quota Exceeded Response → Respond: 429 | Code → Respond to Webhook | message differs depending on which limit tripped |
| 11 | Build LLM Request | Code | turns the validated options into `promptRequest`, the compact JSON the prompt works from (servings, cooks, cuisine, diet rule, time hint, ingredients at home) |
| 12 | OpenAI: Generate Recipes | Basic LLM Chain | the generation rules as its System message, `{{ $json.promptRequest }}` as the user message (*Prompt: Define below*), *Require Specific Output Format* on; errors leave through the second output |
| 12a | OpenAI Chat Model | OpenAI Chat Model | sub-node on 12's *Chat Model* connector: the model id (change it here), 60 s timeout, two retries, with the *OpenAI* credential |
| 12b | Recipe Output Parser | Structured Output Parser | sub-node on 12's *Output Parser* connector: *Schema Type: Manual*, the JSON schema of the answer in *Input Schema* |
| 13 | Validate & Normalise Recipes | Code | unwraps the parser's `{ output: { recipes: [...] } }`, repairs what the model may get wrong and enforces the caps from `firestore.rules`; throws (→ second output) when the answer is unusable |
| 13a | Generate Fallback Recipes | Code | the former mock generator, now the safety net for both error outputs — ported from `recipe-generator.service.ts` + `cuisine-presets.ts`, same output shape |
| 14 | Respond: 200 Success | Respond to Webhook | 200, `{ recipes, quota: { ipRemaining, totalRemaining } }` |

**Recipe generation: the model, the schema and the safety net.** The chain
pins the answer with a JSON schema held by the *Recipe Output Parser*
sub-node, so the model cannot reply with prose or rename a field: the parser
validates the answer against the schema and hands it on as data (under an
`output` key), or fails the node. It is the same schema the earlier HTTP
request passed as `response_format.json_schema`, so the contract with the
Angular app is unchanged. The schema covers the
shape; the length limits live in *Validate & Normalise Recipes*, which cuts
titles to 200 and descriptions to 1000 characters, caps ingredients at 50,
extras at 20 and steps at 30, keeps `servings` and `cuisineStyle` at what the
user actually chose, and replaces a cook number that does not exist with the
next cook in turn. Those are exactly the limits `firestore.rules` enforces, so
a generated recipe can never be rejected when the app saves it to the library.

If the call fails — timeout, rate limit, outage — or the answer cannot be
parsed or validated, the run leaves through the second output of *OpenAI:
Generate Recipes* or of *Validate & Normalise Recipes*, and *Generate
Fallback Recipes* answers instead. The user always gets three recipes, and the
quota block stays correct either way. To see the fallback on purpose, disable
the OpenAI credential for a moment and generate once.

Cost: one generation is roughly 1.5k tokens in and 2k out. With the model set
in *OpenAI Chat Model* that is well under a cent per generation, and the daily
limit of 12 generations caps it in any case.

Firestore REST base URL used throughout:
`https://firestore.googleapis.com/v1/projects/code-a-cuisine-3d1e0/databases/(default)/documents/...`

**Why the counter is raised before the limit is checked.** Reading a count,
adding one in the workflow and writing the result back loses an update
whenever two requests overlap: both read 2, both write 3, and one generation
is never billed. Firestore's `increment` transform does the addition inside
the database, so overlapping requests get 3 and 4 and never collide. The
price is that the check has to happen afterwards — a request over the limit
has already taken its slot, so node 10a gives it back before answering 429.
`update` + `updateMask: ["date"]` leaves `count` alone, which lets the same
call create the document on the day's first request (a missing field
increments from 0).

### `quota-status` — node chain

Same as steps 1–3 and 6–7 above (IP extract → validate → salt → quota keys),
no payload validation. Then two read-only GETs on `quota_ip/{ipDocId}` and
`quota_total/{totalDocId}` — **Read IP Quota Counter** and **Read Global
Quota Counter**, the same `Firestore Service Account` credential as in
`generate-recipe`, **Never Error** on so a missing document counts as 0 →
**Build Status Response** (Code, reads both counts and returns
`{ ipRemaining, totalRemaining }`) → **Respond: 200 Success**. This workflow
never writes, so it needs no commit.

### `error-notifications`

**Error Trigger** → **Format Error Details** (Code: pulls workflow name,
failed node, error message, execution URL, timestamp into an email
subject/body) → **Send Error Email**.

After building/importing, open both `generate-recipe` and `quota-status`'s
**Workflow Settings** and set **Error Workflow** to `Error Notifications`.

## 3. Activate and wire up Angular

1. **Activate** `generate-recipe` and `quota-status` (top-right toggle in
   the n8n editor) — the production `https://<your-subdomain>.app.n8n.cloud/webhook/...`
   URLs only resolve once a workflow is active; while inactive, only the
   `/webhook-test/...` URL works, and only while the editor tab is open.
2. Copy the two production URLs into
   [`src/environments/environment.ts`](../src/environments/environment.ts):
   ```ts
   n8n: {
     generateUrl: "https://<your-subdomain>.app.n8n.cloud/webhook/generate-recipe",
     quotaStatusUrl: "https://<your-subdomain>.app.n8n.cloud/webhook/quota-status",
   }
   ```
3. Reload the app. The quota badge on the Preferences step should show
   "3 of 3 recipe generations left today"; generating should increment it,
   and a 4th generation from the same network within a day should be
   blocked with a clear message.

## Privacy: no raw IP addresses are stored

IP addresses are personal data under the GDPR, and a counter does not need
them. The quota therefore keys on a **salted SHA-256 of the IP**, truncated
to 32 hex characters:

- Document id is `2026-08-24_9f2c…` instead of `2026-08-24_84.123.45.67`.
- The `quota_ip` document holds only `count` and `date` — no IP field.
- `Extract Client IP` drops the request headers from the item immediately,
  so `x-forwarded-for` does not travel through the rest of the run.
- The salt lives only in the n8n Set node, never in this repository.

The behaviour is unchanged: the same IP produces the same hash for the day,
so a shared office network still shares its 3 recipes. Without the salt the
hash would be pointless — there are only ~4 billion IPv4 addresses, so an
unsalted SHA-256 is brute-forced in seconds. That is why the Code node
throws if the salt is missing or shorter than 16 characters.

**Execution data is not retained either.** n8n would otherwise store the
full run of every request, including the original webhook headers with the
raw `x-forwarded-for`. Both webhook workflows therefore have retention
switched off, which the exported JSON carries in its `settings` block as:

```json
"saveDataSuccessExecution": "none",
"saveDataErrorExecution": "none"
```

**Set this in n8n, not by importing a file.** "Import from File" does not
apply the `settings` block — the values land in the JSON but never in the
running workflow. Open the workflow, **"…" → Settings**, set *Save
successful production executions* and *Save failed production executions*
to **Do not save**, switch off *Save manual executions* and *Save execution
progress*, confirm the dialog, then save the workflow itself. The same menu
holds **Error Workflow**, which must point at `Error Notifications`; it is
exported as `errorWorkflow` and shares the same import caveat. n8n only
writes settings into the export that differ from the instance default, so a
field missing from the JSON is not proof that it is switched on — read it in
the UI.

The raw IP is thus gone end-to-end: it exists only in memory for the few
nodes between the webhook and `Compute Quota Keys`. Error notifications are
unaffected — the Error Trigger fires from the run itself, not from stored
execution data. While debugging it can help to set
`saveDataErrorExecution` back to `"all"` temporarily; remember to switch it
off again before the workflows go live.

## JSON request/response contract

**POST `/generate-recipe`** — body is `GenerationOptions` verbatim (matches
[`recipe.models.ts`](../src/app/core/models/recipe.models.ts)):
```json
{
  "ingredients": ["Rice", "Chicken"],
  "servings": 2,
  "timeCategory": "medium",
  "cuisineStyle": "german",
  "diet": "none",
  "helpers": 1
}
```
Success (200): `{ "recipes": GeneratedRecipe[], "quota": { "ipRemaining": number, "totalRemaining": number } }`
Errors (400/429): `{ "error": "invalid_request" | "quota_exceeded", "message": string, "quota"?: {...} }`

**GET `/quota-status`** — no body. Response (200):
`{ "ipRemaining": number, "totalRemaining": number }`
