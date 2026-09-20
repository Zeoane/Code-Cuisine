# Code-Review — Code à Cuisine

Stand: 20.09.2026 · Grundlage: Arbeitsstand nach Punkt 6 der Checkliste

## Wie geprüft wurde

Vier parallele Prüfläufe über den gesamten `src`-Baum, die Firestore-Regeln und
die n8n-Workflows: Korrektheit/Edge-Cases, Sicherheit/Datenschutz,
Angular-Framework und Ressourcen, Barrierefreiheit/HTML-Semantik.

**Jeder hier aufgeführte Befund wurde danach einzeln am Code nachgeprüft** —
Datei geöffnet, Zeile gelesen, bei ausführbarer Logik nachgerechnet. Befunde,
die sich nicht belegen ließen, stehen nicht drin. Wo ich etwas nur aus dem Code
ableiten, aber nicht ausführen konnte, steht das ausdrücklich dabei.

Nicht Teil dieses Reviews: Laufzeitverhalten im Browser (Punkt 8/9 der
Checkliste), Performance-Messungen, der noch fehlende LLM-Call (Punkt 1).

---

## Blocker

### B1 — Die n8n-Retention ist nicht aktiv, die Datenschutz-Aussage im Repo stimmt nicht

`n8n/workflows/Recipe Generation.json`, `Recipe Quota Status.json` → `settings`

In beiden **Live**-Exporten fehlen `saveDataSuccessExecution`,
`saveDataErrorExecution`, `saveManualExecutions` und `saveExecutionProgress`
vollständig. In den `.example.json`-Zwillingen stehen sie korrekt auf
`"none"` bzw. `false`. Fehlende Schlüssel heißen: n8n-Cloud-Standard, also
**alles speichern**. Ebenfalls verschwunden ist `errorWorkflow`.

Belegt durch Vergleich: meine Arbeitskopien vom 17.09. hatten beide Felder
gesetzt, die heute vom Rechner geholten Dateien haben sie nicht. Dazwischen
liegt der Re-Import und ein Export aus n8n. Die naheliegende Erklärung:
**n8n überträgt beim „Import from File" den `settings`-Block nicht** — die
Einstellungen kamen also nie im Live-Workflow an, und der spätere Export bildet
diesen Zustand korrekt ab.

Folge: In jedem gespeicherten Execution-Datensatz steht die **Roh-IP** des
Besuchers im Output des Webhook-Nodes, samt vollständiger Zutatenliste. Das
`delete forwarded.headers` in „Extract Client IP" läuft erst *danach* und
schützt an dieser Stelle nichts. `n8n/README.md` behauptet im Abschnitt
„Execution data is not retained either" das Gegenteil — in einer Arbeit, die
Datenschutz als Argument führt, ist diese Lücke zwischen Doku und Realität das
größere Problem als die Einstellung selbst.

**Hierzu eine Korrektur meinerseits:** Ich hatte dir „leere Executions-Liste =
neue Settings aktiv" als Prüfkriterium genannt. Deine Antwort „2 ist success
für heute" war korrekt zu lesen als: die Liste zeigt erfolgreiche Läufe. Ich
habe sie als „Prüfung 2 bestanden" gedeutet und dir daraufhin bestätigt, der
neue Stand sei aktiv. Das war falsch.

**Fix:** Die vier Felder in n8n direkt setzen (Workflow → „..." → Settings), für
beide Workflows, plus Error Workflow = `Error Notifications`. Danach die
Dateien neu exportieren. Nicht über den Import lösen.

### B2 — `library_recipes` nimmt unauthentifizierte, unbegrenzte Schreibzugriffe an

`firestore.rules:21-28`

```
allow create: if request.resource.data.title is string && … && recipeId == string(request.resource.data.id);
allow update, delete: if false;
```

Kein `request.auth`, keine Längenbegrenzung, keine Feld-Whitelist, kein Beleg,
dass der Inhalt aus n8n stammt. Firebase-Config und Projekt-ID stehen im
ausgelieferten Bundle.

**Szenario:** Ein Skript schreibt `library_recipes/999001` mit beliebigem
`title` und einem 900-KB-Füllfeld, in einer Schleife. Die öffentliche
`/library`-Seite zeigt diese Titel jedem Besucher ohne Account. Wegen
`update, delete: if false` kann die App sie **nicht wieder entfernen** — nur
über die Firebase-Konsole. Die IP-Quota greift hier nicht, weil dieser
Schreibpfad n8n gar nicht berührt.

Entschärfend: Angular escaped Interpolation, ein XSS entsteht daraus nicht.
Der Schaden ist Inhalt, Kosten und Unlöschbarkeit aus der App heraus.

### B3 — Der Zähler `library_meta/counter` ist von außen beschreibbar

`firestore.rules:35` — `allow create, update: if request.resource.data.value is int;`

Ein einziger Schreibzugriff mit `{value: 0}` setzt den Zähler zurück. Danach
vergibt `LibraryService.addGenerated` (`library.service.ts:66-81`) wieder die
IDs 1/2/3; die Dokumente existieren bereits, `set` wird zum Update, und Regel
Zeile 28 verbietet Updates. Die Transaktion bricht ab — **bei jeder weiteren
Generierung erneut**. Der Fehler wird von `void this.library.addGenerated(...)
.catch(() => {})` (`loading.component.ts:119`) verschluckt: kein Log, keine
Meldung, die Bibliothek nimmt einfach nichts mehr auf.

---

## Hoch

### H1 — Der Zurück-Button löst eine zweite, kostenpflichtige Generierung aus

`loading.component.ts:129`, `preferences.component.ts:130`

Beide Navigationen laufen ohne `replaceUrl`, und `ngOnInit` startet
`runGeneration()` bedingungslos bei jeder Aktivierung.

**Szenario:** Rezepte werden angezeigt, der Nutzer drückt Zurück und erwartet
`/preferences`. Stattdessen wird `/loading` erneut betreten: neuer Webhook-Call,
**eine weitere der drei Tagesgenerierungen verbraucht**, drei weitere Kopien in
der öffentlichen Bibliothek, 11,2 Sekunden Animation, danach wieder `/results`
— mit anderen Rezepten als vorher. Zurück führt nie an der Ladeseite vorbei.

**Fix:** `navigate(..., { replaceUrl: true })` auf beiden Sprüngen; zusätzlich
in `ngOnInit` nur generieren, wenn `wizard.results()` noch leer ist.

### H2 — Der Diät-Filter übersieht Fleisch, Fisch und Milchprodukte aus der eigenen Vorschlagsliste

`core/services/diet-check.ts` — **mein Code von gestern.**

Ich hatte gegen alle 992 Autocomplete-Einträge auf *falsche Treffer* geprüft und
null gefunden. Auf *übersehene* Einträge habe ich nicht geprüft. Nachgeholt,
mit der laufenden Funktion:

| Diät | wird nicht erkannt |
|---|---|
| vegetarisch | Sea Bass, Kielbasa, Tripe, Black Pudding, Mincemeat, Escargots, Foie Gras |
| vegan | Brie, Manchego, Parmigiano-reggiano, Queso Fresco, Mayonnaise, Quark, Whey, Creamed Corn |
| keto | Maltodextrin, Cornflakes, Muesli, Quinoa |

**Szenario:** „Sea Bass" aus dem Autocomplete wählen, Vegan anklicken. Kein
Hinweis, `dietSafeIngredients()` behält die Zutat, und Schritt 1 des Rezepts
lautet „Wash and prepare Sea Bass." unter dem Tag „Vegan".

**Fix:** Die Stichwortlisten um Käsesorten, Fischarten und Innereien ergänzen —
am sinnvollsten nicht frei erfunden, sondern aus `ingredient-suggestions.ts`
abgeleitet, damit die Liste zur tatsächlichen Vokabular-Basis passt.

### H3 — Die Rezeptseite zeigt die Zutaten, die die Generierung ausgeschlossen hat

`recipe-view.component.ts:57` — `ownIngredients = this.wizard.ingredients`

Das ist die ungefilterte Eingabeliste, während generiert wurde mit
`usableIngredients()`. Schritt 2 verspricht „The recipe will be made without
them", und dann steht „200g Bacon" unter „Your ingredients" neben dem Tag
„Vegan". Die Oberfläche widerspricht sich selbst.

**Fix:** In `recipe-view` dieselbe Filterung anwenden, oder die
ausgeschlossenen Zutaten separat und sichtbar als „left out" ausweisen.

### H4 — Eine erfolgreiche Generierung wird als „Something went wrong" verworfen

`recipe-generator.service.ts:100` + `quota.service.ts:46`

`applyFromResponse(successBody.quota)` läuft **vor** `return successBody.recipes`
und greift ungeprüft auf `status.ipRemaining` zu. Fehlt `quota` im
200er-Body, wirft das einen `TypeError`, den der eigene `catch` in einen
generischen `generation_failed` übersetzt.

Bemerkenswert: der Kommentar direkt darüber (Zeile 88) hält ausdrücklich fest,
dass n8n-Antwortformen unzuverlässig sind — genau dieser Fall ist aber nicht
abgesichert. Der Nutzer wartet 11 Sekunden, verliert eine Generierung und sieht
einen Fehler, obwohl die Rezepte da waren.

**Fix:** Erst `recipes` zurückgeben bzw. zwischenspeichern, Quota-Übernahme in
`if (successBody.quota)` kapseln.

---

## Mittel

### M1 — Zwei Modals sperren das Scrollen dauerhaft

`not-enough-modal.component.ts:38`, `impressum-modal.component.ts:31`

Beide setzen `document.body.style.overflow = "hidden"` in `ngOnChanges` und
implementieren **kein** `OnDestroy`. Wird die Komponente zerstört, solange
`open` true ist — etwa per Browser-Zurück statt über den Schließen-Button —
bleibt die Sperre bestehen. `/preferences` ist länger als jeder Viewport und
lässt sich danach nicht mehr scrollen; die Diät-Chips unterhalb der Falz sind
unerreichbar, bis die Seite neu geladen wird.

**Fix:** `ngOnDestroy() { document.body.style.overflow = ""; }` in beiden.

### M2 — `track recipe.title` ist kein eindeutiger Schlüssel

`results.component.html:40`, `recipe-results.component.html:3`,
`cookbook.component.html:47`

`recipes()` kommt unverändert aus der n8n-Antwort; nichts garantiert, dass drei
Vorschläge verschiedene Titel haben. Beim lokalen Mock kann es nicht passieren,
der Mock ist aber nicht der konfigurierte Pfad. Bei doppeltem Titel: im
Dev-Build NG0955 und die Seite rendert nicht; im Prod-Build zeigt Karte 2 den
Inhalt von Karte 1, während `openRecipe($index)` weiterhin Index 1 öffnet — der
Nutzer klickt eine Karte an und bekommt ein anderes Rezept.

**Fix:** `track $index` an diesen drei Stellen. Die übrigen `@for` verwenden
bereits eindeutige IDs.

### M3 — Abgebrochene Läufe laufen weiter und können neuere überschreiben

`loading.component.ts:115-119`

`ngOnDestroy` räumt nur den Timer ab. Der laufende `generate()`-Aufruf schreibt
weiterhin `wizard.results.set(...)` und in die Bibliothek. Zwei Läufe
überlappt, der erste antwortet später: die alten Rezepte überschreiben die
neuen. Zusätzlich bleibt `minDelay` nach `clearTimeout` für immer unaufgelöst,
sodass der async-Frame samt Rezeptdaten hängen bleibt.

**Fix:** Ein Abbruch-Flag in `ngOnDestroy` setzen und vor jedem `set`/`navigate`
prüfen; `resolve()` beim Aufräumen mit aufrufen.

### M4 — `lang="de"` auf einer durchgehend englischen Oberfläche

`src/index.html:2`

Screenreader sprechen alle englischen Texte mit deutscher Aussprache.
Einzeiliger Fix: `lang="en"`. (Das Impressum bleibt deutsch — dieser Abschnitt
kann ein eigenes `lang="de"` bekommen.)

### M5 — Pinch-Zoom ist deaktiviert

`src/index.html:7` — `maximum-scale=1`

Nutzer mit Sehbeeinträchtigung können auf iOS nicht zoomen. Das steht im
direkten Widerspruch zur eigenen Vorgabe „nie unter 16px", die genau diese
Gruppe schützen soll. `maximum-scale=1` ersatzlos streichen.

### M6 — Das Autocomplete ist mit der Tastatur nicht bedienbar

`ingredient-quantity-form.component.html:24` + `.ts:51-55`

Die Vorschläge hängen ausschließlich an `(mousedown)`. `handleKeydown` behandelt
nur `Enter` und schickt das Formular ab — es gibt keine Pfeiltasten-Navigation
durch die Liste. Zudem blendet ein 150-ms-Timer nach `blur` die Liste aus. Das
zentrale Eingabefeld der App ist damit reine Mausbedienung.

### M7 — Die Nährwert-Liste ordnet Begriff und Wert nicht zu

`recipe-view.component.html:75-108`

Vier `<dt>` hintereinander, danach vier `<dd>`. Nach dem `dl`-Inhaltsmodell
gehören dann alle vier Werte zu allen vier Begriffen. Ein Screenreader liest
„Energy, Protein, Fat, Carbs — 520 kcal, 28g, 18g, 55g", ohne Zuordnung. Die
optische Paarung entsteht nur durch das Grid.

**Fix:** Je ein `<div>` um ein `<dt>`/`<dd>`-Paar, wie es die Karten-Variante in
`recipe-nutrition.component.html` bereits macht.

---

## Niedrig

- **N1 — Toter Code.** `recipes/recipe-results/` und `recipes/ingredient-input/`
  werden nirgends verwendet (geprüft: Selektor und Klassenname kommen nur in
  den eigenen Dateien vor). `recipes/generator-options/` ist ein leeres Paar aus
  `export {}` und einer HTML-Kommentarzeile. Alle drei Ordner können weg.
- **N2 — Ungenutzte `imports`.** `IconComponent` steht in `recipe-view`,
  `recipe-detail` und `cookbook` im `imports`-Array, ohne dass `app-icon` im
  Template vorkommt. Angular 18 meldet das als Build-Warnung.
- **N3 — Touch-Ziele unter 44px.** Die Portions- und Helfer-Stepper sind
  `h-5 w-5` (20px), die Zeilen-Buttons der Zutatenliste `h-6 w-6` (24px), die
  Auswahl-Chips `h-7` (28px). Die Checkliste verlangt 44px.
- **N4 — Leere Menge wird als `null` gespeichert.** Im Inline-Editor der
  Zutatenliste (`ingredient-entry-list.component.ts:49`) wird der Wert ohne
  Prüfung übernommen; ein geleertes Zahlenfeld liefert `null`. Die Zeile zeigt
  dann „g" ohne Zahl, und die Rezeptseite gibt `nullg Tomatoes` aus. Negative
  Werte werden ebenfalls angenommen.
- **N5 — Aktiver Navigationspunkt nur über Farbe.** `site-header.component.ts:68`
  unterscheidet aktiv/inaktiv über `text-creme` gegen `text-creme/70`, ohne
  `aria-current`. Die Rezeptseite macht es an anderer Stelle bereits richtig.
- **N6 — Überschriftenebenen springen.** `recipe-view` geht von `h1` direkt auf
  `h3`; `home` rendert das `h2` vor dem `h1`; `recipe-detail` hat gar kein `h1`.

---

## Geprüft und in Ordnung

- **Kein XSS.** Das einzige `bypassSecurityTrustHtml` (`icon.component.ts:35`)
  löst einen statischen `Record<string, string>` auf; die einzige dynamische
  Bindung ist ein Ternär zwischen zwei Literalen.
- **`.gitignore` deckt die Geheimnisse ab.** `n8n/workflows/*.json` mit
  Ausnahme der `.example.json`, dazu `environment*.ts`, `*.pem`, `*.key`,
  `*firebase-adminsdk*.json`. Die Live-Exporte enthalten echte Werte, die
  Beispiele sind leer — beides geprüft, ohne die Werte auszulesen.
- **Die Quota-Collections sind dicht.** `quota_ip` und `quota_total` stehen auf
  `read, write: if false`; der Zugriff läuft ausschließlich über das
  Service-Konto in n8n.
- **Serverseitige Validierung ist echt.** „Validate Request Payload" prüft
  Zutatenzahl, Portionen, Helfer und Enum-Werte unabhängig vom Angular-Formular.
- **Die Nährwert-Rechnung stimmt.** Größte-Reste-Rundung ergibt in allen
  geprüften Fällen exakt 100 %, inklusive Drittelung und Nullwerten.
- **Keine Leaks bei Subscriptions und Listenern.** `@HostListener` räumt das
  Framework ab, `ToastService` lebt auf App-Ebene, `LibraryComponent` ist
  korrekt reaktiv.
- **Alle übrigen `track`-Ausdrücke sind eindeutig** (`entry.id`, `recipe.id`,
  `macro.key`, `option.value`, `item.path`).
- **Kein `(click)` auf nicht fokussierbaren Elementen**, alle dekorativen Bilder
  haben `alt=""`, alle Icon-Buttons haben ein `aria-label`.

---

## Vorschlag zur Reihenfolge

1. **B1** in n8n nachziehen — betrifft die Datenschutz-Aussage der Arbeit und
   kostet zehn Minuten.
2. **B2/B3** in `firestore.rules` — `library_recipes` auf Feld-Whitelist und
   Längengrenzen, `library_meta/counter` gegen Rückwärtssetzen absichern.
3. **H1** und **H4** — beides kleine Änderungen mit spürbarer Wirkung, H1
   verbrennt sonst Tagesquota.
4. **H2/H3** — der Diät-Filter, damit er hält, was Schritt 2 verspricht.
5. **M1, M2, M4, M5** — vier Ein- bis Zweizeiler.
6. Der Rest nach Zeit.

Geschätzt: Blocker und Hoch zusammen rund 3 Stunden, Mittel rund 2, Niedrig
rund 1,5.
