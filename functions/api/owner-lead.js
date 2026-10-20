import { BOARD_ID, clean, fieldsFrom, fieldKey, normalizeLead, prepareCard, aptly } from '../_lib/owner-leads.js';
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply = (message,status=200) => Response.json({message},{status,headers});
const failure = 'We could not send your request right now. Please try again or call 254.742.7733.';
export async function onRequestPost({request,env}) {
  if (!request.headers.get('content-type')?.includes('application/json')) return reply('Please review the form and try again.',415);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply('Please submit this form from our website.',403);
  let body;
  try {
    if (Number(request.headers.get('content-length')) > 24000) return reply('The request is too large.',413);
    const raw = await request.text();
    if (raw.length > 24000) return reply('The request is too large.',413);
    body = JSON.parse(raw);
  } catch { return reply('Please review the form and try again.',400); }
  if (clean(body?.website)) return reply('Thank you. Your request has been received.');
  let lead;
  try { lead = normalizeLead(body,request); } catch(error) { return reply(error.message,400); }
  const token = env.APTLY_TOKEN || env.APTLY_API_TOKEN;
  if (!token) { console.error('Owner lead configuration: APTLY_TOKEN is missing.'); return reply(failure,503); }
  try {
    const base = `/api/board/${BOARD_ID}`;
    const [schema,configuration] = await Promise.all([aptly(`/api/schema/${BOARD_ID}`,token),aptly(base+'/configuration',token)]);
    const {card,contactField} = prepareCard(fieldsFrom(schema,configuration),lead);
    const contactResult = await aptly('/api/contacts',token,{method:'POST',body:JSON.stringify({firstname:lead.firstName,lastname:lead.lastName,email:lead.email,phone:[{number:lead.phone,type:'mobile'}],contactType:'Owner'})});
    const contact = contactResult.data ?? contactResult;
    const id = contact?._id;
    if (!id) throw new Error('Aptly returned no contact ID.');
    card[fieldKey(contactField)] = contactField.type === 'persons' ? [{_id:id}] : {_id:id};
    const created = await aptly(base,token,{method:'POST',body:JSON.stringify(card)});
    if (!(created.data ?? created)?._id) throw new Error('Aptly returned no card ID.');
    return reply('Thank you. Your request has been sent to Spradley Properties.');
  } catch(error) {
    console.error('Owner lead integration:',error.message);
    return reply(failure,502);
  }
}
