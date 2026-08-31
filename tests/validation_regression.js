'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
    path.join(__dirname, '..', 'desktop', 'js', 'scenarioform.js'),
    'utf8'
);

function extractFunction(name) {
    const start = source.indexOf('function ' + name + '(');
    assert.notStrictEqual(start, -1, 'Fonction introuvable : ' + name);
    const brace = source.indexOf('{', start);
    let depth = 0;
    for (let index = brace; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}') depth -= 1;
        if (depth === 0) return source.slice(start, index + 1);
    }
    throw new Error('Fonction incomplète : ' + name);
}

const referencedFields = {};
const context = {
    $: selector => referencedFields[selector]
};
vm.createContext(context);
vm.runInContext(
    extractFunction('scenarioformBuildPlaceholder') + '\n' +
    extractFunction('scenarioformValidateInput'),
    context
);

function fakeField(options) {
    const data = options.data || {};
    const attrs = options.attrs || {};
    return {
        length: 1,
        0: {checkValidity: () => options.valid !== false, validity: options.validity || {}},
        data: key => data[key],
        attr: key => attrs[key],
        val: () => options.value,
        prop: key => key === 'required' ? !!options.required : !!options.checked
    };
}

function numeric(value) {
    return fakeField({
        value: String(value),
        data: {'field-label': 'Quantité', 'field-type': 'integer', min: 5, max: 150},
        attrs: {name: 'quantity', type: 'text'}
    });
}

assert.strictEqual(context.scenarioformValidateInput(numeric(5)), null);
assert.strictEqual(context.scenarioformValidateInput(numeric(150)), null);
assert.match(context.scenarioformValidateInput(numeric(151)).message, /inférieure ou égale à 150/);
assert.match(context.scenarioformValidateInput(numeric(1000)).message, /inférieure ou égale à 150/);

const required = fakeField({
    value: '', required: true,
    data: {'field-label': 'Nom', 'field-type': 'text'},
    attrs: {name: 'name', type: 'text'}
});
const optional = fakeField({
    value: '', required: false,
    data: {'field-label': 'Note', 'field-type': 'text'},
    attrs: {name: 'note', type: 'text'}
});
assert.deepStrictEqual(
    JSON.parse(JSON.stringify(context.scenarioformValidateInput(required))),
    {label: 'Nom', message: 'Ce champ est obligatoire.'}
);
assert.strictEqual(context.scenarioformValidateInput(optional), null);

referencedFields['#scenarioform-field-10'] = fakeField({
    value: '2026-08-21',
    data: {'field-label': 'Date de début', 'field-type': 'date'},
    attrs: {name: 'start_date', type: 'date'}
});
const validEndDate = fakeField({
    value: '2026-08-22',
    data: {
        'field-label': 'Date de fin',
        'field-type': 'date',
        'compare-field-id': 10,
        'compare-operator': 'gte'
    },
    attrs: {name: 'end_date', type: 'date'}
});
const invalidEndDate = fakeField({
    value: '2026-08-20',
    data: {
        'field-label': 'Date de fin',
        'field-type': 'date',
        'compare-field-id': 10,
        'compare-operator': 'gte'
    },
    attrs: {name: 'end_date', type: 'date'}
});
assert.strictEqual(context.scenarioformValidateInput(validEndDate), null);
const equalEndDate = fakeField({
    value: '2026-08-21',
    data: {
        'field-label': 'Date de fin',
        'field-type': 'date',
        'compare-field-id': 10,
        'compare-operator': 'gte'
    },
    attrs: {name: 'end_date', type: 'date'}
});
assert.strictEqual(context.scenarioformValidateInput(equalEndDate), null);
assert.match(
    context.scenarioformValidateInput(invalidEndDate).message,
    /Date de fin doit être postérieure ou égale à Date de début/
);

assert.strictEqual(
    context.scenarioformBuildPlaceholder({type: 'integer', configuration: {min: 5, max: 150}}),
    'Entier entre 5 et 150'
);
assert.strictEqual(
    context.scenarioformBuildPlaceholder({type: 'text', required: false, configuration: {}}),
    ''
);

const returnCalls = [];
const returnContext = {
    $: selector => ({
        attr: name => selector === '#div_scenarioform-form' && name === 'data-form-id'
            ? '42'
            : undefined
    }),
    loadRequestDetail: (requestId, formId) => returnCalls.push([requestId, formId])
};
vm.createContext(returnContext);
vm.runInContext(extractFunction('scenarioformReturnToRequestDetail'), returnContext);
returnContext.scenarioformReturnToRequestDetail(7);
assert.deepStrictEqual(returnCalls, [[7, 42]]);

returnContext.$ = () => ({attr: () => undefined});
returnContext.scenarioformReturnToRequestDetail(8);
assert.deepStrictEqual(returnCalls, [[7, 42], [8, undefined]]);

console.log('Régressions de validation ScenarioForm : OK');
