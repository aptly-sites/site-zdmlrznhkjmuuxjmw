import {loadFields,publicChoices,prepareCard} from '../_lib/owner-leads.js';
export async function onRequestGet({env}) {
  const headers={'Cache-Control':'no-store'};
  const token=env.APTLY_TOKEN || env.APTLY_API_TOKEN;
  if (!token) return Response.json({ready:false},{status:503,headers});
  try {
    const fields=await loadFields(token);
    const choices=publicChoices(fields);
    // Verify routing and required field mapping without creating any contacts or cards.
    prepareCard(fields,{firstName:'Configuration',lastName:'Check',goal:choices.services[0] || '',propertyStatus:choices.propertyStatuses[0] || '',propertyType:choices.propertyTypes[0] || '',pageUrl:'',formSource:'',address:'',comments:''});
    return Response.json({ready:true,...choices},{headers});
  } catch(error) {
    console.error('Owner lead setup:',error.message);
    return Response.json({ready:false,setupIssue:error.message.startsWith('Aptly ') ? 'Board API unavailable. Check API access and token permissions.' : error.message},{status:503,headers});
  }
}
