// Ported from app/api/owner-lead/route.ts — logic unchanged, only entry point (onRequestPost
// instead of POST()) and env access (env.X instead of process.env.X) adapted.
const APTLY_BASE = 'https://core-api.getaptly.com';
const DEFAULT_BOARD = 'BrPMxyeZazZuMvyFS';

const clean = (value, max = 180) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const normalize = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const fieldKey = field => clean(field.key || field.uuid || field.id, 120);
const fieldName = field => normalize(field.label || field.name || field.title);

export function findField(fields, names, types) {
  const wanted = names.map(normalize);
  const allowed = types?.map(normalize);
  const candidates = fields.filter(field => !field.archived && fieldKey(field) && (!allowed || allowed.includes(normalize(field.type))));
  return candidates.find(field => wanted.includes(fieldName(field))) || candidates.find(field => wanted.some(name => fieldName(field).includes(name)));
}

function safeUrl(value) {
  const candidate = clean(value, 500);
  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.href.slice(0, 500) : '';
  } catch {
    return '';
  }
}

export function selectValue(field, label) {
  const type = normalize(field.type);
  if (!type.includes('select') && !type.includes('option')) return label;
  const options = [field.options, field.values, field.choices].find(Array.isArray);
  const match = options?.find(option => [option.label, option.name, option.title, option.value].some(value => normalize(value) === normalize(label)));
  return match ? match.uuid || match.id || match.key || match.value || match.label : undefined;
}

async function aptly(path, token, init = {}) {
  const response = await fetch(`${APTLY_BASE}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-token': token, ...init.headers },
    signal: AbortSignal.timeout(15000),
    cache: 'no-store'
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Aptly ${path} returned ${response.status}`);
  return data;
}

export async function onRequestPost({ request, env }) {
  const token = env.APTLY_API_TOKEN;
  const board = env.APTLY_OWNER_LEADS_BOARD_ID || DEFAULT_BOARD;
  if (!request.headers.get('content-type')?.includes('application/json'))
    return Response.json({ message: 'Please review the form and try again.' }, { status: 400 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: 'Please review the form and try again.' }, { status: 400 });
  }
  if (clean(body.website)) return Response.json({ message: 'Thank you. Your request has been received.' });

  const firstName = clean(body.firstName, 70);
  const lastName = clean(body.lastName, 70);
  const name = `${firstName} ${lastName}`.trim();
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 40);
  const address = clean(body.address, 280);
  const goal = clean(body.goal, 120);
  const comments = clean(body.comments, 1600);
  const smsConsent = body.smsConsent === true;
  const termsAccepted = body.termsAccepted === true;
  const formSource = clean(body.formSource, 180) || 'Contact Page – Property Management Consultation';
  const pageTitle = clean(body.pageTitle, 200) || 'Spradley Properties website';
  const pageUrl = safeUrl(body.pageUrl) || safeUrl(request.headers.get('referer')) || 'Not provided';
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !address ||
    !goal ||
    !comments ||
    !termsAccepted ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return Response.json({ message: 'Please complete all required fields and accept the terms.' }, { status: 400 });
  }
  if (!token) {
    console.error('Aptly owner lead integration is missing APTLY_API_TOKEN.');
    return Response.json({ message: 'We could not send your request right now. Please call 254.742.7733.' }, { status: 503 });
  }

  try {
    const [schemaResult, configurationResult] = await Promise.all([
      aptly(`/api/schema/${encodeURIComponent(board)}`, token),
      aptly(`/api/board/${encodeURIComponent(board)}/configuration`, token)
    ]);
    const schema = Array.isArray(schemaResult) ? schemaResult : schemaResult.data || [];
    const config = Array.isArray(configurationResult) ? {} : configurationResult.data || configurationResult;
    const configFields = Array.isArray(config.fields) ? config.fields : [];
    const fields = [...schema, ...configFields].filter(
      (field, index, all) => fieldKey(field) && index === all.findIndex(candidate => fieldKey(candidate) === fieldKey(field))
    );
    const addressField = findField(fields, ['Rental Property Address', 'Property Address']);
    const contactField =
      findField(fields, ['Owner', 'Owner Contact', 'Contact'], ['person', 'persons']) ||
      fields.find(field => ['person', 'persons'].includes(normalize(field.type)) && !field.archived);
    const descriptionField = findField(fields, ['Description', 'Lead Description', 'Card Description', 'Inquiry Details']);
    if (!addressField || !contactField || !descriptionField) throw new Error('Required Owner Leads board fields could not be mapped.');

    const contactResult = await aptly('/api/contacts', token, {
      method: 'POST',
      body: JSON.stringify({ firstname: firstName, lastname: lastName, email, phone: [{ number: phone, type: 'mobile' }], contactType: 'Owner' })
    });
    const contact = Array.isArray(contactResult) ? contactResult[0] : contactResult.data || contactResult;
    const contactId = contact?._id || contact?.uuid || contact?.id;
    if (!contactId) throw new Error('Aptly did not return a contact ID.');

    const description = [
      'Website Property Management Inquiry',
      '',
      'LEAD ORIGIN',
      `Form: ${formSource}`,
      `Page: ${pageTitle}`,
      `URL: ${pageUrl}`,
      '',
      'OWNER CONTACT',
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `SMS consent: ${smsConsent ? 'Yes' : 'No'}`,
      '',
      'PROPERTY',
      `Address: ${address}`,
      '',
      'REQUEST',
      `Service: ${goal}`,
      `Comments: ${comments}`
    ].join('\n');
    const card = { name: `${name} – ${address}` };
    card[fieldKey(addressField)] = normalize(addressField.type) === 'address' ? { address, street: address, formattedAddress: address } : address;
    card[fieldKey(contactField)] = normalize(contactField.type) === 'persons' ? [contactId] : contactId;
    card[fieldKey(descriptionField)] = description;

    const mappings = [
      [['Owner Goal', 'Goal', 'Desired Management Service', 'Desired Service', 'Service Requested'], goal],
      [['Message', 'Comments', 'Notes', 'Property Notes'], comments],
      [['Email'], email],
      [['Phone', 'Mobile Phone'], phone],
      [['Source', 'Lead Source'], 'Website'],
      [['Stage', 'Lead Stage', 'Status', 'Workflow'], 'New Lead']
    ];
    for (const [labels, value] of mappings) {
      const field = findField(fields, labels);
      if (!field || card[fieldKey(field)] !== undefined) continue;
      const mapped = selectValue(field, value);
      if (mapped !== undefined) card[fieldKey(field)] = mapped;
    }

    await aptly(`/api/board/${encodeURIComponent(board)}`, token, { method: 'POST', body: JSON.stringify(card) });
    return Response.json({ message: 'Thank you. Your request has been sent to Spradley Properties.' });
  } catch (error) {
    console.error('Unable to create Aptly owner lead:', error instanceof Error ? error.message : 'Unknown upstream error');
    return Response.json({ message: 'We could not send your request right now. Please call 254.742.7733.' }, { status: 502 });
  }
}
