'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const alerts = [];
const context = {
    jeedomUtils: { showAlert: function(alert) { alerts.push(alert); } },
    $: function() { throw new Error('Unexpected jQuery call'); }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('desktop/js/scenarioform_helpers.js', 'utf8'), context);
const callback = context.scenarioformAjaxAlertError('Erreur réseau test');
assert.strictEqual(typeof callback, 'function');
callback({status: 500}, 'error', 'Failure');
assert.strictEqual(alerts.length, 1);
assert.strictEqual(alerts[0].message, 'Erreur réseau test');
assert.strictEqual(alerts[0].level, 'danger');
console.log('AJAX error helper: OK');
