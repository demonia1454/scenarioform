'use strict';
// Vérifications statiques : ne remplacent pas les tests d'intégration Jeedom.
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '../core/ajax/scenarioform.ajax.php'), 'utf8');
const adminBlock = source.match(/\$scenarioformAdminActions\s*=\s*\[([\s\S]*?)\];/);
assert(adminBlock, 'Liste des actions administrateur absente');
const adminActions = [...adminBlock[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
for (const action of ['saveRequest', 'removeRequest', 'saveForm', 'removeForm', 'saveField', 'removeField', 'purgePreviousFormReports']) {
  assert(adminActions.includes(action), `Action sensible sans garde admin : ${action}`);
}
assert(/in_array\(\$scenarioformAction,\s*\$scenarioformAdminActions,\s*true\)\s*&&\s*!isConnect\('admin'\)/.test(source), 'Contrôle serveur admin manquant');
for (const action of ['updateHistoryResponse', 'removeHistoryResponse', 'clearFormHistory']) {
  const start = source.indexOf(`case '${action}':`);
  const end = source.indexOf('\ncase ', start + 1);
  assert(start !== -1, `Action absente : ${action}`);
  const block = source.slice(start, end < 0 ? undefined : end);
  assert(block.includes('scenarioformCanReadResponseConfiguration'), `Contrôle propriétaire absent : ${action}`);
}
assert(source.includes('user::byId'), 'Rechargement des droits utilisateur absent');
console.log('Contrôles statiques de sécurité R122 : OK');
