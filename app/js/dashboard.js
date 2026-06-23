// Dashboard Logic - Part 1: Init, Navigation, Dashboard, Cases
if(!DB.requireAuth())throw'no auth';
const S=DB.getSession(),O=()=>DB.getOffice();
let currentSection='dashboard',calMonth=new Date().getMonth(),calYear=new Date().getFullYear(),selectedFiles=[];

const KICON={
  scale:'<svg class="icon-svg icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  users:'<svg class="icon-svg icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  dollar:'<svg class="icon-svg icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  clock:'<svg class="icon-svg icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  up:'<svg class="icon-svg icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
  down:'<svg class="icon-svg icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 7 6 6 4-4 8 8"/><path d="M21 17h-7v-7"/></svg>',
  gem:'<svg class="icon-svg icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>',
  hourglass:'<svg class="icon-svg icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>'
};

(function init(){
  document.getElementById('user-avatar').textContent=getInitials(S.name);
  document.getElementById('user-name').textContent=S.name;
  document.getElementById('user-role').textContent=ROLES[S.role];
  loadDashboard();
  updateNotifBadge();
})();

function showSection(name){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const sec=document.getElementById('sec-'+name);
  if(sec)sec.classList.add('active');
  const titles={dashboard:'Dashboard',processos:'Processos',clientes:'Clientes',financeiro:'Financeiro',agenda:'Agenda',equipe:'Equipe',notificações:'Notificações',config:'Configurações','case-detail':'Detalhes do Processo',modelos:'Modelos de Documentos',mural:'Mural da Equipe',relatórios:'Relatórios','ai-assistant':'Assistente de IA'};
  document.getElementById('page-title').textContent=titles[name]||'';
  currentSection=name;
  const loaders={dashboard:()=>{loadDashboard();renderTasks();renderMiniCalendar();renderHealthReport();},processos:loadCases,clientes:loadClients,financeiro:loadFinancial,agenda:loadCalendar,equipe:loadTeam,notificações:loadNotifications,config:loadConfig,modelos:loadTemplates,mural:loadMural,relatórios:loadReports,'ai-assistant':()=>{document.getElementById('cmd-input').focus();renderAiHistory();renderContextualChips();}};
  if(loaders[name])loaders[name]();
  document.querySelectorAll('.nav-item').forEach(n=>{if(n.textContent.trim().startsWith(titles[name]))n.classList.add('active')});
}

function openModal(id){document.getElementById(id).classList.add('active');populateSelects()}
function closeModal(id){document.getElementById(id).classList.remove('active')}
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('active')}));

function populateSelects(){
  const o=O();if(!o)return;
  document.querySelectorAll('#case-area,#cfg-area').forEach(sel=>{sel.innerHTML='';Object.entries(AREAS).forEach(([k,v])=>{sel.innerHTML+=`<option value="${k}">${v}</option>`})});
  const cs=document.getElementById('case-client');if(cs){cs.innerHTML='<option value="">Selecione</option>';o.clients.forEach(c=>{cs.innerHTML+=`<option value="${c.id}">${c.name}</option>`})}
  const rs=document.getElementById('case-responsible');if(rs){rs.innerHTML='';o.users.filter(u=>u.isActive).forEach(u=>{rs.innerHTML+=`<option value="${u.id}">${u.name}</option>`})}
  ['fin-case','ev-case'].forEach(id=>{const el=document.getElementById(id);if(el){el.innerHTML='<option value="">Nenhum</option>';o.cases.forEach(c=>{el.innerHTML+=`<option value="${c.id}">${c.title}</option>`})}});
}

function filterGlobal(q){
  q=q.toLowerCase();
  const o=O();if(!o)return;
  // Filter cases
  if(currentSection==='processos'){
    renderCases(o.cases.filter(c=>c.title.toLowerCase().includes(q)||c.number.toLowerCase().includes(q)||(c.tags||[]).join(' ').toLowerCase().includes(q)));
  } else if(currentSection==='clientes'){
    // Re-use logic from dashboard2.js instead of duplicating HTML
    const filtered = o.clients.filter(c=>c.name.toLowerCase().includes(q)||c.cpfCnpj.toLowerCase().includes(q));
    const tableEl = document.getElementById('clients-table');
    tableEl.innerHTML = Array(3).fill('<tr><td colspan="8"><div class="skeleton skeleton-text"></div></td></tr>').join('');
    setTimeout(() => {
      tableEl.innerHTML=filtered.length?filtered.map(c=>{
        const caseCount=o.cases.filter(cs=>cs.clientId===c.id).length;
        return `<tr><td><div class="flex items-center gap-12"><div class="avatar">${getInitials(c.name)}</div><strong>${c.name}</strong></div></td><td>${c.type==='PF'?'Pessoa Física':'Pessoa Jurídica'}</td><td>${c.cpfCnpj||'—'}</td><td>${c.email||'—'}</td><td>${c.phone||'—'}</td><td>${c.phone?`<a href="https://wa.me/${c.phone.replace(/\D/g,'')}" target="_blank" class="btn btn-sm" style="background:#25D366;color:white;border-color:#25D366">WhatsApp</a>`:'—'}</td><td><span class="badge badge-em_andamento">${caseCount}</span></td><td><button class="btn btn-danger btn-sm" onclick="deleteClient('${c.id}')">${ICON.trash}</button></td></tr>`}).join(''):'<tr><td colspan="8"><div class="empty-table"><svg class="empty-state-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>Puxa, não encontramos nenhum cliente com esse termo. Que tal tentar de novo?</p></div></td></tr>';
    }, 400);
  }
}

function loadDashboard(){
  const o=O();if(!o)return;
  const now=new Date(),thisMonth=now.getMonth(),thisYear=now.getFullYear();
  const activeCases=o.cases.filter(c=>['NOVO','EM_ANDAMENTO','AGUARDANDO'].includes(c.status)).length;
  const totalClients=o.clients.length;
  const monthRev=o.financial.filter(f=>f.type==='RECEITA'&&f.status==='PAGO'&&new Date(f.paidAt||f.createdAt).getMonth()===thisMonth).reduce((s,f)=>s+f.amount,0);
  const upcoming=o.cases.filter(c=>c.deadline&&new Date(c.deadline)>now&&new Date(c.deadline)<new Date(now.getTime()+7*86400000)).length;
  document.getElementById('cases-count').textContent=activeCases;
  document.getElementById('kpi-grid').innerHTML=`
    <div class="card kpi"><div class="kpi-icon" style="background:var(--accent-light);color:var(--accent)">${KICON.scale}</div><div class="kpi-value">${activeCases}</div><div class="kpi-label">Processos Ativos</div></div>
    <div class="card kpi"><div class="kpi-icon" style="background:#edfaef;color:var(--success)">${KICON.users}</div><div class="kpi-value">${totalClients}</div><div class="kpi-label">Clientes</div></div>
    <div class="card kpi"><div class="kpi-icon" style="background:#f3e8ff;color:#7c3aed">${KICON.dollar}</div><div class="kpi-value">${formatCurrency(monthRev)}</div><div class="kpi-label">Receita Mensal</div></div>
    <div class="card kpi"><div class="kpi-icon" style="background:#fcf9e8;color:#996800">${KICON.clock}</div><div class="kpi-value">${upcoming}</div><div class="kpi-label">Prazos Próximos</div></div>`;
  const statusData={NOVO:0,EM_ANDAMENTO:0,AGUARDANDO:0,CONCLUIDO:0,ARQUIVADO:0};
  o.cases.forEach(c=>statusData[c.status]=(statusData[c.status]||0)+1);
  const ctx1=document.getElementById('chartStatus');
  if(ctx1._chart)ctx1._chart.destroy();
  ctx1._chart=new Chart(ctx1,{type:'doughnut',data:{labels:Object.keys(statusData).map(k=>STATUS[k]),datasets:[{data:Object.values(statusData),backgroundColor:['#2271b1','#135e96','#dba617','#00a32a','#787c82'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#50575e',padding:12,font:{size:12}}}}}});
  const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const revByMonth=Array(12).fill(0),expByMonth=Array(12).fill(0);
  o.financial.forEach(f=>{const m=new Date(f.createdAt).getMonth();if(f.type==='RECEITA'&&f.status==='PAGO')revByMonth[m]+=f.amount;if(f.type==='DESPESA'&&f.status==='PAGO')expByMonth[m]+=f.amount});
  const ctx2=document.getElementById('chartFinancial');
  if(ctx2._chart)ctx2._chart.destroy();
  ctx2._chart=new Chart(ctx2,{type:'bar',data:{labels:months,datasets:[{label:'Receitas',data:revByMonth,backgroundColor:'rgba(0,163,42,0.6)',borderRadius:4},{label:'Despesas',data:expByMonth,backgroundColor:'rgba(214,54,56,0.6)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{color:'#787c82'},grid:{display:false}},y:{ticks:{color:'#787c82',callback:v=>formatCurrency(v)},grid:{color:'rgba(0,0,0,0.06)'}}},plugins:{legend:{labels:{color:'#50575e'}}}}});
  const allEvents=(o.events||[]).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  document.getElementById('recent-activity').innerHTML=allEvents.length?allEvents.map(e=>`<div class="timeline-item"><div class="time">${timeAgo(e.createdAt)}</div><div class="title">${e.title}</div><div class="desc">${e.description||''}</div></div>`).join(''):'<div class="empty-state"><p style="padding:20px">Nenhuma atividade recente</p></div>';
  const deadlines=o.cases.filter(c=>c.deadline&&new Date(c.deadline)>now).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,5);
  document.getElementById('upcoming-deadlines').innerHTML=deadlines.length?deadlines.map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light)"><div><div style="font-weight:600;font-size:14px">${c.title}</div><div style="font-size:12px;color:var(--text3)">${AREAS[c.area]}</div></div><span class="badge badge-aguardando">${formatDate(c.deadline)}</span></div>`).join(''):'<div class="empty-state"><p style="padding:20px">Nenhum prazo proximo</p></div>';
}

function loadCases(){
  const o=O();if(!o)return;
  document.getElementById('case-filters').innerHTML=`<button class="filter-chip active" onclick="filterCases('')">Todos</button>`+Object.entries(STATUS).map(([k,v])=>`<button class="filter-chip" onclick="filterCases('${k}')">${v}</button>`).join('');
  renderCases(o.cases);
}
function filterCases(status){
  document.querySelectorAll('#case-filters .filter-chip').forEach((c,i)=>{c.classList.toggle('active',(!status&&i===0)||(c.textContent===STATUS[status]))});
  const o=O();renderCases(status?o.cases.filter(c=>c.status===status):o.cases);
}
function renderCases(cases){
  const o=O();
  const tableEl = document.getElementById('cases-table');
  tableEl.innerHTML = Array(3).fill('<tr><td colspan="8"><div class="skeleton skeleton-text"></div></td></tr>').join('');
  setTimeout(() => {
    tableEl.innerHTML=cases.length?cases.map(c=>{
      const client=o.clients.find(cl=>cl.id===c.clientId)||{name:'—'};
      const resp=o.users.find(u=>u.id===c.responsibleId)||{name:'—'};
      
      // TAGS WITH COLORS
      const tagsHtml=(c.tags||[]).map(t=>{
        const lower = t.toLowerCase();
        const colorClass = lower.includes('urgente')?'badge-tag-urgente':lower.includes('vip')?'badge-tag-vip':lower.includes('finalizado')?'badge-tag-finalizado':'';
        return `<span class="badge ${colorClass}" style="background:var(--bg-tertiary);border:1px solid var(--border)">${t}</span>`;
      }).join(' ');

      // PROGRESS BAR (Simulated based on status)
      const progressMap = {ABERTO: 20, EM_ANDAMENTO: 50, SUSPENSO: 40, CONCLUIDO: 100, CANCELADO: 0};
      const progress = progressMap[c.status] || 10;

      return `<tr onclick="viewCase('${c.id}')" style="cursor:pointer">
        <td>
          <div class="flex items-center gap-8">
            <div style="font-weight:600">${c.title}</div>
            <span class="btn-copy" onclick="event.stopPropagation();copyToClipboard('${c.number}')" title="Copiar Número">${ICON.copy||'📋'}</span>
          </div>
          <div style="font-size:12px;color:var(--text3)">${c.number||'Sem numero'}</div>
          <div class="progress-container"><div class="progress-fill" style="width:${progress}%"></div></div>
        </td>
        <td>${client.name}</td>
        <td>${AREAS[c.area]}</td>
        <td>${tagsHtml}</td>
        <td>${statusBadge(c.status)}</td>
        <td><div class="flex items-center gap-8"><div class="avatar avatar-sm">${getInitials(resp.name)}</div>${resp.name}</div></td>
        <td>${c.deadline?formatDate(c.deadline):'—'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteCase('${c.id}')">${ICON.trash}</button></td>
      </tr>`}).join(''):'<tr><td colspan="8"><div class="empty-table"><svg class="empty-state-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><p>Que tranquilidade! Você não possui processos nesta visão. Aproveite o tempo livre ou adicione um novo.</p></div></td></tr>';
  }, 400);
}
function saveCase(e){
  e.preventDefault();const o=O();if(!o)return false;
  const rawTags=document.getElementById('case-tags').value;
  const tags=rawTags?rawTags.split(',').map(t=>t.trim()).filter(Boolean):[];
  const c={id:DB.genId(),title:document.getElementById('case-title').value,number:document.getElementById('case-number').value,area:document.getElementById('case-area').value,clientId:document.getElementById('case-client').value,responsibleId:document.getElementById('case-responsible').value,court:document.getElementById('case-court').value,judge:document.getElementById('case-judge').value,estimatedValue:parseFloat(document.getElementById('case-value').value)||0,deadline:document.getElementById('case-deadline').value||null,description:document.getElementById('case-desc').value,tags:tags,status:'NOVO',documents:selectedFiles.map(f=>({id:DB.genId(),name:f.name,size:f.size,type:f.type,createdAt:new Date().toISOString()})),createdAt:new Date().toISOString()};
  o.cases.push(c);
  o.events=o.events||[];o.events.push({id:DB.genId(),caseId:c.id,userId:S.userId,type:'MOVIMENTACAO',title:'Processo criado: '+c.title,description:'Novo processo registrado no sistema',date:new Date().toISOString(),createdAt:new Date().toISOString()});
  DB.saveOffice(o);closeModal('case-modal');e.target.reset();selectedFiles=[];document.getElementById('file-list').innerHTML='';showToast('Processo criado com sucesso!');loadCases();loadDashboard();return false;
}
function deleteCase(id){if(!confirm('Excluir este processo?'))return;const o=O();o.cases=o.cases.filter(c=>c.id!==id);DB.saveOffice(o);showToast('Processo excluído');loadCases()}
function viewCase(id){
  const o=O(),c=o.cases.find(x=>x.id===id);if(!c)return;
  const client=o.clients.find(cl=>cl.id===c.clientId)||{name:'—'};
  const resp=o.users.find(u=>u.id===c.responsibleId)||{name:'—'};
  const events=(o.events||[]).filter(e=>e.caseId===id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const docs=c.documents||[];
  const fin=o.financial.filter(f=>f.caseId===id);
  document.getElementById('case-detail-title').textContent=c.title;
  document.getElementById('case-detail-content').innerHTML=`
    <div class="grid-2"><div class="card"><h3 class="card-title" style="margin-bottom:16px">Informacoes</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px">
    <div><span style="color:var(--text3)">Numero:</span><br><strong>${c.number||'—'}</strong></div>
    <div><span style="color:var(--text3)">Área:</span><br><strong>${AREAS[c.area]}</strong></div>
    <div><span style="color:var(--text3)">Status:</span><br>${statusBadge(c.status)}</div>
    <div><span style="color:var(--text3)">Prazo:</span><br><strong>${c.deadline?formatDate(c.deadline):'—'}</strong></div>
    <div><span style="color:var(--text3)">Cliente:</span><br><strong>${client.name}</strong></div>
    <div><span style="color:var(--text3)">Responsavel:</span><br><strong>${resp.name}</strong></div>
    <div><span style="color:var(--text3)">Tribunal:</span><br><strong>${c.court||'—'}</strong></div>
    <div><span style="color:var(--text3)">Juiz:</span><br><strong>${c.judge||'—'}</strong></div>
    <div style="grid-column:1/-1"><span style="color:var(--text3)">Valor Estimado:</span><br><strong style="font-size:18px">${formatCurrency(c.estimatedValue||0)}</strong></div>
    </div>
    <div style="margin-top:16px"><span style="color:var(--text3)">Descrição:</span><p style="margin-top:4px">${c.description||'Sem descrição'}</p></div>
    <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">
    <select class="form-select" style="width:auto" onchange="updateCaseStatus('${c.id}',this.value)">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${k===c.status?'selected':''}>${v}</option>`).join('')}</select>
    </div></div>
    <div><div class="card" style="margin-bottom:16px"><h3 class="card-title" style="margin-bottom:16px">Timeline</h3>
    <div class="timeline">${events.length?events.map(ev=>`<div class="timeline-item"><div class="time">${formatDateTime(ev.date)}</div><div class="title">${ev.title}</div><div class="desc">${ev.description||''}</div></div>`).join(''):'<p style="color:var(--text3)">Nenhum evento</p>'}</div></div>
    <div class="card" style="margin-bottom:16px"><h3 class="card-title" style="margin-bottom:16px">Documentos (${docs.length})</h3>
    ${docs.length?docs.map(d=>`<div class="file-item">${ICON.file}<span class="name">${d.name}</span><span class="size">${(d.size/1024).toFixed(1)}KB</span></div>`).join(''):'<p style="color:var(--text3)">Nenhum documento</p>'}</div>
    <div class="card"><h3 class="card-title" style="margin-bottom:16px">Financeiro</h3>
    ${fin.length?fin.map(f=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><div><strong>${f.description}</strong><br><span style="font-size:12px;color:var(--text3)">${f.type}</span></div><div style="text-align:right"><strong style="color:${f.type==='RECEITA'?'var(--success)':'var(--danger)'}">${formatCurrency(f.amount)}</strong><br>${statusBadge(f.status)}</div></div>`).join(''):'<p style="color:var(--text3)">Nenhuma entrada</p>'}</div>
    </div></div>`;
  showSection('case-detail');
}
function updateCaseStatus(id,status){const o=O();const c=o.cases.find(x=>x.id===id);if(!c)return;c.status=status;o.events.push({id:DB.genId(),caseId:id,userId:S.userId,type:'MOVIMENTACAO',title:'Status alterado para: '+STATUS[status],description:'',date:new Date().toISOString(),createdAt:new Date().toISOString()});DB.saveOffice(o);showToast('Status atualizado');viewCase(id);
  // [WhatsApp Integration] Notify client of case status change
  const client=o.clients.find(cl=>cl.id===c.clientId);
  if(client && client.phone){
    sendWhatsAppMessage(client.phone, `Olá, ${client.name}! Informamos que o status do seu processo "${c.title}" foi atualizado para: ${STATUS[status]}. Qualquer dúvida, estamos à disposição.`);
  }
}
function handleFiles(input){selectedFiles=Array.from(input.files);document.getElementById('file-list').innerHTML=selectedFiles.map(f=>`<div class="file-item">${ICON.file}<span class="name">${f.name}</span><span class="size">${(f.size/1024).toFixed(1)}KB</span></div>`).join('')}

// --- AI COMMAND CENTER ---
function setCommand(cmd) {
  const input = document.getElementById('cmd-input');
  if(input) {
    input.value = cmd;
    input.focus();
    executeCommand();
  }
}

function executeCommand() {
  const input = document.getElementById('cmd-input');
  const results = document.getElementById('cmd-results');
  if(!input || !results) return;
  const cmd = input.value.trim();
  if(!cmd) return;
  
  saveAiHistory(cmd);
  results.classList.add('active');
  results.innerHTML = `<div class="ai-cmd-thinking"><svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Processando sua solicitação...</div>`;
  
  setTimeout(() => {
    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd.includes('cliente') || lowerCmd.includes('busca')) {
      results.innerHTML = `<div class="ai-cmd-response-card"><h4>Resultado para Clientes</h4><p>Encontrei as seguintes correspondências baseadas no seu pedido:</p><ul style="margin-top:12px;padding-left:20px;line-height:1.8"><li><strong>João da Silva</strong> (CPF: 123.456.789-00) - <a href="#" onclick="showSection('clientes')">Ver Perfil</a></li><li><strong>Empresa XYZ</strong> (CNPJ: 00.000.000/0001-00) - <a href="#" onclick="showSection('clientes')">Ver Perfil</a></li></ul></div>`;
    } else if (lowerCmd.includes('prazo') || lowerCmd.includes('agenda')) {
      results.innerHTML = `<div class="ai-cmd-response-card"><h4>Próximos Prazos</h4><p>Você tem <strong>2 prazos críticos</strong> para amanhã. Não se esqueça de revisar os memoriais antes das 14h.</p><button class="btn btn-primary btn-sm mt-20" onclick="showSection('agenda')">Acessar Agenda Completa</button></div>`;
    } else if (lowerCmd.includes('relatório') || lowerCmd.includes('honorário')) {
      results.innerHTML = `<div class="ai-cmd-response-card"><h4>Relatório Rápido</h4><p>Neste mês, a previsão de entradas é de <strong style="color:var(--success)">R$ 15.400,00</strong>. Houve um crescimento de 12% em relação ao mês passado.</p></div>`;
    } else {
      results.innerHTML = `<div class="ai-cmd-response-card"><h4>Resposta do Assistente</h4><p>Compreendi seu comando: <em>"${escapeHTML(cmd)}"</em>.</p><p style="margin-top:8px">Como esta é uma demonstração da interface, a execução em linguagem natural de ações destrutivas ou criações complexas não está conectada ao banco de dados, mas a arquitetura já está pronta para a integração final com nosso LLM.</p></div>`;
    }
    input.value = '';
    renderAiHistory();
  }, 1500);
}

function saveAiHistory(cmd) {
  const o = O();
  o.aiHistory = o.aiHistory || [];
  if(o.aiHistory[0] === cmd) return;
  o.aiHistory.unshift(cmd);
  o.aiHistory = o.aiHistory.slice(0, 5);
  DB.saveOffice(o);
}

function renderAiHistory() {
  const o = O();
  const hist = o.aiHistory || [];
  const sec = document.getElementById('ai-history-section');
  const list = document.getElementById('ai-history-list');
  if(!sec || !list) return;
  if(hist.length > 0) {
    sec.style.display = 'block';
    list.innerHTML = hist.map(h => `<div class="ai-history-item" onclick="setCommand('${escapeJSString(h)}')">${escapeHTML(h)}</div>`).join('');
  } else {
    sec.style.display = 'none';
  }
}

// --- QUICK TASKS ---
function renderTasks() {
  const o = O();
  const tasks = o.tasks || [];
  const list = document.getElementById('task-list');
  if(!list) return;
  list.innerHTML = tasks.length ? tasks.map(t => `
    <div class="task-item ${t.done?'done':''}" onclick="toggleTask('${t.id}')">
      <div class="task-check">${t.done?ICON.check:''}</div>
      <div style="flex:1"><strong>${escapeHTML(t.text)}</strong></div>
      <button class="btn-icon" style="color:var(--text3)" onclick="event.stopPropagation();deleteTask('${t.id}')">${ICON.trash}</button>
    </div>
  `).join('') : '<p style="color:var(--text3);text-align:center;padding:20px">Nenhuma tarefa pendente.</p>';
}

function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if(!text) return;
  const o = O();
  o.tasks = o.tasks || [];
  o.tasks.unshift({id:DB.genId(), text, done:false, createdAt:new Date().toISOString()});
  DB.saveOffice(o);
  input.value = '';
  renderTasks();
}

function toggleTask(id) {
  const o = O();
  const t = (o.tasks || []).find(x => x.id === id);
  if(t) {
    t.done = !t.done;
    DB.saveOffice(o);
    renderTasks();
  }
}

function deleteTask(id) {
  const o = O();
  o.tasks = (o.tasks || []).filter(x => x.id !== id);
  DB.saveOffice(o);
  renderTasks();
}

const spinStyle = document.createElement('style');
spinStyle.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
document.head.appendChild(spinStyle);

function copyToClipboard(text) {
  if(!text || text==='—') return;
  navigator.clipboard.writeText(text).then(() => showToast('Copiado: ' + text));
}

// --- DEADLINE CALCULATOR ---
function calculateDeadline() {
  const start = document.getElementById('calc-start-date').value;
  const days = parseInt(document.getElementById('calc-days').value);
  const type = document.getElementById('calc-type').value;
  const resEl = document.getElementById('calc-result');
  
  if(!start || isNaN(days)) { showToast('Preencha os dados corretamente', 'error'); return; }
  
  let date = new Date(start + 'T00:00:00');
  let added = 0;
  
  while(added < days) {
    date.setDate(date.getDate() + 1);
    if(type === 'CORR') {
      added++;
    } else {
      const day = date.getDay();
      if(day !== 0 && day !== 6) added++; // Skip Sat/Sun
    }
  }
  
  resEl.classList.add('active');
  resEl.innerHTML = `<strong>Resultado:</strong><div style="font-size:20px;margin-top:8px;color:var(--accent)">${formatDate(date.toISOString())}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">${days} dias ${type==='CORR'?'corridos':'úteis'} após ${formatDate(start)}</div>`;
}

// --- DASHBOARD WIDGETS ---
function renderMiniCalendar() {
  const el = document.getElementById('mini-calendar');
  if(!el) return;
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const total = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const o = O();
  const deadlines = (o.cases||[]).filter(c=>c.deadline).map(c=>new Date(c.deadline).getDate());

  let html = '';
  for(let i=0; i<first; i++) html += '<div></div>';
  for(let d=1; d<=total; d++) {
    const isToday = d === today.getDate();
    const hasD = deadlines.includes(d);
    html += `<div class="mini-cal-day ${isToday?'today':''} ${hasD?'has-deadline':''}">${d}</div>`;
  }
  el.innerHTML = html;
}

function renderHealthReport() {
  const el = document.getElementById('health-report');
  if(!el) return;
  const o = O();
  const total = (o.cases||[]).length;
  const done = (o.cases||[]).filter(c=>c.status==='CONCLUIDO').length;
  const tasks = (o.tasks||[]).length;
  const tasksDone = (o.tasks||[]).filter(t=>t.done).length;
  
  const score = total > 0 ? Math.round(((done/total)*0.7 + (tasks>0?(tasksDone/tasks)*0.3:0.3)) * 100) : 100;
  
  el.innerHTML = `
    <div class="flex-between">
      <div class="progress-label">Saúde do Escritório</div>
      <div style="font-weight:700;color:${score>70?'var(--success)':score>40?'var(--warning)':'var(--danger)'}">${score}%</div>
    </div>
    <div class="progress-container"><div class="progress-fill" style="width:${score}%;background:${score>70?'var(--success)':score>40?'var(--warning)':'var(--danger)'}"></div></div>
    <p style="font-size:11px;color:var(--text3);margin-top:8px">${done}/${total} processos finalizados. ${tasksDone}/${tasks} tarefas em dia.</p>
  `;
}

function renderContextualChips() {
  const container = document.querySelector('.ai-cmd-chips');
  if(!container) return;
  const hour = new Date().getHours();
  let extra = '';
  if(hour < 12) extra = '<button class="btn btn-sm" onclick="setCommand(\'O que tenho para hoje?\')">📅 Resumo do dia</button>';
  else if(hour > 18) extra = '<button class="btn btn-sm" onclick="setCommand(\'Relatório de produtividade\')">📈 Produtividade</button>';
  else extra = '<button class="btn btn-sm" onclick="setCommand(\'Buscar prazos urgentes\')">🔥 Prazos urgentes</button>';
  
  // Keep original chips + add contextual
  container.innerHTML = `
    <button class="btn btn-sm" onclick="setCommand('Buscar cliente')">Buscar cliente</button>
    <button class="btn btn-sm" onclick="setCommand('Resumir processo')">Resumir processo</button>
    ${extra}
  `;
}


