import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldsFrom,prepareCard,normalizeLead,selectValue,BOARD_ID} from '../functions/_lib/owner-leads.js';
import {onRequestPost} from '../functions/api/owner-lead.js';
const fields = [
 {key:'address',label:'Rental Property Address',type:'address'},
 {key:'owners',label:'Owner',type:'persons'},
 {key:'notes',label:'Notes',type:'rich-text'},
 {key:'stage',label:'Stage',type:'stageselect',data:[{label:'New Leads',uuid:'stage-id'},{label:'Engaged',uuid:'stage-2'}]},
 {key:'beds',label:'Bed Count',type:'number'}, {key:'baths',label:'Bath Count',type:'number'},
 {key:'sqft',label:'Sq Ft',type:'number'},{key:'rent',label:'Market Rent',type:'money'},
 {key:'source',label:'Source',type:'sourceselect',data:[{label:'Website',uuid:'source-id'}]},
 {key:'type',label:'Property Type',type:'singleselect',data:[{label:'Single Family Home'}]},
 {key:'services',label:'Desired Management Service',type:'multiselect',optional:false,data:[{label:'Leasing + Monthly Management Service'}]}
];
const body={firstName:'Test',lastName:'Owner',email:'test@example.com',phone:'2025550100',termsAccepted:true,address:'123 Test St, Temple, TX',goal:'Leasing + Monthly Management Service',propertyType:'Single Family Home',bedrooms:'3',bathrooms:'2.5',squareFeet:'1800',monthlyRent:'2300',formSource:'Rent vs. Sell Calculator',pageTitle:'Rent vs. Sell',pageUrl:'https://example.com/owners/calculators/rent-vs-sell/?email=private',comments:'Keep my message <script>alert(1)</script>',includeCalculator:true,calculator:{name:'Rent vs. Sell',inputs:[{label:'Current value',value:'325000'}],results:[{label:'Advantage',value:'$42,000'}]}};
const request=(b=body,headers={})=>new Request('https://example.com/api/owner-lead',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(b)});
test('merge schema and configuration without dropping option data',()=>{
 const merged=fieldsFrom([{key:'stage',label:'Stage',type:'stageselect'}],{data:{fields:[{uuid:'stage',data:[{label:'New Leads'}]}]}});
 assert.deepEqual(merged[0].data,[{label:'New Leads'}]);
});
test('map confirmed Qualification labels, option labels, address, source and calculator notes',()=>{
 const lead=normalizeLead(body,request());const {card}=prepareCard(fields,lead);
 assert.equal(card.stage,'New Leads');assert.equal(card.source,'Website');assert.deepEqual(card.services,['Leasing + Monthly Management Service']);
 assert.equal(card.beds,3);assert.equal(card.baths,2.5);assert.equal(card.sqft,1800);assert.equal(card.rent,2300);
 assert.equal(card.address.street,body.address);assert.match(card.notes,/Current value: 325000/);assert.match(card.notes,/Advantage: \$42,000/);
 assert.match(card.notes,/Keep my message &lt;script&gt;/);assert.doesNotMatch(card.notes,/<script>/);assert.doesNotMatch(card.notes,/email=private/);
});
test('calculator opt out removes all estimate details',()=>assert.equal(normalizeLead({...body,includeCalculator:false},request()).calculator,null));
test('unknown enum is omitted; missing required enum fails before contact creation',()=>{
 assert.equal(selectValue(fields[9],'Unknown'),undefined);
 assert.throws(()=>prepareCard(fields,normalizeLead({...body,goal:'Unknown'},request())),/required board option/);
});
test('missing New Leads stage fails rather than silently using a default',()=>assert.throws(()=>prepareCard(fields.map(f=>f.key==='stage'?{...f,data:[{label:'New Lead'}]}:f),normalizeLead(body,request())),/New Leads/));
test('does not confuse mailing address with rental address',()=>assert.throws(()=>prepareCard(fields.map(f=>f.key==='address'?{...f,label:'Mailing Address'}:f),normalizeLead(body,request())),/rental property/));
test('malformed values and non-finite property values rejected',async()=>{
 for(const patch of [null,[],{...body,email:'bad'},{...body,bathrooms:'NaN'},{...body,bedrooms:-1},{...body,pageUrl:'https://other.test/'},{...body,termsAccepted:false}]) assert.equal((await onRequestPost({request:request(patch),env:{}})).status,400);
});
test('honeypot returns generic success without any upstream calls',async()=>{
 const r=await onRequestPost({request:request({website:'spam'}),env:{}});assert.equal(r.status,200);
});
test('reject cross-origin posts and missing token',async()=>{
 assert.equal((await onRequestPost({request:request(body,{Origin:'https://other.test'}),env:{}})).status,403);
 assert.equal((await onRequestPost({request:request(),env:{}})).status,503);
});
test('creates a contact object link and posts to the correct board using APTLY_TOKEN',async()=>{
 const original=globalThis.fetch,calls=[];
 globalThis.fetch=async(url,init)=>{calls.push({url,init});return Response.json(url.includes('/schema/')?fields:url.endsWith('/configuration')?{data:{fields}}:url.endsWith('/contacts')?{_id:'contact-id'}:{data:{_id:'card-id'}});};
 try {
  assert.equal((await onRequestPost({request:request(),env:{APTLY_TOKEN:'fake-test-secret'}})).status,200);
  const sent=calls.find(c=>c.url.endsWith('/api/board/'+BOARD_ID));assert.ok(sent);const card=JSON.parse(sent.init.body);
  assert.deepEqual(card.owners,[{_id:'contact-id'}]);assert.equal(card.stage,'New Leads');assert.equal(sent.init.headers['x-token'],'fake-test-secret');
 } finally {globalThis.fetch=original;}
});
test('upstream failure never reports success',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({error:{code:'FORBIDDEN'}},{status:403});
 try {assert.equal((await onRequestPost({request:request(),env:{APTLY_TOKEN:'fake'}})).status,502);} finally {globalThis.fetch=original;}
});
