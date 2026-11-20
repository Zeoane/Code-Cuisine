/**
 * Netlify-Build: schreibt die Firebase-Konfiguration (src/environments/environment.ts),
 * die absichtlich nicht auf GitHub liegt (.gitignore).
 * Der Inhalt kommt Base64-kodiert aus der Netlify-Umgebungsvariable APP_CONFIG_BASE64.
 * Lokal wird das Skript nicht gebraucht, dort existiert die Datei bereits.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const target = 'src/environments/environment.ts';
const encoded = process.env.APP_CONFIG_BASE64;

if (!encoded) {
  console.error('APP_CONFIG_BASE64 fehlt: in Netlify unter Project configuration > Environment variables eintragen.');
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, Buffer.from(encoded, 'base64').toString('utf8'));
console.log(target + ' wurde geschrieben.');
