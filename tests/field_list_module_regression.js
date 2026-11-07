'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const main=fs.readFileSync(path.join(__dirname,'../desktop/js/scenarioform.js'),'utf8');
const fields=fs.readFileSync(path.join(__dirname,'../desktop/js/scenarioform_fields.js'),'utf8');
assert(!/function (renderFields|loadFieldList)\s*\(/.test(main));
assert(/function renderFields\s*\(/.test(fields));
assert(/function loadFieldList\s*\(/.test(fields));
let request, rendered, bound=0, refreshed, alert;
const ctx=vm.createContext({
 $:selector=>({html:html=>{assert.strictEqual(selector,'#scenarioform-fields-list');rendered=html;},val:()=> '23'}),
 scenarioformBuildFieldsTable:items=>'table:'+items.length,
 scenarioformBindFieldsTableEvents:()=>{bound++},
 scenarioformRefreshTemplateButton:count=>{refreshed=count},
 jeedomUtils:{showAlert:msg=>{alert=msg}},
});
ctx.$.ajax=opts=>{request=opts};
vm.runInContext(fields,ctx);
ctx.scenarioformBuildFieldsTable=items=>'table:'+items.length;
ctx.scenarioformBindFieldsTableEvents=()=>{bound++};
vm.runInContext('loadFieldList(8)',ctx);
assert.strictEqual(request.type,'POST');
assert.strictEqual(request.data.action,'getFieldList');
assert.strictEqual(request.data.form_id,8);
assert.strictEqual(request.data.scenario_id,23);
request.success({state:'ok',result:[{id:1},{id:2}]});
assert.strictEqual(rendered,'table:2');assert.strictEqual(bound,1);assert.strictEqual(refreshed,2);
request.success({state:'ok',result:null});
assert.strictEqual(rendered,'table:0');assert.strictEqual(refreshed,0);
request.success({state:'error',result:'Erreur'});
assert.strictEqual(alert.message,'Erreur');assert.strictEqual(alert.level,'danger');
assert.strictEqual(bound,2);
vm.runInContext('loadFieldList(8, 42)',ctx);
assert.strictEqual(request.data.scenario_id,42);
console.log('Chargement de la liste des champs : OK');
