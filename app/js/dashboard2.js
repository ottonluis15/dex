// Dashboard Logic - Part 2: Clients, Financial, Calendar, Team, Notifications, Config

function loadClients(){
  const o=O();if(!o)return;
  const tableEl = document.getElementById('clients-table');
  tableEl.innerHTML = Array(3).fill('<tr><td colspan="8"><div class="skeleton skeleton-text"></div></td></tr>').join('');
  setTimeout(() => {
    tableEl.innerHTML=o.clients.length?o.clients.map(c=>{
      const caseCount=o.cases.filter(cs=>cs.clientId===c.id).length;
      const mapLink = c.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}" target="_blank" style="font-size:12px;color:var(--accent);display:block;margin-top:4px">${ICON.map||'📍'} Ver no Mapa</a>` : '';
      return `<tr><td><div class="flex items-center gap-12"><div class="avatar">${getInitials(c.name)}</div><div><strong>${c.name}</strong>${mapLink}</div></div></td><td>${c.type==='PF'?'Pessoa Física':'Pessoa Jurídica'}</td><td><div class="flex items-center gap-8">${c.cpfCnpj||'—'} <span class="btn-copy" onclick="copyToClipboard('${c.cpfCnpj}')">${ICON.copy||'📋'}</span></div></td><td>${c.email||'—'}</td><td>${c.phone||'—'}</td><td>${c.phone?`<a href="https://wa.me/${c.phone.replace(/\D/g,'')}" target="_blank" class="btn btn-sm" style="background:#25D366;color:white;border-color:#25D366">WhatsApp</a>`:'—'}</td><td><span class="badge badge-em_andamento">${caseCount}</span></td><td><button class="btn btn-danger btn-sm" onclick="deleteClient('${c.id}')">${ICON.trash}</button></td></tr>`}).join(''):'<tr><td colspan="8"><div class="empty-table"><svg class="empty-state-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p>Opa! Sua carteira de clientes está vazia. Que tal cadastrar seu primeiro cliente?</p></div></td></tr>';
  }, 400);
}
function saveClient(e){
  e.preventDefault();const o=O();if(!o)return false;
  const newClient = {id:DB.genId(),name:document.getElementById('cl-name').value,type:document.getElementById('cl-type').value,cpfCnpj:document.getElementById('cl-doc').value,email:document.getElementById('cl-email').value,phone:document.getElementById('cl-phone').value,address:document.getElementById('cl-address').value,notes:document.getElementById('cl-notes').value,createdAt:new Date().toISOString()};
  o.clients.push(newClient);
  DB.saveOffice(o);closeModal('client-modal');e.target.reset();showToast('Cliente cadastrado!');
  // [WhatsApp Integration] Welcome message
  sendWhatsAppMessage(newClient.phone, `Olá, ${newClient.name}! Seu cadastro no escritório ${o.name||'Dex'} foi realizado com sucesso. Estamos à disposição!`);
  loadClients();return false;
}
function deleteClient(id){if(!confirm('Excluir este cliente?'))return;const o=O();o.clients=o.clients.filter(c=>c.id!==id);DB.saveOffice(o);showToast('Cliente excluído');loadClients()}

function loadFinancial(){
  const o=O();if(!o)return;
  const tableEl = document.getElementById('financial-table');
  tableEl.innerHTML = Array(3).fill('<tr><td colspan="7"><div class="skeleton skeleton-text"></div></td></tr>').join('');
  
  const totalRev=o.financial.filter(f=>f.type==='RECEITA'&&f.status==='PAGO').reduce((s,f)=>s+f.amount,0);
  const totalExp=o.financial.filter(f=>f.type==='DESPESA'&&f.status==='PAGO').reduce((s,f)=>s+f.amount,0);
  const pendingRev=o.financial.filter(f=>f.type==='RECEITA'&&f.status==='PENDENTE').reduce((s,f)=>s+f.amount,0);
  const pendingExp=o.financial.filter(f=>f.type==='DESPESA'&&f.status==='PENDENTE').reduce((s,f)=>s+f.amount,0);
  const pending = pendingRev - pendingExp;
  document.getElementById('fin-kpis').innerHTML=`
    <div class="card kpi"><div class="kpi-icon" style="background:var(--bg-success);color:var(--success)">${KICON.up}</div><div class="kpi-value" style="color:var(--success)">${formatCurrency(totalRev)}</div><div class="kpi-label">Total Receitas</div></div>
    <div class="card kpi"><div class="kpi-icon" style="background:var(--bg-danger);color:var(--danger)">${KICON.down}</div><div class="kpi-value" style="color:var(--danger)">${formatCurrency(totalExp)}</div><div class="kpi-label">Total Despesas</div></div>
    <div class="card kpi"><div class="kpi-icon" style="background:var(--bg-info);color:var(--info)">${KICON.gem}</div><div class="kpi-value">${formatCurrency(totalRev-totalExp)}</div><div class="kpi-label">Saldo</div></div>
    <div class="card kpi"><div class="kpi-icon" style="background:var(--bg-warning);color:var(--warning)">${KICON.hourglass}</div><div class="kpi-value" style="color:var(--warning)">${formatCurrency(pending)}</div><div class="kpi-label">Pendente</div></div>`;
  
  setTimeout(() => {
    tableEl.innerHTML=o.financial.length?o.financial.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(f=>{
      const cs=f.caseId?o.cases.find(c=>c.id===f.caseId):null;
      return `<tr><td><strong>${f.description}</strong></td><td><span style="color:${f.type==='RECEITA'?'var(--success)':'var(--danger)'}">${f.type==='RECEITA'?'Receita':'Despesa'}</span></td><td><strong style="color:${f.type==='RECEITA'?'var(--success)':'var(--danger)'}">${f.type==='DESPESA'?'-':''}${formatCurrency(f.amount)}</strong></td><td>${statusBadge(f.status)}</td><td>${f.dueDate?formatDate(f.dueDate):'—'}</td><td>${cs?cs.title:'—'}</td><td><div class="flex gap-8">${f.status==='PENDENTE'?`${f.type==='RECEITA'?`<button class="btn btn-sm btn-secondary" onclick="generatePix('${f.id}')">Gerar Pix</button>`:''}<button class="btn btn-sm" style="background:#edfaef;color:var(--success);border:1px solid #68de7c" onclick="markPaid('${f.id}')">Pagar</button>`:''}<button class="btn btn-danger btn-sm" onclick="deleteFin('${f.id}')">${ICON.trash}</button></div></td></tr>`}).join(''):'<tr><td colspan="7"><div class="empty-table"><svg class="empty-state-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><p>Tudo sob controle! Não há lançamentos financeiros no momento.</p></div></td></tr>';
  }, 400);
}
function generatePix(id) {
  const o=O();const f=o.financial.find(x=>x.id===id);if(!f)return;
  showToast('Gerando cobrança Pix via API...');
  setTimeout(() => {
    alert(`[MOCK API] PIX COPIA E COLA GERADO!\n\nCobrança: ${f.description}\nValor: R$ ${f.amount.toFixed(2)}\n\nCódigo: 00020126580014BR.GOV.BCB.PIX0136[DEV_TOKEN_AQUI]...`);
    // Aqui no futuro o sistema salvará o TXID e enviará via WhatsApp
  }, 1000);
}
function saveFinancial(e){
  e.preventDefault();const o=O();if(!o)return false;
  let amount = parseFloat(document.getElementById('fin-amount').value);
  amount = Math.abs(amount); // Força a ser positivo. O tipo (RECEITA/DESPESA) dita o impacto financeiro.
  o.financial.push({id:DB.genId(),type:document.getElementById('fin-type').value,amount:amount,description:document.getElementById('fin-desc').value,caseId:document.getElementById('fin-case').value||null,dueDate:document.getElementById('fin-due').value||null,status:'PENDENTE',createdAt:new Date().toISOString()});
  DB.saveOffice(o);closeModal('financial-modal');e.target.reset();showToast('Entrada registrada!');loadFinancial();return false;
}
function markPaid(id){const o=O();const f=o.financial.find(x=>x.id===id);if(f){f.status='PAGO';f.paidAt=new Date().toISOString();DB.saveOffice(o);showToast('Marcado como pago');loadFinancial();
  // [WhatsApp Integration] Thank you message for payment
  if(f.caseId && f.type==='RECEITA') {
    const c = o.cases.find(cs=>cs.id===f.caseId);
    if(c){
      const client = o.clients.find(cl=>cl.id===c.clientId);
      if(client && client.phone){
        sendWhatsAppMessage(client.phone, `Olá, ${client.name}! Confirmamos o recebimento referente a "${f.description}". Agradecemos a confiança!`);
      }
    }
  }
}}
function deleteFin(id){if(!confirm('Excluir?'))return;const o=O();o.financial=o.financial.filter(f=>f.id!==id);DB.saveOffice(o);showToast('Excluído');loadFinancial()}

function loadCalendar(){
  const o=O();if(!o)return;
  const months=['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const days=['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  document.getElementById('cal-title').textContent=months[calMonth]+' '+calYear;
  const first=new Date(calYear,calMonth,1).getDay();
  const total=new Date(calYear,calMonth+1,0).getDate();
  const today=new Date();
  let html=days.map(d=>`<div class="calendar-header-cell">${d}</div>`).join('');
  const allDates={};
  o.cases.forEach(c=>{if(c.deadline){const d=new Date(c.deadline);if(d.getMonth()===calMonth&&d.getFullYear()===calYear)allDates[d.getDate()]=true}});
  (o.events||[]).forEach(e=>{const d=new Date(e.date);if(d.getMonth()===calMonth&&d.getFullYear()===calYear)allDates[d.getDate()]=true});
  for(let i=0;i<first;i++)html+=`<div class="calendar-cell other-month"></div>`;
  for(let d=1;d<=total;d++){
    const isToday=d===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();
    const hasEv=allDates[d];
    html+=`<div class="calendar-cell${isToday?' today':''}${hasEv?' has-event':''}">${d}</div>`;
  }
  document.getElementById('calendar-grid').innerHTML=html;
  const evts=[...(o.events||[]).filter(e=>{const d=new Date(e.date);return d.getMonth()===calMonth&&d.getFullYear()===calYear}),...o.cases.filter(c=>c.deadline&&new Date(c.deadline).getMonth()===calMonth&&new Date(c.deadline).getFullYear()===calYear).map(c=>({title:'Prazo: '+c.title,date:c.deadline,type:'PRAZO',description:AREAS[c.area]}))].sort((a,b)=>new Date(a.date)-new Date(b.date));
  document.getElementById('month-events').innerHTML=evts.length?evts.map(e=>`<div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--border-light)"><div style="min-width:60px;text-align:center"><div style="font-size:24px;font-weight:800">${new Date(e.date).getDate()}</div><div style="font-size:11px;color:var(--text3)">${months[new Date(e.date).getMonth()].substr(0,3)}</div></div><div><strong>${e.title}</strong><div style="font-size:13px;color:var(--text3)">${e.description||''}</div></div></div>`).join(''):'<p style="color:var(--text3);padding:20px;text-align:center">Nenhum evento neste mes</p>';
}
function changeMonth(dir){calMonth+=dir;if(calMonth>11){calMonth=0;calYear++}if(calMonth<0){calMonth=11;calYear--}loadCalendar()}
function saveEvent(e){
  e.preventDefault();const o=O();if(!o)return false;
  o.events=o.events||[];
  o.events.push({id:DB.genId(),title:document.getElementById('ev-title').value,type:document.getElementById('ev-type').value,date:document.getElementById('ev-date').value,caseId:document.getElementById('ev-case').value||null,userId:S.userId,description:document.getElementById('ev-desc').value,createdAt:new Date().toISOString()});
  DB.saveOffice(o);closeModal('event-modal');e.target.reset();showToast('Evento criado!');loadCalendar();return false;
}

function loadTeam(){
  const o=O();if(!o)return;
  document.getElementById('team-table').innerHTML=o.users.map(u=>`<tr><td><div class="flex items-center gap-12"><div class="avatar">${getInitials(u.name)}</div><strong>${u.name}</strong></div></td><td>${u.email}</td><td>${ROLES[u.role]}</td><td>${u.oab||'—'}</td><td><span class="badge ${u.isActive?'badge-concluido':'badge-cancelado'}">${u.isActive?'Ativo':'Inativo'}</span></td><td>${u.role!=='ADMIN'?`<button class="btn btn-sm ${u.isActive?'btn-danger':'btn-secondary'}" onclick="toggleUser('${u.id}')">${u.isActive?'Desativar':'Ativar'}</button>`:''}</td></tr>`).join('');
}
function saveMember(e){
  e.preventDefault();const o=O();if(!o)return false;
  const email=document.getElementById('tm-email').value;
  if(o.users.some(u=>u.email===email)){showToast('E-mail ja cadastrado','error');return false}
  const newUser={id:DB.genId(),name:document.getElementById('tm-name').value,email,password:document.getElementById('tm-pw').value,role:document.getElementById('tm-role').value,oab:document.getElementById('tm-oab').value,phone:'',avatar:null,isActive:true,createdAt:new Date().toISOString()};
  o.users.push(newUser);
  o.notifications.push({id:DB.genId(),userId:newUser.id,title:'Bem-vindo ao Dex!',message:'Sua conta foi criada. Altere sua senha temporaria nas configurações.',type:'SISTEMA',read:false,createdAt:new Date().toISOString()});
  o.emailLogs=o.emailLogs||[];o.emailLogs.push({id:DB.genId(),to:email,subject:'Convite para '+o.name,type:'INVITE',status:'SENT',sentAt:new Date().toISOString(),createdAt:new Date().toISOString()});
  DB.saveOffice(o);closeModal('team-modal');e.target.reset();showToast('Membro convidado! E-mail de convite enviado (simulado).');loadTeam();return false;
}
function toggleUser(id){const o=O();const u=o.users.find(x=>x.id===id);if(u){u.isActive=!u.isActive;DB.saveOffice(o);showToast(u.isActive?'Usuário ativado':'Usuário desativado');loadTeam()}}

function loadNotifications(){
  const o=O();if(!o)return;
  const notifs=(o.notifications||[]).filter(n=>n.userId===S.userId).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  document.getElementById('notif-list').innerHTML=notifs.length?notifs.map(n=>`<div class="card" style="margin-bottom:12px;${n.read?'opacity:0.6':'border-left:3px solid var(--accent)'}" onclick="markNotifRead('${n.id}')"><div class="flex justify-between items-center"><div><strong>${escapeHTML(n.title)}</strong><p style="font-size:13px;color:var(--text2);margin-top:4px">${escapeHTML(n.message)}</p></div><span style="font-size:12px;color:var(--text3);white-space:nowrap">${timeAgo(n.createdAt)}</span></div></div>`).join(''):'<div class="empty-state"><div class="e-icon">${ICON.bell}</div><p>Nenhuma notificacao</p></div>';
  updateNotifBadge();
}
function markNotifRead(id){const o=O();const n=(o.notifications||[]).find(x=>x.id===id);if(n){n.read=true;DB.saveOffice(o);loadNotifications()}}
function markAllRead(){const o=O();(o.notifications||[]).filter(n=>n.userId===S.userId).forEach(n=>n.read=true);DB.saveOffice(o);showToast('Todas marcadas como lidas');loadNotifications()}
function updateNotifBadge(){const o=O();if(!o)return;const count=(o.notifications||[]).filter(n=>n.userId===S.userId&&!n.read).length;const badge=document.getElementById('notif-badge');const dot=document.getElementById('notif-dot');if(count>0){badge.textContent=count;badge.style.display='inline';dot.style.display='block'}else{badge.style.display='none';dot.style.display='none'}}

function loadConfig(){
  const o=O();if(!o)return;
  document.getElementById('cfg-name').value=o.name||'';
  document.getElementById('cfg-cnpj').value=o.cnpj||'';
  document.getElementById('cfg-email').value=o.email||'';
  document.getElementById('cfg-phone').value=o.phone||'';
  document.getElementById('cfg-address').value=o.address||'';
  document.getElementById('cfg-color').value=o.brandColor||'#b08155';
  populateSelects();
  document.getElementById('cfg-area').value=o.area||'CIVIL';
  const u=o.users.find(x=>x.id===S.userId);
  if(u){document.getElementById('cfg-uname').value=u.name;document.getElementById('cfg-uemail').value=u.email;document.getElementById('cfg-uoab').value=u.oab||'';document.getElementById('cfg-uphone').value=u.phone||''}
}
function saveOfficeConfig(e){
  e.preventDefault();const o=O();
  o.name=document.getElementById('cfg-name').value;o.cnpj=document.getElementById('cfg-cnpj').value;o.email=document.getElementById('cfg-email').value;o.phone=document.getElementById('cfg-phone').value;o.address=document.getElementById('cfg-address').value;o.area=document.getElementById('cfg-area').value;
  o.brandColor=document.getElementById('cfg-color').value;
  DB.saveOffice(o);const s=DB.getSession();s.officeName=o.name;DB.setSession(s);
  applyBrandColor(o.brandColor);
  showToast('Escritório atualizado!');return false;
}
function saveProfile(e){
  e.preventDefault();const o=O();const u=o.users.find(x=>x.id===S.userId);if(!u)return false;
  u.name=document.getElementById('cfg-uname').value;u.oab=document.getElementById('cfg-uoab').value;u.phone=document.getElementById('cfg-uphone').value;
  const pw=document.getElementById('cfg-newpw').value;if(pw)u.password=pw;
  DB.saveOffice(o);const s=DB.getSession();s.name=u.name;DB.setSession(s);document.getElementById('user-name').textContent=u.name;document.getElementById('user-avatar').textContent=getInitials(u.name);showToast('Perfil atualizado!');return false;
}

function exportData(){
  const data = localStorage.getItem('dex_offices');
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dex_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Dados exportados com sucesso!');
}

function importData(input){
  if(!input.files||!input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if(Array.isArray(data)){
        localStorage.setItem('dex_offices', JSON.stringify(data));
        showToast('Dados importados com sucesso! Atualizando...');
        setTimeout(()=>window.location.reload(), 1500);
      } else {
        throw new Error('Formato inválido');
      }
    } catch(err){
      showToast('Erro ao importar arquivo', 'error');
    }
  };
  reader.readAsText(file);
  input.value='';
}

// ------------------------------------
// PHASE 2: TEMPLATES, MURAL, RELATORIOS
// ------------------------------------

function loadTemplates(){
  const o=O();if(!o)return;
  const tpls=o.templates||[];
  document.getElementById('template-grid').innerHTML=tpls.length?tpls.map(t=>`
    <div class="card">
      <div class="flex-between">
        <h4 style="margin:0">${t.title}</h4>
        <div class="flex gap-8">
          <button class="btn-icon" onclick="openPowerfulEditor('${t.id}')" title="Editor Full">${ICON.maximize||'🗖'}</button>
          <button class="btn-icon" onclick="editTemplate('${t.id}')" title="Editar Rápido">${ICON.edit||'✏️'}</button>
          <button class="btn-icon" onclick="deleteTemplate('${t.id}')">${ICON.trash}</button>
        </div>
      </div>
      <p style="font-size:12px;color:var(--text3);margin-top:8px;height:40px;overflow:hidden">${t.content.substring(0,80)}...</p>
      <button class="btn btn-primary btn-sm mt-20" style="width:100%" onclick="openUseTemplate('${t.id}')">Gerar Documento</button>
    </div>
  `).join(''):'<div class="empty-table" style="grid-column:1/-1"><svg class="empty-state-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><p>Seu repositório de modelos está vazio. Comece a padronizar suas petições e contratos agora mesmo!</p></div>';
}


function insertTag(tag) {
  const el = document.getElementById('tpl-content');
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = el.value;
  el.value = text.substring(0, start) + tag + text.substring(end);
  el.focus();
  el.setSelectionRange(start + tag.length, start + tag.length);
}

function importTemplateFile(input) {
  if(!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('tpl-content').value = e.target.result;
    showToast('Arquivo importado com sucesso!');
  };
  reader.readAsText(input.files[0]);
}

function editTemplate(id) {
  const o = O();
  const t = o.templates.find(x => x.id === id);
  if(!t) return;
  document.getElementById('tpl-id').value = t.id;
  document.getElementById('tpl-title').value = t.title;
  document.getElementById('tpl-content').value = t.content;
  document.getElementById('tpl-modal-title').textContent = 'Editar Modelo';
  openModal('template-modal');
}

// POWERFUL EDITOR LOGIC
let activeEditorId = null;

function openPowerfulEditor(id = null) {
  activeEditorId = id;
  const editorSec = document.getElementById('sec-editor');
  const titleEl = document.getElementById('editor-title');
  const contentEl = document.getElementById('editor-content');
  
  if(id) {
    const o = O();
    const t = o.templates.find(x => x.id === id);
    titleEl.textContent = 'Dex Word: ' + t.title;
    contentEl.innerHTML = t.content;
  } else {
    titleEl.textContent = 'Novo Documento';
    contentEl.innerHTML = '';
  }
  
  editorSec.classList.add('active');
  updateEditorStats();
  document.body.classList.add('zen-mode');

  // Adiciona listener para apagar badges com um backspace
  contentEl.addEventListener('keydown', function(e) {
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      
      // Se estiver logo após um badge, apaga o badge inteiro
      if (range.startOffset === 0 && node.previousSibling && node.previousSibling.classList?.contains('badge')) {
        node.previousSibling.remove();
        e.preventDefault();
      }
    }
  });
}

function formatDoc(cmd, value = null) {
  document.execCommand(cmd, false, value);
  document.getElementById('editor-content').focus();
}

function updateEditorStats() {
  const el = document.getElementById('editor-content');
  const text = el.textContent.trim();
  const words = text ? text.split(/\s+/).length : 0;
  document.getElementById('editor-stats').textContent = `${words} palavras | ${text.length} caracteres`;
}

function insertTagEditor(tag) {
  document.getElementById('editor-content').focus();
  const badgeHtml = `<span class="badge" data-tag="${tag}" style="background:var(--accent-light);color:var(--accent);padding:2px 8px;border-radius:6px;font-weight:700;display:inline-block;margin:0 2px;user-select:all" contenteditable="false">${tag}</span>&nbsp;`;
  document.execCommand('insertHTML', false, badgeHtml);
  updateEditorStats();
}

function saveFromEditor() {
  const content = document.getElementById('editor-content').innerHTML;
  if(!content || content === '<br>') { showToast('Documento vazio!', 'error'); return; }
  
  const o = O();
  if(activeEditorId) {
    const t = o.templates.find(x => x.id === activeEditorId);
    if(t) t.content = content;
  } else {
    const title = prompt('Nome do novo modelo:', 'Novo Modelo');
    if(!title) return;
    o.templates.push({id:DB.genId(), title, content, createdAt:new Date().toISOString()});
  }
  
  DB.saveOffice(o);
  showToast('Documento salvo!');
  document.getElementById('sec-editor').classList.remove('active');
  document.body.classList.remove('zen-mode');
  loadTemplates();
}

async function handleEditorImport(input) {
  if(!input.files || !input.files[0]) return;
  const file = input.files[0];
  const extension = file.name.split('.').pop().toLowerCase();
  showToast('Extraindo conteúdo...', 'info');
  
  try {
    let htmlContent = '';
    if(extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({arrayBuffer});
      htmlContent = result.value;
    } else if(extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
      let fullText = '';
      for(let i=1; i<=pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '<br>';
      }
      htmlContent = fullText;
    } else {
      const text = await file.text();
      htmlContent = text.replace(/\n/g, '<br>');
    }
    document.getElementById('editor-content').innerHTML = htmlContent;
    updateEditorStats();
    showToast('Importado com sucesso!');
  } catch (err) {
    showToast('Erro na importação.', 'error');
  }
  input.value = '';
}


function saveTemplate(e){
  e.preventDefault();const o=O();if(!o)return false;
  o.templates=o.templates||[];
  const id = document.getElementById('tpl-id').value;
  const title = document.getElementById('tpl-title').value;
  const content = document.getElementById('tpl-content').value;
  
  if(id) {
    const t = o.templates.find(x => x.id === id);
    if(t) { t.title = title; t.content = content; }
  } else {
    o.templates.push({id:DB.genId(), title, content, createdAt:new Date().toISOString()});
  }
  
  DB.saveOffice(o);closeModal('template-modal');loadTemplates();
  showToast(id?'Modelo atualizado!':'Novo modelo criado!');
  return false;
}


function deleteTemplate(id){
  if(!confirm('Excluir modelo?'))return;const o=O();
  o.templates=o.templates.filter(t=>t.id!==id);DB.saveOffice(o);showToast('Modelo excluído!');loadTemplates();
}

let activeTemplateId=null;
function openUseTemplate(id){
  activeTemplateId=id;
  const o=O();
  const cSel=document.getElementById('use-tpl-client');
  cSel.innerHTML='<option value="">Selecione o Cliente</option>'+o.clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  
  const caseSel=document.getElementById('use-tpl-case');
  caseSel.innerHTML = '<option value="">Não vincular</option>' + o.cases.map(c=>`<option value="${c.id}">${c.title} (${c.number})</option>`).join('');
  
  document.getElementById('use-tpl-result').value='';
  openModal('use-template-modal');
}

function saveGeneratedDocToCase() {
  const caseId = document.getElementById('use-tpl-case').value;
  if(!caseId) { showToast('Selecione um processo para vincular.', 'error'); return; }
  
  const content = document.getElementById('use-tpl-result').value;
  if(!content) { showToast('Gere o documento primeiro.', 'error'); return; }
  
  const o = O();
  const tpl = o.templates.find(t => t.id === activeTemplateId);
  const client = o.clients.find(c => c.id === document.getElementById('use-tpl-client').value);
  
  const doc = {
    id: DB.genId(),
    caseId,
    name: `${tpl.title} - ${client.name}.txt`,
    content,
    createdAt: new Date().toISOString()
  };
  
  o.documents = o.documents || [];
  o.documents.push(doc);
  DB.saveOffice(o);
  
  showToast('Documento anexado ao processo!');
  closeModal('use-template-modal');
  if(currentSection==='processos') loadCases();
}


function generateDocumentPreview(){
  const o=O();const tpl=o.templates.find(t=>t.id===activeTemplateId);
  const clientId=document.getElementById('use-tpl-client').value;
  if(!tpl||!clientId)return;
  const c=o.clients.find(x=>x.id===clientId);if(!c)return;
  
  let content=tpl.content;
  const map = {
    '{NOME_CLIENTE}': c.name,
    '{CPF_CNPJ}': c.cpfCnpj||'N/A',
    '{ENDERECO}': c.address||'N/A',
    '{TELEFONE}': c.phone||'N/A',
    '{DATA_HOJE}': formatDate(new Date())
  };
  
  Object.keys(map).forEach(key => {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, map[key]);
  });
  
  // Clean up badges from editor if they exist
  content = content.replace(/<span class="badge" style="[^>]+">([^<]+)<\/span>/g, '$1');
  
  // Update plain text preview (textarea) stripping most HTML but keeping line breaks
  document.getElementById('use-tpl-result').value = content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
  
  activeGeneratedHtml = content;
}

let activeGeneratedHtml = '';


function copyDocument(){
  const txt=document.getElementById('use-tpl-result').value;
  if(!txt)return;
  navigator.clipboard.writeText(txt).then(()=>showToast('Copiado para a área de transferência!'));
}

function printDocument(){
  if(!activeGeneratedHtml)return;
  const o=O();
  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.fontFamily = "'Playfair Display', serif";
  element.style.color = '#111';
  element.innerHTML = `
    <div style="text-align:center; margin-bottom: 40px; border-bottom: 1px solid #ddd; padding-bottom: 20px;">
      <h2 style="margin:0; color:#2c3e50;">${o.name}</h2>
      <p style="margin:5px 0 0; font-size:12px; color:#666; font-family:'Manrope', sans-serif">${o.address || ''} • ${o.phone || ''} • ${o.email || ''}</p>
    </div>
    <div style="font-size:14px; line-height: 1.6; text-align: justify;">${activeGeneratedHtml}</div>
    <div style="margin-top: 80px; text-align:center;">
      <div style="width: 200px; border-top: 1px solid #111; margin: 0 auto 10px;"></div>
      <p style="margin:0; font-weight:bold">${o.users.find(u=>u.id===S.userId)?.name || 'Advogado'}</p>
      <p style="margin:0; font-size:12px; font-family:'Manrope', sans-serif">OAB: ${o.users.find(u=>u.id===S.userId)?.oab || '---'}</p>
    </div>
  `;
  
  if (typeof html2pdf !== 'undefined') {
    showToast('Gerando PDF formatado...', 'success');
    html2pdf().set({
      margin: 15,
      filename: 'Documento_Legal.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
  } else {
    const w=window.open('','_blank');
    w.document.write(element.innerHTML);
    w.document.close();
    w.print();
  }
}

// MURAL DA EQUIPE
function loadMural(){
  const o=O();if(!o)return;
  const msgs=o.chatMessages||[];
  const list=document.getElementById('chat-list');
  list.innerHTML=msgs.length?msgs.map(m=>{
    const isMine=m.userId===S.userId;
    const author=o.users.find(u=>u.id===m.userId)||{name:'Desconhecido'};
    return `<div class="chat-msg ${isMine?'mine':''}">
      <div class="chat-bubble">${escapeHTML(m.text)}</div>
      <div class="chat-info">${isMine?'Você':author.name} • ${formatDateTime(m.createdAt)}</div>
    </div>`;
  }).join(''):'<div class="empty-table" style="padding:40px"><svg class="empty-state-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><p>O mural está em silêncio. Que tal enviar um "bom dia" para a equipe?</p></div>';
  list.scrollTop=list.scrollHeight;
}

function saveChatMsg(e){
  e.preventDefault();const o=O();if(!o)return false;
  o.chatMessages=o.chatMessages||[];
  const txt=document.getElementById('chat-input').value;
  o.chatMessages.push({id:DB.genId(),userId:S.userId,text:txt,createdAt:new Date().toISOString()});
  DB.saveOffice(o);document.getElementById('chat-input').value='';loadMural();return false;
}

// RELATORIOS
function loadReports(){
  const o=O();if(!o)return;
  
  // Chart 1: Cases by Lawyer
  const lData={};
  o.cases.forEach(c=>{
    const u=o.users.find(x=>x.id===c.responsibleId);
    const n=u?u.name:'Sem Resp.';
    lData[n]=(lData[n]||0)+1;
  });
  const ctxL=document.getElementById('chartLawyers');
  if(ctxL._chart)ctxL._chart.destroy();
  ctxL._chart=new Chart(ctxL,{
    type:'bar',
    data:{labels:Object.keys(lData),datasets:[{label:'Processos Ativos',data:Object.values(lData),backgroundColor:'var(--accent)',borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false}
  });

  // Chart 2: New Cases in last 6 months
  const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const mData=Array(6).fill(0);
  const mLabels=[];
  const now=new Date();
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    mLabels.push(months[d.getMonth()]);
  }
  o.cases.forEach(c=>{
    const d=new Date(c.createdAt);
    const mDiff=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());
    if(mDiff>=0&&mDiff<6) mData[5-mDiff]++;
  });
  const ctxC=document.getElementById('chartNewCases');
  if(ctxC._chart)ctxC._chart.destroy();
  ctxC._chart=new Chart(ctxC,{
    type:'line',
    data:{labels:mLabels,datasets:[{label:'Novos Processos',data:mData,borderColor:'#00a32a',tension:0.3,fill:true,backgroundColor:'rgba(0,163,42,0.1)'}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
}

