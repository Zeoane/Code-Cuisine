/**
 * Packt den Produktions-Build in upload/code-a-cuisine - den Ordner, der per
 * FTP in /angular-projects/ gezogen wird. Er heisst so, wie er auf dem Server
 * heissen muss, damit aus dem Ziehen kein Umbenennen und kein Nachdenken ueber
 * "Ordner oder Inhalt?" wird.
 *
 * Warum ein Skript und nicht "dist einfach kopieren": der Server braucht eine
 * Datei, die der Angular-Build nicht erzeugt, die .htaccess (Umleitung aller
 * Routen auf index.html plus Cache-Header, siehe deploy/.htaccess). Fehlt sie,
 * antwortet jeder Reload ausserhalb der Startseite mit 404. Das Skript legt
 * beides zusammen und sagt hinterher, was drin ist.
 *
 * Aufruf:
 *   npm run build:upload   baut neu und packt
 *   npm run pack:upload    packt einen vorhandenen Build
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Ausgabeordner des Produktions-Builds (siehe angular.json, outputPath). */
const BUILD_DIR = join("dist", "code-a-cuisine", "browser");

/** Serverkonfiguration, die neben die index.html gehoert. */
const HTACCESS = join("deploy", ".htaccess");

/** Arbeitsordner, wird bei jedem Lauf frisch angelegt. */
const UPLOAD_DIR = "upload";

/**
 * Ziel: heisst genau wie der Ordner auf dem Server, damit er als Ganzes
 * hinuebergezogen werden kann.
 */
const TARGET = join(UPLOAD_DIR, "code-a-cuisine");

/** Ab dieser Groesse wird eine Datei einzeln gemeldet (in Bytes). */
const LARGE_FILE = 1024 * 1024;

/**
 * Prüft, dass Build und .htaccess vorhanden sind, und bricht sonst mit einer
 * Erklärung ab. Ein leerer upload/-Ordner auf dem Server wäre schlimmer als
 * ein Fehler hier.
 */
function checkSources() {
  if (!existsSync(join(BUILD_DIR, "index.html"))) {
    fail(`Kein Build gefunden in ${BUILD_DIR}. Erst "npm run build" ausführen.`);
  }
  if (!existsSync(HTACCESS)) {
    fail(`${HTACCESS} fehlt. Ohne sie laufen Reloads auf Unterseiten in einen 404.`);
  }
}

/**
 * Beendet den Lauf mit einer Meldung und einem Exit-Code, damit npm den
 * Fehlschlag weitergibt.
 * @param {string} message
 */
function fail(message) {
  console.error(`\n  Abbruch: ${message}\n`);
  process.exit(1);
}

/** Legt upload/ frisch an, damit keine Datei aus einem alten Lauf bleibt. */
function resetTarget() {
  rmSync(UPLOAD_DIR, { recursive: true, force: true });
  mkdirSync(TARGET, { recursive: true });
}

/** Kopiert den Build und die .htaccess in den Zielordner. */
function copyFiles() {
  cpSync(BUILD_DIR, TARGET, { recursive: true });
  cpSync(HTACCESS, join(TARGET, ".htaccess"));
}

/**
 * Sammelt alle Dateien unterhalb von dir mit ihrer Größe.
 * @param {string} dir
 * @returns {{ path: string, bytes: number }[]}
 */
function collectFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [{ path, bytes: statSync(path).size }];
  });
}

/**
 * @param {number} bytes
 * @returns {string} Größe in MB mit einer Nachkommastelle.
 */
function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Berichtet, was im Zielordner liegt, und nennt einzelne große Dateien. Eine
 * Datei über 1 MB ist in diesem Projekt ein Hinweis auf ein Asset, das noch
 * als SVG statt als .webp mitgeht.
 * @param {{ path: string, bytes: number }[]} files
 */
function report(files) {
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  console.log(`\n  ${TARGET}${sep} ist fertig: ${files.length} Dateien, ${mb(total)}`);

  const large = files.filter((file) => file.bytes > LARGE_FILE).sort((a, b) => b.bytes - a.bytes);
  if (large.length > 0) {
    console.log(`\n  Auffällig groß (jeweils über 1 MB) - prüfen, ob noch gebraucht:`);
    large.forEach((file) => console.log(`    ${mb(file.bytes).padStart(8)}  ${relative(TARGET, file.path)}`));
  }

  console.log(`\n  In FileZilla den Ordner "code-a-cuisine" aus ${UPLOAD_DIR}${sep}`);
  console.log(`  nach /angular-projects/ ziehen. Fertige URL:`);
  console.log(`  https://gabriele-lerch.developerakademie.net/angular-projects/code-a-cuisine/\n`);
}

checkSources();
resetTarget();
copyFiles();
report(collectFiles(TARGET));
