import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPostgresStore} from '../postgres-store.js';
function fakeDatabase(){let row={version:0,payload:{}};return async(sql,values)=>{if(sql.startsWith('SELECT'))return {rows:[structuredClone(row)]};if(sql.startsWith('UPDATE')){await new Promise(r=>setTimeout(r,2));if(values[1]!==row.version)return {rows:[]};row={version:row.version+1,payload:JSON.parse(values[0])};return {rows:[{version:row.version}]};}return {rows:[]};};}
test('database saves serialize, flush and restore the newest account snapshot',async()=>{const query=fakeDatabase(),store=await createPostgresStore(query);store.save({a:{name:'One'}});store.save({a:{name:'Two'}});await store.flush();assert.deepEqual((await createPostgresStore(query)).accounts,{a:{name:'Two'}});});
test('a stale server cannot overwrite newer persistent accounts',async()=>{const query=fakeDatabase(),a=await createPostgresStore(query),b=await createPostgresStore(query);a.save({a:{name:'Safe'}});await a.flush();b.save({});await assert.rejects(b.flush(),/another server/);assert.deepEqual((await createPostgresStore(query)).accounts,{a:{name:'Safe'}});});
