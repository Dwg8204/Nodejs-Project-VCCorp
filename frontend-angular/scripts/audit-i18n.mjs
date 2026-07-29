import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appRoot = path.join(root, 'src', 'app');
const packRoot = path.join(root, 'public', 'i18n');
const codes = ['vi', 'en', 'zh'];
const packs = Object.fromEntries(
  codes.map((code) => [
    code,
    JSON.parse(fs.readFileSync(path.join(packRoot, `${code}.json`), 'utf8')),
  ]),
);
const referenceKeys = Object.keys(packs.en);
const missing = codes.flatMap((code) =>
  referenceKeys
    .filter((key) => !(key in packs[code]))
    .map((key) => `${code}: ${key}`),
);
const untranslatedChinese = referenceKeys.filter(
  (key) =>
    packs.zh[key] === packs.en[key]
    && !['A–Z', 'Z–A', 'ID', 'en-US'].includes(packs.en[key]),
);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const literalText = [];
const corruptedVietnamese = [];
for (const file of walk(appRoot).filter((item) => item.endsWith('.html'))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/>\s*([^<>{}@][^<>{}]*)\s*</g)) {
    const value = match[1].trim();
    if (
      /[A-Za-zÀ-ỹ]/.test(value)
      && !value.includes('{{')
      && !['Medium', 'ID', 'Key', 'A–Z', 'Z–A', '×'].includes(value)
    ) {
      literalText.push(`${path.relative(root, file)}: ${value}`);
    }
  }
  for (const match of source.matchAll(
    /language\.choose\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1\s*,/g,
  )) {
    const value = match[2];
    if (/\?\?|[A-Za-zÀ-ỹ]\?[A-Za-zÀ-ỹ]/.test(value)) {
      corruptedVietnamese.push(`${path.relative(root, file)}: ${value}`);
    }
  }
}

if (
  missing.length
  || untranslatedChinese.length
  || literalText.length
  || corruptedVietnamese.length
) {
  if (missing.length) console.error('\nMissing translation keys:\n', missing.join('\n'));
  if (untranslatedChinese.length) {
    console.error(
      '\nChinese values still equal English:\n',
      untranslatedChinese.map((key) => `${key}: ${packs.en[key]}`).join('\n'),
    );
  }
  if (literalText.length) console.error('\nHard-coded template text:\n', literalText.join('\n'));
  if (corruptedVietnamese.length) {
    console.error('\nCorrupted Vietnamese text:\n', corruptedVietnamese.join('\n'));
  }
  process.exitCode = 1;
} else {
  console.log(`i18n audit passed: ${referenceKeys.length} keys across ${codes.join(', ')}.`);
}
