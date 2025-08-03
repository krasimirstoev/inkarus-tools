#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function printHelp() {
  console.log(`
🈯 i18n-validator — Validate language JSON files against template.json

Usage:
  node i18n-validator.js --lang=es [--verbose]
  node i18n-validator.js -l fr
  node i18n-validator.js --language=de

Options:
  --lang=xx, -l=xx         Required. Language code to validate (e.g. "es")
  --verbose                Show detailed output
  --help                   Show this help message
`);
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { lang: null, verbose: false };

  for (const arg of args) {
    if (arg === '--help') printHelp();
    if (arg === '--verbose') result.verbose = true;
    if (arg.startsWith('--lang=')) result.lang = arg.split('=')[1];
    if (arg.startsWith('--language=')) result.lang = arg.split('=')[1];
    if (arg.startsWith('-l=')) result.lang = arg.split('=')[1];
  }

  if (!result.lang) {
    console.error('❌ Missing required argument: --lang=xx');
    printHelp();
  }

  return result;
}

function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, fullKey));
    } else {
      acc[fullKey] = value;
    }
    return acc;
  }, {});
}

function validate(templatePath, langPath, verbose) {
  let templateJson, langJson;

  try {
    templateJson = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  } catch (err) {
    console.error(`❌ Failed to read or parse template.json: ${err.message}`);
    process.exit(1);
  }

  if (!fs.existsSync(langPath)) {
    console.error(`❌ Language file "${langPath}" not found.`);
    process.exit(1);
  }

  try {
    langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  } catch (err) {
    console.error(`❌ Failed to read or parse ${langPath}: ${err.message}`);
    process.exit(1);
  }

  const flatTemplate = flatten(templateJson);
  const flatLang = flatten(langJson);

  const missingKeys = Object.keys(flatTemplate).filter(k => !(k in flatLang));
  const extraKeys = Object.keys(flatLang).filter(k => !(k in flatTemplate));
  const emptyKeys = Object.entries(flatLang)
    .filter(([k, v]) => v === '' || v === null)
    .map(([k]) => k);

  if (verbose) {
    console.log(`\n🔍 Validating: ${langPath}`);
    console.log(`📐 Keys in template.json: ${Object.keys(flatTemplate).length}`);
    console.log(`📄 Keys in ${path.basename(langPath)}: ${Object.keys(flatLang).length}`);
    console.log('');

    if (missingKeys.length) {
      console.log(`❌ Missing keys in ${path.basename(langPath)}:`);
      missingKeys.forEach(k => console.log('  -', k));
    }

    if (extraKeys.length) {
      console.log(`\n⚠️ Extra keys in ${path.basename(langPath)}:`);
      extraKeys.forEach(k => console.log('  +', k));
    }

    if (emptyKeys.length) {
      console.log(`\n🚫 Empty values in ${path.basename(langPath)}:`);
      emptyKeys.forEach(k => console.log('  ·', k));
    }

    if (!missingKeys.length && !extraKeys.length && !emptyKeys.length) {
      console.log('\n✅ All keys present and translated.');
    }
  } else {
    if (!missingKeys.length && !emptyKeys.length) {
      console.log('✅ OK');
    } else {
      console.log('❌ Incomplete or invalid language file.');
      process.exit(1);
    }
  }
}

// -------- RUN --------
const args = parseArgs();
const langFile = `${args.lang}.json`;
const templateFile = 'template.json';

validate(templateFile, langFile, args.verbose);
