"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../desktop/js/scenarioform_forms.js', 'utf8');
let currentValue = '3';
let confirmedValue = '3';
let expectResult = true;
const context = vm.createContext({
  scenarioformEscapeHtml: value => String(value).replace(/</g,'&lt;'),
  $: selector => ({val: () => currentValue, attr: () => confirmedValue, prop: () => expectResult})
});
vm.runInContext(source, context);
const html = context.renderFormScenarioEditor(
  [{id:3,name:'Zeta'},{id:2,name:'Beta'},{id:1,name:'Alpha'}],
  [{id:3,name:'Zeta',expect_result:1}]
);
assert.ok(html.includes('id="scenarioform-main-scenario"'));
assert.ok(html.includes('id="bt_confirmFormScenario"')); 
assert.ok(html.includes('Scénario associé</label>'));
assert.ok(!html.includes('Scénario principal</label>'));
assert.ok(html.includes('value="3" selected'));
assert.ok(html.indexOf('Alpha') < html.indexOf('Beta'));
assert.ok(html.indexOf('Beta') < html.indexOf('Zeta'));
assert.ok(html.includes('Attendre un retour métier'));
assert.ok(!html.includes('form-scenario-enabled'));
assert.equal(JSON.stringify(context.collectFormScenarioIds()), JSON.stringify([{id:3,expect_result:1}]));
currentValue = '';
assert.equal(JSON.stringify(context.collectFormScenarioIds()), JSON.stringify([{id:3,expect_result:1}]));
confirmedValue = '';
assert.equal(JSON.stringify(context.collectFormScenarioIds()), '[]');
const legacy = context.renderFormScenarioEditor([{id:3,name:'Zeta'},{id:2,name:'Beta'}], [{id:3},{id:2}]);
assert.ok(legacy.includes('possède plusieurs scénarios'));
assert.ok(!legacy.includes('value="3" selected'));
console.log('Tests module formulaires ScenarioForm E13 OK');
