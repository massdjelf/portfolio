#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'certifications.json');

const [,, cmd, ...args] = process.argv;

const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDb = (data) => fs.writeFileSync(dbPath, `${JSON.stringify(data, null, 2)}\n`);

if (!cmd || !['add','delete','list'].includes(cmd)) {
  console.log('Usage: node scripts/manage-certifications.js <list|add|delete> [options]');
  console.log('add options: --title "..." --issuer "..." --year "2026" --image "resources/certifications/file.webp"');
  console.log('delete options: --id 12345');
  process.exit(1);
}

const parseFlag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};

const db = readDb();

if (cmd === 'list') {
  console.log(JSON.stringify(db, null, 2));
  process.exit(0);
}

if (cmd === 'add') {
  const title = parseFlag('title');
  const issuer = parseFlag('issuer');
  const year = parseFlag('year');
  const image = parseFlag('image') || '';
  if (!title || !issuer || !year) {
    console.error('Missing required flags: --title --issuer --year');
    process.exit(1);
  }
  const next = [{ id: Date.now(), title, issuer, year, image }, ...db];
  writeDb(next);
  console.log('Certification added to certifications.json');
  process.exit(0);
}

if (cmd === 'delete') {
  const id = Number(parseFlag('id'));
  if (!id) {
    console.error('Missing required flag: --id');
    process.exit(1);
  }
  const next = db.filter((c) => Number(c.id) !== id);
  writeDb(next);
  console.log('Certification removed from certifications.json');
}
