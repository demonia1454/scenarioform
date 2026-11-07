'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const php = fs.readFileSync(path.join(root, 'desktop/php/scenarioform.php'), 'utf8');
const expected = ['scenarioform_helpers', 'scenarioform_forms', 'scenarioform_fields', 'scenarioform'];
const loaded = [...php.matchAll(/include_file\('desktop',\s*'([^']+)',\s*'js',\s*'scenarioform'\)/g)].map(m=>m[1]);
assert.deepEqual(loaded, expected, 'Les modules JavaScript doivent être chargés dans leur ordre de dépendance');
for (const moduleName of expected) {
 const file = path.join(root, 'desktop/js', moduleName + '.js');
 assert.ok(fs.existsSync(file), 'Module absent : ' + moduleName);
}
const sources = Object.fromEntries(expected.map(name=>[name,fs.readFileSync(path.join(root,'desktop/js',name+'.js'),'utf8')]));
for (const [name,owner] of Object.entries({scenarioformEscapeHtml:'scenarioform_helpers',scenarioformBuildPlaceholder:'scenarioform_helpers',scenarioformAjax:'scenarioform_helpers',scenarioformCollectFormSaveData:'scenarioform_forms',scenarioformBuildFieldsTable:'scenarioform_fields',scenarioformBindFieldsTableEvents:'scenarioform_fields'})) {
 const re = new RegExp('\\bfunction\\s+' + name + '\\s*\\(');
 assert.match(sources[owner], re, name + ' absent du module attendu');
 for (const other of expected.filter(n=>n!==owner)) assert.doesNotMatch(sources[other],re, name+' défini deux fois');
}
console.log('Chargement et propriété des modules JS : OK');
