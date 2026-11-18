import test from 'node:test';
import assert from 'node:assert/strict';
import {groupCalendarTypes} from './calendar.js';

test('one marker per type remains highlighted until every task is done',()=>{
 const tasks=[{id:1,type_id:10,category:'Trabalho',category_icon:'FaLaptop',done:true},{id:2,type_id:10,category:'Trabalho',category_icon:'FaLaptop',done:false}];
 const groups=groupCalendarTypes(tasks);
 assert.equal(groups.length,1);
 assert.equal(groups[0].tasks.length,2);
 assert.equal(groups[0].done,false);
 assert.equal(groupCalendarTypes(tasks.map(task=>({...task,done:true})))[0].done,true);
 assert.equal(groupCalendarTypes(tasks.map(task=>({...task,done:false})))[0].done,false);
});
test('different types keep separate markers even with identical icons and colors',()=>{
 const groups=groupCalendarTypes([{type_id:1,category:'Trabalho',category_icon:'FaLaptop',category_color:'#123456',done:true},{type_id:2,category:'Estudos',category_icon:'FaLaptop',category_color:'#123456',done:false}]);
 assert.equal(groups.length,2);assert.equal(groups.find(group=>group.id===1).done,true);assert.equal(groups.find(group=>group.id===2).done,false);
 assert.deepEqual(groupCalendarTypes([]),[]);
});

test('pending types come first, with larger backlogs first and completed types last',()=>{
 const tasks=[
  {type_id:1,category:'Concluído',done:true},
  {type_id:2,category:'Estudos',done:false},
  {type_id:3,category:'Trabalho',done:false},
  {type_id:3,category:'Trabalho',done:false},
  {type_id:2,category:'Estudos',done:true},
 ];
 assert.deepEqual(groupCalendarTypes(tasks).map(group=>[group.id,group.pending]),[[3,2],[2,1],[1,0]]);
 const completed=tasks.map(task=>task.type_id===3?{...task,done:true}:task);
 assert.deepEqual(groupCalendarTypes(completed).map(group=>group.id),[2,1,3]);
 assert.deepEqual(groupCalendarTypes([{type_id:4,category:'Z',done:false},{type_id:5,category:'A',done:false}]).map(group=>group.id),[5,4]);
 assert.equal(tasks[2].done,false);
});
