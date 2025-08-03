// generate-template.js
const fs = require('fs');
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf8'));

function emptyValues(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) =>
    [k, typeof v === 'object' && v !== null ? emptyValues(v) : ""]
  ));
}

const template = emptyValues(en);
fs.writeFileSync('locales/template.json', JSON.stringify(template, null, 2));
console.log('Template generated: locales/template.json');
