// Board field keys are discovered from this customer's schema, never accepted from the browser.
export const BOARD_ID = 'mEmpbDg7nY7Z7FfJn';
export const clean = (value, max = 180) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
const norm = value => clean(String(value ?? '')).toLowerCase().replace(/[^a-z0-9]/g, '');
export const fieldKey = field => String(field.key ?? field.uuid ?? field.id ?? '');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unwrap = value => value?.data ?? value;

export function fieldsFrom(schema, configuration) {
  const config = unwrap(configuration) || {};
  const merged = new Map();
  // Configuration supplies option data; schema supplies public API keys/labels.
  for (const field of [...(config.fields || []), ...(unwrap(schema) || [])]) {
    const key = fieldKey(field);
    if (key) merged.set(key, {...merged.get(key), ...field});
  }
  return [...merged.values()].filter(f => !f.archived);
}
export function findField(fields, labels, types) {
  for (const label of labels) {
    const matches = fields.filter(f => [f.key, f.label, f.name].some(n => norm(n) === norm(label)) && (!types || types.includes(f.type)));
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) throw new Error('Ambiguous board field: ' + label);
  }
}
export function selectValue(field, value) {
  const type = norm(field.type);
  if (!type.includes('select')) return value;
  const options = [field.data, field.options, field.values, field.choices].find(Array.isArray) || [];
  const match = options.find(o => !o?.archived && (typeof o === 'string' ? norm(o) === norm(value) : [o.label,o.name,o.title,o.value].some(v => norm(v) === norm(value))));
  if (!match) return undefined;
  // The card API accepts configured option labels, including their exact casing.
  const label = typeof match === 'string' ? match : match.label ?? match.name ?? match.title ?? match.value;
  return type === 'multiselect' ? [label] : label;
}
function numeric(value, max) {
  if (value === '' || value == null) return undefined;
  if (!['number','string'].includes(typeof value)) throw new Error('Invalid property details.');
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) throw new Error('Please check the property details.');
  return number;
}
export function normalizeLead(body, request) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Please review the form.');
  const firstName = clean(body.firstName,70), lastName = clean(body.lastName,70);
  const email = clean(body.email,180).toLowerCase(), phone = clean(body.phone,40);
  if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+?[\d\s().-]{7,40}$/.test(phone) || phone.replace(/\D/g,'').length < 7 || body.termsAccepted !== true) {
    throw new Error('Please enter your name, email, phone, and accept the terms.');
  }
  let pageUrl;
  try {
    const url = new URL(body.pageUrl || request.headers.get('referer') || request.url);
    if (url.origin !== new URL(request.url).origin) throw new Error();
    // Query strings can contain contact information. The source pathname is sufficient.
    pageUrl = url.origin + url.pathname;
  } catch { throw new Error('Please reload this page and try again.'); }
  const calculator = body.includeCalculator === true && body.calculator && typeof body.calculator === 'object' ? body.calculator : null;
  function entries(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0,40).filter(e => e && typeof e === 'object').map(e => ({label:clean(e.label,100),value:clean(String(e.value ?? ''),200)})).filter(e => e.label && e.value);
  }
  return {
    firstName,lastName,email,phone,pageUrl,
    address:clean(body.address,280), comments:clean(body.comments,3000), goal:clean(body.goal,120),
    propertyStatus:clean(body.propertyStatus,100), propertyType:clean(body.propertyType,80), bedrooms:numeric(body.bedrooms,100), bathrooms:numeric(body.bathrooms,100),
    squareFeet:numeric(body.squareFeet,10000000), monthlyRent:numeric(body.monthlyRent,10000000),
    formSource:clean(body.formSource,180) || 'Website inquiry',pageTitle:clean(body.pageTitle,200),
    smsConsent:body.smsConsent === true, termsAccepted:true,
    calculator:calculator ? {name:clean(calculator.name,160),inputs:entries(calculator.inputs),results:entries(calculator.results)} : null
  };
}
export function prepareCard(fields, lead) {
  const contact = findField(fields,['Owners','Owner','Owner Contact','Contact','Contacts'],['person','persons']);
  const address = findField(fields,['Rental Property Address','Property Address']);
  const description = findField(fields,['Description','Lead Description','Card Description','Inquiry Details','Notes']);
  const stage = findField(fields,['Stage','Lead Stage','Status']) || fields.find(f => f.type === 'stageselect');
  if (!contact || !address || !description || !stage) throw new Error('Owner Leads requires contact, rental property address, description, and stage fields.');
  const newStage = selectValue(stage,'New Leads');
  if (newStage === undefined) throw new Error('Owner Leads is missing the New Leads option.');
  const card = {name:`${lead.firstName} ${lead.lastName} – ${lead.address || lead.formSource}`.slice(0,250),[fieldKey(stage)]:newStage};
  const notes = ['WEBSITE INQUIRY','',`Form: ${lead.formSource}`,`Page: ${lead.pageTitle}`,`URL: ${lead.pageUrl}`,'',
    `Name: ${lead.firstName} ${lead.lastName}`,`Email: ${lead.email}`,`Phone: ${lead.phone}`,
    `Terms accepted: Yes`, `SMS consent: ${lead.smsConsent ? 'Yes' : 'No'}`, `Submitted: ${new Date().toISOString()}`,'',
    `Rental property address: ${lead.address || 'Not provided'}`, `Service: ${lead.goal || 'Not provided'}`,
    `Property status: ${lead.propertyStatus || 'Not provided'}`, `Property type: ${lead.propertyType || 'Not provided'}`,`Beds: ${lead.bedrooms ?? 'Not provided'}`,`Baths: ${lead.bathrooms ?? 'Not provided'}`,
    `Square feet: ${lead.squareFeet ?? 'Not provided'}`,`Monthly rent: ${lead.monthlyRent ?? 'Not provided'}`,'',`Message: ${lead.comments || 'No additional message'}`];
  if (lead.calculator) notes.push('',`CALCULATOR: ${lead.calculator.name}`,'Estimates supplied by visitor; scenario assumptions, not a quote.','INPUTS',...lead.calculator.inputs.map(e=>`${e.label}: ${e.value}`),'RESULTS',...lead.calculator.results.map(e=>`${e.label}: ${e.value}`));
  const text = notes.join('\n');
  card[fieldKey(description)] = description.type === 'rich-text' ? '<p>'+escape(text).replace(/\n/g,'<br>')+'</p>' : text;
  if (lead.address) card[fieldKey(address)] = address.type === 'address' ? {address:lead.address,street:lead.address,formattedAddress:lead.address} : lead.address;
  const mappings = [
    [['Desired Management Service','Services','Service','Owner Goal','Goal','Desired Service','Service Requested'],lead.goal],
    [['Property Status'],lead.propertyStatus], [['Property Type'],lead.propertyType], [['Bed Count','Bedrooms','Beds','Number of Bedrooms'],lead.bedrooms],
    [['Bath Count','Bathrooms','Baths','Number of Bathrooms'],lead.bathrooms], [['Square Feet','Square Footage','Sq Ft'],lead.squareFeet],
    [['Monthly Rent','Expected Monthly Rent','Market Rent','Rent'],lead.monthlyRent],
    [['Email'],lead.email],[['Phone','Mobile Phone'],lead.phone],[['Source','Lead Source'],'Website'],
    [['Source Page','Page URL','Website Page'],lead.pageUrl],[['Form Source'],lead.formSource],
    [['Comments','Message'],lead.comments],[['SMS Consent'],lead.smsConsent]
  ];
  for (const [labels,value] of mappings) {
    if (value === undefined || value === '') continue;
    const field = findField(fields,labels);
    if (!field || card[fieldKey(field)] !== undefined) continue;
    let mapped = selectValue(field,value);
    if (mapped === undefined) {
      if (field.optional === false) throw new Error('Missing required board option: '+labels[0]);
      continue; // All unmatched details remain in Description.
    }
    if (['number','money','percent'].includes(field.type)) {
      mapped = Number(value);
      if (!Number.isFinite(mapped)) continue;
    } else if (field.type === 'emails') mapped = [value];
    else if (field.type === 'phones') mapped = [{number:value,type:'mobile'}];
    else if (['text','string'].includes(field.type)) mapped = String(value);
    card[fieldKey(field)] = mapped;
  }
  for (const field of fields) {
    if (field.optional === false && field.type.includes('select') && card[fieldKey(field)] === undefined) throw new Error('Required board field has no mapping: '+(field.label || field.name));
  }
  return {card, contactField:contact};
}
export async function aptly(path,token,init={}) {
  const response = await fetch('https://core-api.getaptly.com'+path,{
    ...init,headers:{Accept:'application/json','Content-Type':'application/json','x-token':token},signal:AbortSignal.timeout(15000)
  });
  const data = await response.json().catch(()=>null);
  if (!response.ok || data?.error) throw new Error(`Aptly ${path} failed (${response.status}; ${clean(data?.error?.code || '',80)})`);
  return data;
}

// These option labels are public form choices; no IDs, contacts, or credentials leave the server.
export function publicChoices(fields) {
  function choices(labels) {
    const field = findField(fields,labels);
    if (!field) return [];
    const values = [field.data,field.options,field.values,field.choices].find(Array.isArray) || [];
    return values.filter(v => !v?.archived).map(v=>typeof v==='string'?v:v.label ?? v.name ?? v.title ?? v.value).filter(v=>typeof v==='string').slice(0,100);
  }
  return {services:choices(['Desired Management Service','Services','Service','Owner Goal','Goal','Desired Service','Service Requested']),propertyTypes:choices(['Property Type']),propertyStatuses:choices(['Property Status'])};
}
export async function loadFields(token) {
  const [schema,configuration] = await Promise.all([aptly(`/api/schema/${BOARD_ID}`,token),aptly(`/api/board/${BOARD_ID}/configuration`,token)]);
  return fieldsFrom(schema,configuration);
}
