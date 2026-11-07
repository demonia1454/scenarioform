"use strict";
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../desktop/js/scenarioform_fields.js'),'utf8');
const callbacks={}; const offCounts={};
const nodes={
 '#bt_saveField':{'data-id':'17','data-form':'8'},
 '#bt_cancelField':{}
};
let saved=null, returned=null;
function $(selector){
 if(typeof selector==='object')return {attr:key=>selector[key]};
 return {
  off(event){assert.strictEqual(event,'click'); offCounts[selector]=(offCounts[selector]||0)+1; delete callbacks[selector]; return this;},
  on(event,cb){assert.strictEqual(event,'click'); callbacks[selector]=cb; return this;}
 };
}
const context=vm.createContext({$,saveField:(...args)=>saved=args,loadFieldList:id=>returned=id});
vm.runInContext(source,context);
context.loadFieldList = id => returned=id;
vm.runInContext('scenarioformBindFieldEditorEvents(8)',context);
vm.runInContext('scenarioformBindFieldEditorEvents(8)',context);
assert.deepStrictEqual(Object.keys(callbacks).sort(),['#bt_cancelField','#bt_saveField']);
assert.strictEqual(offCounts['#bt_saveField'],2);
assert.strictEqual(offCounts['#bt_cancelField'],2);
callbacks['#bt_saveField'].call(nodes['#bt_saveField']);
assert.deepStrictEqual(saved,['17','8']);
callbacks['#bt_cancelField'].call(nodes['#bt_cancelField']);
assert.strictEqual(returned,8);
const main=fs.readFileSync(path.join(__dirname,'../desktop/js/scenarioform.js'),'utf8');
assert(main.includes('scenarioformBindFieldEditorEvents(formId);'));
assert(!main.includes("$('#bt_saveField')"));
console.log('Événements éditeur de champs : OK');
