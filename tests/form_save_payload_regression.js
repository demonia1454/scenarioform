"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const values = {
  '#div_scenarioformEdition': {'request-id': 17},
  '#edit_form_name': {value: 'Absence'},
  '#edit_form_description': {value: 'Description'},
  '#edit_form_history_title_field': {value: '8'}
};
const context = vm.createContext({
  $: selector => ({data: key => values[selector][key], val: () => values[selector].value}),
  collectFormScenarioIds: () => [{id: 4, expect_result: 1}]
});
vm.runInContext(fs.readFileSync(__dirname + '/../desktop/js/scenarioform_forms.js', 'utf8'), context);
context.collectFormScenarioIds = () => [{id: 4, expect_result: 1}];
for (const [id, action] of [[0, 'createForm'], [12, 'saveForm']]) {
  const payload = JSON.parse(JSON.stringify(context.scenarioformCollectFormSaveData(id, action)));
  assert.deepEqual(payload, {action, id, request_id: 17, name: 'Absence', description: 'Description', history_title_field_id: '8', scenarios: [{id: 4, expect_result: 1}]});
}
values['#edit_form_history_title_field'].value = '';
assert.equal(context.scenarioformCollectFormSaveData(12, 'saveForm').history_title_field_id, 0);
console.log('Configuration formulaire: création, modification et titre historique OK');
