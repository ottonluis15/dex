// DEX - Core App Logic
// Theme Init
if(localStorage.getItem('dex_theme')==='dark') document.documentElement.setAttribute('data-theme','dark');

function toggleTheme(){
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  if(isDark){document.documentElement.removeAttribute('data-theme');localStorage.setItem('dex_theme','light');}
  else{document.documentElement.setAttribute('data-theme','dark');localStorage.setItem('dex_theme','dark');}
}

// Global Shortcuts
document.addEventListener('keydown', e => {
  // Ctrl+K -> Focus global search
  if(e.ctrlKey && e.key==='k') { e.preventDefault(); const s=document.getElementById('global-search'); if(s) {s.focus(); s.scrollIntoView();} }
  // Alt+N -> New Process
  if(e.altKey && e.key.toLowerCase()==='n') { e.preventDefault(); showSection('processos'); openModal('case-modal'); }
});
const ICON={
  check:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
  x:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  trash:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  file:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
  warn:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  bell:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  message:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  fileText:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  barChart:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  copy:'<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};

const DB={
  genId(){return 'id_'+Math.random().toString(36).substr(2,9)+'_'+Date.now()},
  getSession(){return JSON.parse(localStorage.getItem('dex_session')||'null')},
  setSession(s){localStorage.setItem('dex_session',JSON.stringify(s))},
  logout(){localStorage.removeItem('dex_session');window.location.href='login.html'},
  getOffices(){return JSON.parse(localStorage.getItem('dex_offices')||'[]')},
  saveOffices(o){localStorage.setItem('dex_offices',JSON.stringify(o))},
  getOffice(){const s=this.getSession();if(!s)return null;return this.getOffices().find(o=>o.id===s.officeId)||null},
  saveOffice(office){const offices=this.getOffices();const i=offices.findIndex(o=>o.id===office.id);if(i>=0)offices[i]=office;this.saveOffices(offices)},
  requireAuth(){if(!this.getSession()){window.location.href='login.html';return false}return true}
};

const AREAS={CIVIL:'Civil',CRIMINAL:'Criminal',TRABALHISTA:'Trabalhista',TRIBUTARIO:'Tributário',FAMILIA:'Família',EMPRESARIAL:'Empresarial',PREVIDENCIARIO:'Previdenciário',AMBIENTAL:'Ambiental',CONSUMIDOR:'Consumidor',DIGITAL:'Digital'};
const STATUS={NOVO:'Novo',EM_ANDAMENTO:'Em Andamento',AGUARDANDO:'Aguardando',CONCLUIDO:'Concluído',ARQUIVADO:'Arquivado'};
const ROLES={ADMIN:'Administrador',LAWYER:'Advogado(a)',ASSISTANT:'Assistente',INTERN:'Estagiário(a)'};
const FIN_STATUS={PENDENTE:'Pendente',PAGO:'Pago',CANCELADO:'Cancelado'};

function escapeHTML(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}
function escapeJSString(value){
  return String(value??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,' ');
}

function formatCurrency(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)}
function formatDate(d){if(!d)return '-';return new Intl.DateTimeFormat('pt-BR').format(new Date(d))}
function formatDateTime(d){if(!d)return '-';return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(d))}
function getInitials(n){return n.split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase()}
function timeAgo(d){const ms=Date.now()-new Date(d).getTime();const m=Math.floor(ms/60000);if(m<1)return'Agora';if(m<60)return m+'min';const h=Math.floor(m/60);if(h<24)return h+'h';const dy=Math.floor(h/24);if(dy<7)return dy+'d';return formatDate(d)}

function setDynamicGreeting(){
  const greetingEl=document.getElementById('page-greeting');
  if(!greetingEl)return;
  const hour=new Date().getHours();
  let text='Olá!';
  if(hour>=5&&hour<12) text='Bom dia! Pronto para focar nos processos de hoje?';
  else if(hour>=12&&hour<18) text='Boa tarde! Como estão os andamentos?';
  else text='Boa noite! Um excelente fim de expediente para você.';
  greetingEl.textContent=text;
}

function applyBrandColor(color){
  if(!color)return;
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-light', color+'22');
}

function toggleZenMode(){
  document.body.classList.toggle('zen-mode');
  showToast(document.body.classList.contains('zen-mode')?'Modo Foco Ativado':'Modo Foco Desativado','info');
}

document.addEventListener('keydown', e => {
  if(e.altKey){
    if(e.key.toLowerCase()==='f'){ e.preventDefault(); toggleZenMode(); }
    if(e.key.toLowerCase()==='n'){ e.preventDefault(); showSection('processos'); openModal('case-modal'); }
    if(e.key.toLowerCase()==='c'){ e.preventDefault(); showSection('clientes'); openModal('client-modal'); }
    if(e.key.toLowerCase()==='a'){ e.preventDefault(); showSection('ai-assistant'); }
    if(e.key.toLowerCase()==='k'){ e.preventDefault(); openModal('deadline-modal'); }
  }
});

document.addEventListener('DOMContentLoaded', ()=>{
  setDynamicGreeting();
  const o=DB.getOffice();
  if(o && o.brandColor) applyBrandColor(o.brandColor);
});

function showToast(msg,type='success'){
  let c=document.getElementById('toast-container');
  if(!c){c=document.createElement('div');c.id='toast-container';c.className='toast-container';document.body.appendChild(c)}
  const ico=type==='success'?ICON.check:type==='error'?ICON.x:type==='info'?ICON.bell:ICON.check;
  const t=document.createElement('div');t.className='toast toast-'+type;
  t.innerHTML=`<div class="flex-center" style="width:24px;height:24px;background:var(--bg-primary);border-radius:50%;color:currentColor">${ico}</div> <span>${escapeHTML(msg)}</span>`;
  c.appendChild(t);
  setTimeout(()=>t.remove(),4000);
}

function statusBadge(s){return `<span class="badge badge-${s.toLowerCase()}">${STATUS[s]||FIN_STATUS[s]||s}</span>`}
function roleBadge(r){return ROLES[r]||r}

// --- WHATSAPP INTEGRATION ---
// [DEV API] Integre sua API de WhatsApp aqui (ex: Z-API, Evolution API, Meta Cloud API, Twilio).
// Esta função é chamada automaticamente ao criar clientes, mudar status de processos, etc.
function sendWhatsAppMessage(phone, message) {
  if (!phone) return;
  const cleanPhone = phone.replace(/\D/g, ''); // Remove formatação (parenteses, traços)
  if (cleanPhone.length < 10) return;
  
  console.log(`[WhatsApp Mock API] Enviando para ${cleanPhone}: "${message}"`);
  
  /* Exemplo de integração com Meta Cloud API:
  fetch('https://graph.facebook.com/v17.0/SEU_PHONE_NUMBER_ID/messages', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer SEU_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: message }
    })
  }).then(res => res.json()).then(console.log).catch(console.error);
  */
}

