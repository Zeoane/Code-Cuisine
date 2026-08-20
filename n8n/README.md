# n8n workflows — IP-based quota (User Story 11)

Three workflows implement the IP-based quota system: **3 recipes per IP per
day, 12 per day system-wide**, enforced server-side as a cost airbag (not
just in the Angular frontend).

- [`workflows/Recipe Generation.example.json`](workflows/Recipe%20Generation.example.json) —
  the main webhook: validates the request, checks/increments quota, returns
  (currently mock) recipes.
- [`workflows/Recipe Quota Status.example.json`](workflows/Recipe%20Quota%20Status.example.json) —
  read-only webhook so the Angular app can show "X of 3 left today" before
  the user even tries to generate.
- [`workflows/Error Notifications.example.json`](workflows/Error%20Notifications.example.json) —
  Error Trigger + email, referenced as the other two workflows' Error
  Workflow.

**Why `.example.json`:** this project signs the Firestore JWT inline in a
Code node rather than using an n8n credential object (see below), so a raw
"Download" from n8n includes whatever real client_email/private_key you've
pasted in. `.gitignore` excludes every other `.json` file under
`n8n/workflows/` — **download from n8n into this folder as often as you
like**, using n8n's own filenames; it's ignored automatically. Only these
three sanitized `*.example.json` files (placeholders instead of real
credentials) are meant to be committed. If you change the workflow logic and
want to update the committed template, copy your real export over the
`.example.json` file and manually put the two placeholder lines back in
"Build & Sign Firestore JWT" before saving.

**Import caveat:** these JSON files were written by hand (no live n8n
instance was available to build/test against), following n8n's documented
export shape. If "Import from File" doesn't come in cleanly — a node type
version mismatch is the likely culprit — use the **node-by-node build
instructions** below instead; every expression/Code-node body is exact and
copy-pasteable regardless of import success.

## 1. Prerequisites (manual, in Firebase + n8n)

1. **Firebase Console → Project Settings → Service Accounts → Generate new
   private key.** Download the JSON. Never commit it — already covered by
   `.gitignore`'s `*firebase-adminsdk*.json` rule.
2. **An email-sending credential** for `error-notifications` (SMTP, Gmail,
   or whatever n8n's Email node supports in your instance) — self-notifying
   to `codeacuisine@gmail.com` is the simplest setup.

**No Google/Firestore n8n credential needed.** n8n Cloud workspaces don't
consistently expose a usable Firestore/service-account credential type (ours
didn't — only OAuth2-only, wrong-product options like "Google Cloud Natural
Language" showed up, which don't work for a service account and aren't even
the right API). Both webhooks instead mint their own Firestore access token
at the start of each run:

**Build & Sign Firestore JWT** (Code node) → signs a JWT assertion with the
service account's private key (`crypto.createSign('RSA-SHA256')`, a Node
built-in n8n's Code node allows by default) → **Exchange JWT for Access
Token** (HTTP Request, POST to `https://oauth2.googleapis.com/token`, no
credential needed — it's a public token endpoint) → **Store Access Token**
(Code) carries the resulting `access_token` forward. Every later Firestore
`HTTP Request` node sends it as `Authorization: Bearer <token>` via a plain
header parameter — no n8n credential object at all, so this works on any
n8n instance/plan.

**After importing (or building) `generate-recipe` and `quota-status`**, fill
in the credentials via a **Set node's form fields**, not by editing code —
pasting a multi-line secret into a JS code editor kept breaking on stray
quotes/commas/escaping picked up along the way; a plain n8n text field takes
any paste as-is, no escaping rules to get wrong:

1. Both workflows have a **"Set Service Account Credentials"** node (an
   "Edit Fields (Set)" node) right before **"Build & Sign Firestore JWT"**.
   Open it and fill in its two fields directly from the downloaded service
   account JSON — paste each value as-is, with or without the surrounding
   quotes, it doesn't matter:
   - `serviceAccountEmail` ← the JSON's `client_email` field (not secret).
   - `serviceAccountPrivateKey` ← the JSON's `private_key` field, pasted in
     any form (one line, multi-line, literal `\n` text or real line breaks).
   - `quotaIpSalt` ← a random string of at least 16 characters, e.g. from
     `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.
     **Both workflows must use the exact same value**, otherwise
     `quota-status` reads a different document than `generate-recipe` writes
     and the badge always shows 3 of 3. Treat it as a secret: whoever knows
     it can re-derive which IP a counter belongs to.
2. **"Build & Sign Firestore JWT"** reads both fields from `$json` and
   normalizes the key itself: it locates the `BEGIN`/`END PRIVATE KEY`
   markers and keeps only the Base64 characters between them, rebuilding a
   clean PEM — so however the key was pasted, only the meaningful payload
   is used.

**Do this only inside n8n, never in the committed JSON files** — the Set
node's fields in `workflows/*.example.json` must stay empty; only the copy
living in your n8n workspace should hold the real values.

## 2. Import (or build manually)

For each JSON file: n8n → Workflows → **+ Add workflow** → "..." menu →
**Import from File**. After import:

- Fill in the two placeholders in **"Build & Sign Firestore JWT"** as
  described above (both `generate-recipe` and `quota-status` have their own
  copy of this node — fill in both).
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
| 6 | Build & Sign Firestore JWT | Code | signs a JWT assertion with the service account key (see setup above) |
| 7 | Exchange JWT for Access Token | HTTP Request | POST `oauth2.googleapis.com/token`, no credential needed |
| 8 | Store Access Token | Code | carries `access_token` forward as `accessToken` |
| 9 | Compute Quota Keys | Code | UTC `date`, `ipDocId = date_sha256(salt\|ip)`, `totalDocId = date`; drops `clientIp` from the item |
| 10 | Read IP Quota Counter | HTTP Request | GET Firestore doc `quota_ip/{ipDocId}`, header `Authorization: Bearer {accessToken}`, **Never Error** on (missing doc ⇒ handled as 0 downstream) |
| 11 | Read Global Quota Counter | HTTP Request | GET Firestore doc `quota_total/{totalDocId}`, same header, Never Error on |
| 12 | Parse Quota Counts | Code | reads nodes 9–11 by name, defaults missing docs to `count: 0` |
| 13 | Check Quota Limits | IF | `{{ $json.ipCount >= 3 || $json.totalCount >= 12 }}` |
| 13a | Build Quota Exceeded Response → Respond: 429 | Code → Respond to Webhook | message differs depending on which limit tripped |
| 13b | Increment IP Quota | HTTP Request | PATCH (upserts) `quota_ip/{ipDocId}` with `count = ipCount + 1`, same Bearer header |
| 14 | Increment Global Quota | HTTP Request | PATCH (upserts) `quota_total/{totalDocId}` with `count = totalCount + 1`, same Bearer header |
| 15 | Generate Mock Recipes | Code | ported from `recipe-generator.service.ts` + `cuisine-presets.ts` — same algorithm, same output shape |
| 16 | Respond: 200 Success | Respond to Webhook | 200, `{ recipes, quota: { ipRemaining, totalRemaining } }` |

Firestore REST base URL used throughout:
`https://firestore.googleapis.com/v1/projects/code-a-cuisine-3d1e0/databases/(default)/documents/...`

### `quota-status` — node chain

Same as steps 1–3, 6–12 above (IP extract → validate → sign JWT → get
access token → quota keys → read both counters → parse counts), no payload
validation, no increments → **Build Status Response** (Code,
`{ ipRemaining, totalRemaining }` from the parsed counts) → **Respond: 200
Success**.

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

**Remaining caveat:** n8n stores the full execution data, including the
original webhook headers, for every run. If you want the raw IP gone
end-to-end, set the workflows' **Settings → Save successful/failed
production executions** to *Do not save* (or shorten the data retention in
the n8n instance settings).

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
