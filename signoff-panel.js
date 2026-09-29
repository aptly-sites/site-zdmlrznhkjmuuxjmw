(function(){
if(document.getElementById('asoRoot'))return;
var style=document.createElement('style');style.textContent="\n  .aso{--aso-bg:#ffffff;--aso-ink:#14171a;--aso-muted:#6b7280;--aso-line:#e8eaed;--aso-soft:#f6f7f9;--aso-accent:#c62828;--aso-accent-ink:#ffffff;--aso-ok:#16a34a;--aso-warn:#d97706;--aso-w:440px;font-family:\"DM Sans\",system-ui,-apple-system,Segoe UI,sans-serif;color:var(--aso-ink);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}\n  .aso *{box-sizing:border-box}\n  .aso-tab{position:fixed;right:0;top:50%;transform:translateY(-50%) rotate(-90deg) translate(50%,-100%);transform-origin:100% 100%;z-index:99998;background:var(--aso-accent);color:var(--aso-accent-ink);border:0;border-radius:10px 10px 0 0;padding:10px 18px;font:600 13px/1 \"DM Sans\",system-ui,sans-serif;letter-spacing:.02em;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.12);display:flex;gap:10px;align-items:center}\n  .aso-tab span{background:rgba(255,255,255,.22);border-radius:999px;padding:3px 8px;font-size:11px}\n  .aso-tab[hidden]{display:none}\n  .aso-scrim{position:fixed;inset:0;background:rgba(20,23,26,.28);z-index:99998;opacity:0;pointer-events:none;transition:opacity .25s}\n  .aso-panel{position:fixed;top:0;right:0;height:100dvh;width:min(var(--aso-w),100vw);background:var(--aso-bg);z-index:99999;transform:translateX(100%);transition:transform .3s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,.08)}\n  .aso.is-open .aso-panel{transform:none}.aso.is-open .aso-scrim{opacity:1;pointer-events:auto}\n  .aso-head{padding:20px 22px 14px;border-bottom:1px solid var(--aso-line)}\n  .aso-eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--aso-accent)}\n  .aso-head h2{margin:4px 0 2px;font-size:20px;font-weight:700;letter-spacing:-.01em}\n  .aso-head p{margin:0;color:var(--aso-muted)}\n  .aso-close{position:absolute;top:14px;right:14px;width:34px;height:34px;border:0;border-radius:8px;background:var(--aso-soft);color:var(--aso-ink);font-size:18px;cursor:pointer}\n  .aso-progress{margin-top:14px;display:flex;align-items:center;gap:10px;font-size:12px;color:var(--aso-muted)}\n  .aso-bar{flex:1;height:6px;background:var(--aso-soft);border-radius:999px;overflow:hidden}\n  .aso-bar i{display:block;height:100%;width:0;background:var(--aso-accent);border-radius:999px;transition:width .3s}\n  .aso-body{flex:1;overflow-y:auto;padding:8px 22px 24px}\n  .aso-meta{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin:14px 0 6px;padding:12px 14px;background:var(--aso-soft);border-radius:10px;font-size:12.5px}\n  .aso-meta dt{color:var(--aso-muted);margin:0}.aso-meta dd{margin:0;font-weight:500;word-break:break-word}\n  .aso-meta a{color:var(--aso-accent);text-decoration:none}\n  .aso-intro{color:var(--aso-muted);font-size:13px;margin:10px 0 4px}\n  .aso-sec{border-bottom:1px solid var(--aso-line)}\n  .aso-sec>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;cursor:pointer;font-weight:600;font-size:14.5px}\n  .aso-sec>summary::-webkit-details-marker{display:none}\n  .aso-sec>summary::after{content:\"\";width:8px;height:8px;border-right:1.5px solid var(--aso-muted);border-bottom:1.5px solid var(--aso-muted);transform:rotate(45deg);transition:transform .2s;flex:none;margin-right:4px}\n  .aso-sec[open]>summary::after{transform:rotate(-135deg)}\n  .aso-count{font-size:11.5px;font-weight:600;color:var(--aso-muted);background:var(--aso-soft);border-radius:999px;padding:2px 8px;margin-left:auto}\n  .aso-count.done{color:var(--aso-ok);background:#ecfdf3}\n  .aso-sec ul{list-style:none;margin:0;padding:0 0 12px}\n  .aso-sec li{padding:7px 0}\n  .aso-sec label{display:flex;gap:11px;align-items:flex-start;cursor:pointer}\n  .aso-sec input[type=checkbox]{appearance:none;width:18px;height:18px;flex:none;margin:2px 0 0;border:1.5px solid #c9ced6;border-radius:5px;background:#fff;cursor:pointer;position:relative}\n  .aso-sec input[type=checkbox]:checked{background:var(--aso-accent);border-color:var(--aso-accent)}\n  .aso-sec input[type=checkbox]:checked::after{content:\"\";position:absolute;left:5px;top:1.5px;width:5px;height:9px;border-right:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(45deg)}\n  .aso-sec label b{font-weight:500;display:block}\n  .aso-sec label small{display:block;color:var(--aso-muted);font-size:12.5px;margin-top:1px}\n  .aso-sec input:checked~b,.aso-sec input:checked~b small{color:var(--aso-muted)}\n  .aso-golive{margin-top:14px}\n  .aso-golive h3{font-size:14.5px;margin:16px 0 6px}\n  .aso-golive h3 small{font-weight:500;color:var(--aso-muted)}\n  .aso-golive ol{margin:0;padding-left:18px}.aso-golive ol li{margin:6px 0}\n  .aso-golive ol li b{font-weight:600}\n  .aso-note{background:#fff8ec;border:1px solid #fde7c0;border-radius:10px;padding:10px 12px;font-size:12.5px;margin:10px 0}\n  .aso-approve{margin-top:18px;padding:16px;border:1px solid var(--aso-line);border-radius:12px}\n  .aso-approve h3{margin:0 0 10px;font-size:15px}\n  .aso-approve .aso-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}\n  .aso-approve input,.aso-approve textarea{width:100%;border:1.5px solid var(--aso-line);border-radius:8px;padding:9px 11px;font:inherit;color:inherit;background:#fff}\n  .aso-approve input:focus,.aso-approve textarea:focus{outline:0;border-color:var(--aso-accent)}\n  .aso-approve textarea{min-height:64px;resize:vertical;margin-bottom:8px}\n  .aso-attest{display:flex;gap:10px;align-items:flex-start;font-size:13px;margin:8px 0 12px}\n  .aso-attest input{width:18px;height:18px;margin:1px 0 0;flex:none}\n  .aso-btn{width:100%;border:0;border-radius:9px;padding:12px;font:600 14px \"DM Sans\",system-ui,sans-serif;cursor:pointer;background:var(--aso-accent);color:var(--aso-accent-ink)}\n  .aso-btn:disabled{background:#d6dae0;color:#8a919b;cursor:not-allowed}\n  .aso-btn.ghost{background:var(--aso-soft);color:var(--aso-ink);margin-top:8px}\n  .aso-status{font-size:12.5px;color:var(--aso-muted);margin-top:8px;text-align:center}\n  .aso-done{background:#ecfdf3;border:1px solid #bbf7d0;border-radius:10px;padding:12px 14px;font-size:13px;color:#166534;margin-top:12px}\n  .aso-foot{padding:10px 22px 14px;border-top:1px solid var(--aso-line);font-size:11.5px;color:var(--aso-muted);text-align:center}\n  @media (max-width:520px){.aso-tab{top:auto;bottom:16px;right:16px;transform:none;border-radius:999px;padding:12px 16px}.aso-approve .aso-row{grid-template-columns:1fr}}\n\n.aso-tab{right:0;top:50%;bottom:auto;transform:translateY(-50%);writing-mode:vertical-rl;border-radius:12px 0 0 12px;padding:18px 12px;box-shadow:0 0 24px #c6282833}\n.aso-tab .aso-dot{display:block;width:9px;height:9px;padding:0;flex:none;background:#fff;border-radius:50%;box-shadow:0 0 6px #fff,0 0 14px #ffb4b4;animation:aso-glow 2s ease-in-out infinite}\n.aso-head{border-top:4px solid var(--aso-accent)}\n.aso :focus-visible{outline:2px solid var(--aso-accent);outline-offset:3px}\n@keyframes aso-glow{50%{box-shadow:0 0 9px #fff,0 0 22px #ffb4b4}}\n@media(prefers-reduced-motion:reduce){.aso *{animation:none!important;transition:none!important}}\n@media(max-width:520px){.aso-tab{top:auto;bottom:16px;right:16px;transform:none;writing-mode:horizontal-tb;border-radius:999px;padding:12px 16px}}\n";document.head.appendChild(style);
document.body.insertAdjacentHTML('beforeend',"<div class=\"aso\" id=\"asoRoot\">\n  <button class=\"aso-tab\" id=\"asoTab\" type=\"button\" aria-expanded=\"false\" aria-controls=\"asoPanel\"><span class=\"aso-dot\" aria-hidden=\"true\"></span>Review &amp; sign off <span id=\"asoTabCount\">0%</span></button>\n  <div class=\"aso-scrim\" id=\"asoScrim\"></div>\n\n  <aside id=\"asoPanel\" class=\"aso-panel\" inert role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"asoTitle\">\n    <header class=\"aso-head\" style=\"position:relative\">\n      <div class=\"aso-eyebrow\">Website review</div>\n      <h2 id=\"asoTitle\">Approve your new site</h2>\n      <p id=\"asoSub\">Work through the list, then approve at the bottom.</p>\n      <button class=\"aso-close\" id=\"asoClose\" type=\"button\" aria-label=\"Close\">\u00d7</button>\n      <div class=\"aso-progress\"><div class=\"aso-bar\"><i id=\"asoBar\"></i></div><span id=\"asoPct\">0 of 0</span></div>\n    </header>\n\n    <div class=\"aso-body\">\n      <dl class=\"aso-meta\" id=\"asoMeta\"></dl>\n      <p class=\"aso-intro\">Please check each item only once you've confirmed it yourself. Anything wrong or missing, note it in the box at the bottom and we'll fix it before launch.</p>\n\n      <div id=\"asoSections\"></div>\n\n      <section class=\"aso-golive\">\n        <h3>How go-live works <small>\u00b7 what happens after you approve</small></h3>\n        <div class=\"aso-note\">Your email is not affected by this move. We copy your existing mail records (MX, SPF, DKIM, DMARC) before anything changes and verify them after.</div>\n        <ol id=\"asoGoLive\"></ol>\n      </section>\n\n      <section class=\"aso-approve\" id=\"asoApprove\">\n        <h3>Approval</h3>\n        <div class=\"aso-row\">\n          <input id=\"asoName\" placeholder=\"Your name\" autocomplete=\"name\">\n          <input id=\"asoTitleIn\" placeholder=\"Title\" autocomplete=\"organization-title\">\n        </div>\n        <input id=\"asoEmail\" type=\"email\" placeholder=\"Your email\" autocomplete=\"email\" style=\"margin-bottom:8px\">\n        <textarea id=\"asoNotes\" placeholder=\"Changes needed before launch, or anything we should know\"></textarea>\n        <label class=\"aso-attest\"><input type=\"checkbox\" id=\"asoAttest\"><span>I've reviewed the site and the items above. I approve it for launch on the domain listed, and I understand that content changes after launch are handled as updates.</span></label>\n        <button class=\"aso-btn\" id=\"asoSubmit\" type=\"button\" disabled>Approve for launch</button>\n        <button class=\"aso-btn ghost\" id=\"asoRequest\" type=\"button\">Send change requests instead</button>\n        <div class=\"aso-status\" id=\"asoStatus\"></div>\n        <div class=\"aso-done\" id=\"asoDone\" hidden></div>\n      </section>\n    </div>\n    <div class=\"aso-foot\">Built and hosted by Aptly \u00b7 this panel is removed at launch</div>\n  </aside>\n</div>");

(function(){
  /* ============================ CONFIG ============================ */
  var CONFIG = {
    company:      "Spradley Properties",
    previewUrl:   "https://site-zdmlrznhkjmuuxjmw.pages.dev/",
    liveDomain:   "spradleyproperties.com",
    oldHost:      "WordPress (current spradleyproperties.com)",
    aptlyContact: "Sina Shekou",
    aptlyEmail:   "sina@getaptly.com",          // approval email goes here
    aptlyCc:      "",                           // optional, e.g. "david@getaptly.com"
    targetLaunch: "To be scheduled after approval",
    pms:          "Rent Manager",               // shows in checklist copy
    // Set true to hide the tab unless the URL has ?review=1
    requireParam: false
  };

  /* ========================= CHECKLIST ============================ */
  var SECTIONS = [
    {title:"Brand & design", items:[
      ["Logo is the current version and looks right at all sizes","Header, footer, mobile menu"],
      ["Colors and fonts match your brand","Tell us if anything reads off brand"],
      ["Headline, tagline and hero video or image are approved",""],
      ["Photography is yours or licensed","Team photos, property photos, stock imagery. Photo credits shown where required"]
    ]},
    {title:"Content accuracy", items:[
      ["Every page has been read start to finish","Home, Owners, Residents, Company, Commercial, Contact, each city page"],
      ["Services and fees described match what you actually offer",""],
      ["Team names, titles, bios and photos are correct",""],
      ["Service areas and city pages are the right cities","Add or remove markets now, not after launch"],
      ["FAQ answers are accurate and current",""]
    ]},
    {title:"Business & legal information", items:[
      ["Phone number, email and mailing address are correct","Footer, contact page, FAQ. Tap the phone number on a mobile device"],
      ["Office hours are correct",""],
      ["License and broker information is present and correct","TREC Consumer Protection Notice, IABS, Equal Housing Opportunity, broker name and license number"],
      ["Privacy policy and accessibility statement are approved",""],
      ["Legal documents and PDFs are hosted on the new site","Nothing may link to files on the old website; those links break at launch"]
    ]},
    {title:"Links, portals & integrations", items:[
      ["Owner portal link opens the correct "+CONFIG.pms+" login",""],
      ["Resident portal link opens the correct "+CONFIG.pms+" login",""],
      ["Apply Now goes to the right application for each listing",""],
      ["Schedule a Tour opens the correct showing tool with your company set",""],
      ["Available listings match what's in "+CONFIG.pms+"","Prices, beds, baths, photos, availability. Listings update automatically from your PMS"],
      ["Links to your other sites are correct","Sales site, social profiles, external resources"],
      ["No link on the site points to the old website domain",""]
    ]},
    {title:"Forms & lead routing", items:[
      ["Submitted a test on every form and received the notification","Contact form, owner inquiry, any calculator or lead capture"],
      ["Owner leads land where your team will actually work them","Owner Leads Board in Aptly and the right people are notified"],
      ["Auto replies and thank you messages read the way you want",""]
    ]},
    {title:"Mobile & browsers", items:[
      ["Checked the site on a phone","Menu, listings, forms, tap to call"],
      ["Checked on a second browser","Safari and Chrome at minimum"]
    ]},
    {title:"Search & visibility", items:[
      ["Business name, address and phone match your Google Business Profile exactly","Same formatting everywhere"],
      ["Page titles and descriptions read well","Shown in browser tabs and search results"],
      ["Old website pages that should redirect are on our redirect list","Any URL you've printed, emailed, or advertised. We map everything else automatically"],
      ["Aptly has been added to Google Business Profile and Google Search Console","Manager access, so we can update your website URL and monitor indexing"]
    ]},
    {title:"Go-live readiness", items:[
      ["You know where your domain is registered and who has the login","GoDaddy, Namecheap, Google Domains, your old web company, etc."],
      ["You've confirmed who hosts your email","So we protect it during the DNS change"],
      ["You've chosen a go-live window","We recommend a Tuesday to Thursday morning"],
      ["You know when your old website hosting contract can be cancelled","Keep it live for 14 days after launch, then cancel"]
    ]}
  ];

  /* ======================== GO-LIVE STEPS ========================= */
  var GOLIVE = [
    ["Approve above.","We schedule your launch window and confirm it by email."],
    ["Give Aptly DNS access, one of two ways.","<b>Option A, recommended:</b> point your domain's nameservers to the two Cloudflare nameservers we send you. We import every existing record first, so nothing else changes. <b>Option B:</b> add the records we send you at your current DNS provider (a CNAME for www pointing to your Aptly site, plus the apex record your provider supports). Either way we send exact instructions with screenshots for your registrar."],
    ["We lower DNS TTLs 48 hours out.","So the switch propagates in minutes instead of a day."],
    ["Launch day.","We attach "+CONFIG.liveDomain+" and www."+CONFIG.liveDomain+" to your Aptly site, issue the SSL certificate, and turn on redirects from every old URL to its new page. Typical downtime: none."],
    ["Same day verification.","We test forms, portals, listings, tap to call, SSL, and mobile on the live domain, update your website URL in Google Business Profile, submit the new sitemap to Google and Bing, and confirm email is still flowing."],
    ["Two weeks after launch.","We review search indexing and redirects, then tell you it's safe to cancel the old host. Ongoing visibility and reporting begin."]
  ];

  /* ============================ ENGINE ============================ */
  var root=document.getElementById('asoRoot'), key='aptly-signoff:'+location.hostname+':'+CONFIG.liveDomain;
  var state={checked:{},name:'',title:'',email:'',notes:'',approvedAt:''};
  try{var s=localStorage.getItem(key); if(s) state=Object.assign(state,JSON.parse(s));}catch(e){}
  function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch(e){}}
  var $=function(id){return document.getElementById(id)};

  if(CONFIG.requireParam && !/[?&]review=1/.test(location.search)){root.remove();return;}

  // meta
  var meta=[["Client",CONFIG.company],["Preview",'<a href="'+CONFIG.previewUrl+'" target="_blank" rel="noopener">'+CONFIG.previewUrl.replace(/^https?:\/\//,'').replace(/\/$/,'')+'</a>'],["Launches to",CONFIG.liveDomain],["Replacing",CONFIG.oldHost],["Target launch",CONFIG.targetLaunch],["Your Aptly contact",CONFIG.aptlyContact+' · <a href="mailto:'+CONFIG.aptlyEmail+'">'+CONFIG.aptlyEmail+'</a>']];
  $('asoMeta').innerHTML=meta.map(function(m){return '<dt>'+m[0]+'</dt><dd>'+m[1]+'</dd>'}).join('');
  $('asoSub').textContent='Work through the list below, then approve at the bottom. '+CONFIG.aptlyContact+' will handle everything after that.';

  // sections
  var total=0, html='';
  SECTIONS.forEach(function(sec,si){
    html+='<details class="aso-sec"'+(si===0?' open':'')+'><summary>'+sec.title+'<span class="aso-count" data-sec="'+si+'"></span></summary><ul>';
    sec.items.forEach(function(it,ii){
      var id='s'+si+'i'+ii; total++;
      html+='<li><label><input type="checkbox" data-id="'+id+'" data-sec="'+si+'"'+(state.checked[id]?' checked':'')+'><b>'+it[0]+(it[1]?'<small>'+it[1]+'</small>':'')+'</b></label></li>';
    });
    html+='</ul></details>';
  });
  $('asoSections').innerHTML=html;
  $('asoGoLive').innerHTML=GOLIVE.map(function(g){return '<li><b>'+g[0]+'</b> '+g[1]+'</li>'}).join('');

  // fields
  ['name','title','email','notes'].forEach(function(f){var el=$('aso'+(f==='title'?'TitleIn':f.charAt(0).toUpperCase()+f.slice(1))); el.value=state[f]||''; el.addEventListener('input',function(){state[f]=el.value;save();gate();});});

  function refresh(){
    var done=0;
    SECTIONS.forEach(function(sec,si){
      var n=sec.items.filter(function(_,ii){return state.checked['s'+si+'i'+ii]}).length; done+=n;
      var c=root.querySelector('.aso-count[data-sec="'+si+'"]'); c.textContent=n+'/'+sec.items.length; c.className='aso-count'+(n===sec.items.length?' done':'');
    });
    var pct=total?Math.round(done/total*100):0;
    $('asoBar').style.width=pct+'%'; $('asoPct').textContent=done+' of '+total; $('asoTabCount').textContent=pct+'%';
    gate();
  }
  function gate(){
    var all=Object.keys(state.checked).filter(function(k){return state.checked[k]}).length===total;
    var ok=all && $('asoAttest').checked && state.name.trim() && /.+@.+\..+/.test(state.email);
    $('asoSubmit').disabled=!ok;
    $('asoStatus').textContent=state.approvedAt?'':(all?'':'Approval unlocks when every item is checked.');
  }
  root.addEventListener('change',function(e){
    var t=e.target; if(t.matches('input[data-id]')){state.checked[t.dataset.id]=t.checked;save();refresh();}
    if(t.id==='asoAttest') gate();
  });

  function summary(kind){
    var lines=[kind+': '+CONFIG.company+' website', 'Preview: '+CONFIG.previewUrl, 'Live domain: '+CONFIG.liveDomain, '', 'From: '+state.name+(state.title?', '+state.title:'')+' <'+state.email+'>', 'Date: '+new Date().toLocaleString(), ''];
    var open=[]; SECTIONS.forEach(function(sec,si){sec.items.forEach(function(it,ii){if(!state.checked['s'+si+'i'+ii]) open.push(sec.title+': '+it[0])})});
    lines.push(open.length?('Not yet confirmed ('+open.length+'):'):'All '+total+' checklist items confirmed.');
    open.forEach(function(o){lines.push(' - '+o)});
    lines.push('', 'Notes / change requests:', state.notes||'(none)');
    return lines.join('\n');
  }
  function mail(subject,body){
    var href='mailto:'+CONFIG.aptlyEmail+'?subject='+encodeURIComponent(subject)+(CONFIG.aptlyCc?'&cc='+encodeURIComponent(CONFIG.aptlyCc):'')+'&body='+encodeURIComponent(body);
    window.location.href=href;
  }
  $('asoSubmit').addEventListener('click',function(){
    state.approvedAt=new Date().toISOString(); save();
    mail('APPROVED for launch: '+CONFIG.company+' ('+CONFIG.liveDomain+')',summary('APPROVAL'));
    showDone();
  });
  $('asoRequest').addEventListener('click',function(){
    if(!state.notes.trim()){$('asoStatus').textContent='Add your change requests in the notes box first.';$('asoNotes').focus();return;}
    mail('Change requests: '+CONFIG.company+' website',summary('CHANGE REQUESTS'));
    $('asoStatus').textContent='Your email client should open with the change list. Send it and we\'ll get started.';
  });
  function showDone(){
    var d=$('asoDone'); d.hidden=false;
    d.innerHTML='<b>Approved</b> by '+state.name+' on '+new Date(state.approvedAt).toLocaleDateString()+'. Your email client opened with the approval summary. If it didn\'t send, copy it with the button below.';
    if(!$('asoCopy')){var b=document.createElement('button');b.className='aso-btn ghost';b.id='asoCopy';b.type='button';b.textContent='Copy approval summary';b.onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(summary('APPROVAL')).then(function(){b.textContent='Copied'});};d.after(b);}
    $('asoSubmit').textContent='Approved'; $('asoSubmit').disabled=true;
  }

  // open / close
  function open(){root.classList.add('is-open');$('asoPanel').inert=false;$('asoTab').setAttribute('aria-expanded','true');$('asoTab').hidden=true;$('asoClose').focus();}
  function close(){if(!root.classList.contains('is-open'))return;root.classList.remove('is-open');$('asoPanel').inert=true;$('asoTab').hidden=false;$('asoTab').setAttribute('aria-expanded','false');$('asoTab').focus();}
  $('asoTab').onclick=open; $('asoClose').onclick=close; $('asoScrim').onclick=close;
  document.addEventListener('keydown',function(e){
    if(!root.classList.contains('is-open'))return;
    if(e.key==='Escape')close();
    if(e.key==='Tab'){
      var els=Array.from($('asoPanel').querySelectorAll('button:not(:disabled),a[href],input,textarea,summary')).filter(function(el){return el.getClientRects().length});
      var first=els[0],last=els[els.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });

  refresh(); if(state.approvedAt) showDone();
  if(/[?&]review=1/.test(location.search)) open();
})();

})();
