const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const base=process.env.PREVIEW_URL || 'http://127.0.0.1:4181';
 const browser=await chromium.launch({headless:true,channel:"chrome"});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 let payloads=[],responseStatus=200;
 await page.route('**/api/owner-lead-options',r=>r.fulfill({json:{ready:true,services:['Leasing + Monthly Management Service','Monthly Management Service','In-Person Consult'],propertyTypes:['Single Family Home','Duplex'],propertyStatuses:['Vacant','Occupied by Owner','Occupied by Tenant']}}));
 await page.route('**/api/owner-lead',async r=>{payloads.push(r.request().postDataJSON());await new Promise(resolve=>setTimeout(resolve,100));await r.fulfill({status:responseStatus,json:{message:responseStatus===200?'Test request received.':'Test upstream unavailable.'}});});
 const paths=['contact','owners',...['temple','belton','salado','killeen','harker-heights','troy','little-river-academy','morgans-point-resort'].map(x=>'areas/'+x),...['rent-vs-sell','management-fee-roi','eviction-cost','rent-reduction'].map(x=>'owners/calculators/'+x)];
 for(const path of paths){
  await page.goto(base+'/'+path+'/');
  const form=page.locator('[data-lead-form]');await form.waitFor();
  await page.waitForFunction(()=>document.querySelector('[name="goal"]')?.options[1]?.value==='Leasing + Monthly Management Service');
  assert.equal(await form.count(),1,path+' form persists after hydration');
  assert.equal(await page.locator('iframe[src*="portal.getaptly.com/form"]').count(),0);
  if(path.includes('calculators')){
   await page.locator('.calculator-address input').fill('123 Test Street, Temple, TX');
   await page.getByRole('link',{name:'Discuss my property',exact:true}).click();
   assert.equal(await form.locator('[name="address"]').inputValue(),'123 Test Street, Temple, TX');
  } else await form.locator('[name="address"]').fill('123 Test Street, Temple, TX');
  await form.getByLabel('First name *',{exact:true}).fill('Website Test');await form.getByLabel('Last name *',{exact:true}).fill('Owner');
  await form.getByLabel('Email *',{exact:true}).fill('website-test@example.com');await form.getByLabel('Phone *',{exact:true}).fill('2025550100');
  await form.locator('[name="goal"]').selectOption('Leasing + Monthly Management Service');await form.locator('[name="propertyType"]').selectOption('Single Family Home');await form.locator('[name="propertyStatus"]').selectOption('Vacant');
  await form.getByLabel('Bedrooms',{exact:true}).fill('3');await form.getByLabel('Bathrooms',{exact:true}).fill('2.5');await form.getByLabel('Square feet',{exact:true}).fill('1800');
  await form.getByLabel('Message',{exact:true}).fill('Test inquiry context');await form.locator('[name="termsAccepted"]').check();
  const before=payloads.length;await form.getByRole('button',{name:'Send my request'}).click();await form.getByText('Test request received.').waitFor();
  assert.equal(payloads.length,before+1);const data=payloads.at(-1);
  assert.equal(data.pageUrl,base+'/'+path+'/');assert.equal(data.address,'123 Test Street, Temple, TX');assert.equal(data.bedrooms,'3');assert.equal(data.bathrooms,'2.5');assert.equal(data.comments,'Test inquiry context');
  if(path.includes('calculators')){assert.ok(data.calculator.inputs.length);assert.ok(data.calculator.results.length);assert.equal(data.includeCalculator,true);}
  console.log('PASS',path,data.calculator?data.calculator.inputs.length+' inputs / '+data.calculator.results.length+' results':'native inquiry');
 }
 // An invalid estimate cannot be sent as valid, while opting out permits the inquiry.
 await page.locator('.calculator-inputs input[type="number"]').nth(1).fill('9999');
 const form=page.locator('[data-lead-form]');
 await form.locator('[name="firstName"]').fill('Test');await form.locator('[name="lastName"]').fill('Owner');await form.locator('[name="email"]').fill('test@example.com');await form.locator('[name="phone"]').fill('2025550100');await form.locator('[name="goal"]').selectOption('In-Person Consult');await form.locator('[name="propertyStatus"]').selectOption('Vacant');await form.locator('[name="termsAccepted"]').check();
 const count=payloads.length;await form.getByRole('button',{name:'Send my request'}).click();await form.getByText('Please correct the calculator inputs before including the estimate.').waitFor();assert.equal(payloads.length,count);
 await form.locator('[name="includeCalculator"]').uncheck();responseStatus=502;await form.getByRole('button',{name:'Send my request'}).click();await form.getByText('Test upstream unavailable.').waitFor();assert.equal(payloads.at(-1).calculator,undefined);assert.equal(await form.locator('[name="firstName"]').inputValue(),'Test');
 console.log('PASS invalid estimate, opt-out, upstream error, retained input');
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/contact/');await page.locator('[data-lead-form]').waitFor();
 const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(size.scroll<=size.width,'mobile overflow');
 await page.locator('[name="firstName"]').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/spradley-native-form-mobile.png'});console.log('PASS mobile width',size);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
