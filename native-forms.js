(() => {
  const selector = 'form[data-lead-form]';
  function calculatorContext() {
    const inputs = document.querySelector('.calculator-inputs');
    if (!inputs) return null;
    if (document.querySelector('.calculator-errors') || !inputs.checkValidity()) throw new Error('Please correct the calculator inputs before including the estimate.');
    const fields = [...inputs.querySelectorAll('.calculator-field')].map(label => ({label:label.querySelector('span')?.textContent.trim() || '',value:label.querySelector('input')?.value || ''}));
    const results = [...document.querySelectorAll('.calculator-result-head, .calculator-summary-grid > div')].map(row => ({label:row.querySelector('p, span')?.textContent.trim() || '',value:[row.querySelector('strong')?.textContent,row.querySelector('.calculator-result-head > span')?.textContent].filter(Boolean).join(' — ')}));
    for (const row of document.querySelectorAll('.calculator-table-wrap tbody tr')) {
      const cells = [...row.querySelectorAll('th,td')].map(c=>c.textContent.trim());
      if (cells.length === 2) results.push({label:cells[0],value:cells[1]});
    }
    return {name:document.querySelector('h1')?.textContent.trim() || document.title,inputs:fields,results};
  }
  function syncCalculator(form) {
    const input = document.querySelector('.calculator-address input');
    if (input?.value && form.elements.address.value !== input.value) form.elements.address.value = input.value;
    const rent = [...document.querySelectorAll('.calculator-field')].find(el => /^(Expected monthly rent|Monthly rent per home|Monthly rent|Current asking rent)$/.test(el.querySelector('span')?.textContent.trim()));
    if (rent && !form.elements.monthlyRent.dataset.edited) form.elements.monthlyRent.value = rent.querySelector('input').value;
  }
  let choicesPromise;
  function loadChoices(form) {
    choicesPromise ||= fetch('/api/owner-lead-options').then(r=>r.ok?r.json():null).catch(()=>null);
    choicesPromise.then(config=>{
      if (!config?.ready) return;
      for (const [name,values] of [['goal',config.services],['propertyType',config.propertyTypes]]) {
        if (!values?.length) continue;
        const select=form.elements[name], previous=select.value;
        select.replaceChildren(new Option(name==='goal'?'Select a service':'Select if known',''),...values.map(v=>new Option(v,v)));
        if (values.includes(previous)) select.value=previous;
      }
    });
  }
  function initialize() {
    document.querySelectorAll('.calculator-next a').forEach(link=>{
      if (link.getAttribute('href') !== '#property-inquiry') link.setAttribute('href','#property-inquiry');
    });
    document.querySelectorAll(selector).forEach(form => {
      if (form.dataset.ready) return;
      form.dataset.ready = 'true';
      loadChoices(form);
      if (document.querySelector('.calculator-inputs')) syncCalculator(form);
      const property = new URLSearchParams(location.search).get('property');
      if (property && !form.elements.address.value) form.elements.address.value = property.slice(0,280);
    });
  }
  document.addEventListener('input',event => {
    const form = document.querySelector(selector);
    if (!form) return;
    if (event.target.matches('.calculator-address input')) form.elements.address.value = event.target.value;
    if (event.target.matches('.calculator-field input')) syncCalculator(form);
    if (event.target.matches('[name="monthlyRent"]')) event.target.dataset.edited = 'true';
    if (event.target.matches('[name="address"]') && document.querySelector('.calculator-address input')) {
      const input = document.querySelector('.calculator-address input');
      // Use the native setter so the existing calculator's React state receives the edit.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,event.target.value);
      input.dispatchEvent(new Event('input',{bubbles:true}));
    }
  });
  document.addEventListener('click',event => {
    const link = event.target.closest('.calculator-next a');
    if (!link) return;
    const form = document.querySelector(selector);
    if (!form) return;
    event.preventDefault();syncCalculator(form);
    form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    form.elements.firstName.focus({preventScroll:true});
  });
  document.addEventListener('submit',async event => {
    const form = event.target;
    if (!form.matches(selector)) return;
    event.preventDefault();
    if (form.dataset.sending === 'true' || !form.reportValidity()) return;
    const status = form.querySelector('[role="status"]'), button = form.querySelector('[type="submit"]');
    if (document.querySelector('.calculator-inputs')) syncCalculator(form);
    const data = Object.fromEntries(new FormData(form));
    Object.assign(data,{termsAccepted:form.elements.termsAccepted.checked,smsConsent:form.elements.smsConsent.checked,formSource:form.dataset.formSource,pageTitle:document.title,pageUrl:location.origin+location.pathname});
    try {
      if (form.elements.includeCalculator?.checked) {
        data.includeCalculator = true;data.calculator = calculatorContext();
        const rent = data.calculator?.inputs.find(row=>/^(Expected monthly rent|Monthly rent per home|Monthly rent|Current asking rent)$/.test(row.label));
        if (!data.monthlyRent && rent) data.monthlyRent = rent.value;
      }
      form.dataset.sending = 'true';button.disabled = true;button.textContent = 'Sending…';status.textContent = '';status.className = 'contact-form-status';
      const response = await fetch('/api/owner-lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const result = await response.json().catch(()=>null);
      if (!response.ok || !result?.message) throw new Error(result?.message || 'We could not send your request. Please try again or call 254.742.7733.');
      status.textContent = result.message;status.classList.add('success');form.reset();
    } catch(error) { status.textContent = error.message || 'Please try again or call 254.742.7733.';status.classList.add('error'); }
    finally { delete form.dataset.sending;button.disabled = false;button.textContent = 'Send my request'; }
  });
  initialize();
  // Existing snapshots hydrate some sections; initialize forms added by hydration too.
  new MutationObserver(initialize).observe(document.body,{childList:true,subtree:true});
})();
