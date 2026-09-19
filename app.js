/* =========================================================
   ETEEAP LEDGER — collections & student payment tracker
  Client-side app with shared ledger data and account profiles
  stored in Supabase.
   ========================================================= */

const STORAGE_KEY = "eteeapLedgerData_v1";
const SESSION_KEY = "eteeapLedgerSession_v1";
const USER_SETTINGS_KEY = "eteeapLedgerUserSettings_v1";
const supabaseClient = window.supabase && window.SUPABASE_CONFIG
  ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.publishableKey)
  : null;

function loadUserSettings(){
  try{ return JSON.parse(localStorage.getItem(USER_SETTINGS_KEY)) || {}; }
  catch(e){ return {}; }
}
function saveUserSettings(){
  localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(USER_SETTINGS));
}
function applyUserSettings(user){
  if(!user) return;
  const profile = USER_SETTINGS[user.username];
  if(profile?.display) user.display = profile.display;
  if(profile?.avatar) user.avatar = profile.avatar;
}
function applySupabaseProfile(user, authUser){
  const profile = authUser?.user_metadata || {};
  if(profile.display) user.display = profile.display;
  if(profile.avatar) user.avatar = profile.avatar;
}
function avatarMarkup(user){
  const initials = String(user.display || user.username || "?")
    .split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
  return user.avatar
    ? `<img src="${escapeHtml(user.avatar)}" alt="">`
    : `<span>${escapeHtml(initials)}</span>`;
}

/* ---------------- DATA LAYER ---------------- */
function defaultData(){
  return { students: [], payables: [], payments: [], auditLogs: [], editRequests: [] };
}

function loadLegacyData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    return Object.assign(defaultData(), parsed);
  }catch(e){
    console.error("Could not read legacy browser data.", e);
    return null;
  }
}

function saveData(){
  if(supabaseClient && CURRENT_USER?.id){
    sharedSaveChain = sharedSaveChain
      .then(()=>supabaseClient.from("ledger_state").upsert({
        id: 1,
        data: DB,
        updated_by: CURRENT_USER.id,
        updated_at: new Date().toISOString(),
      }))
      .then(({error})=>{
        if(error) console.error("Could not save shared ledger data.", error);
      })
      .catch(error=>console.error("Could not save shared ledger data.", error));
  }
  return sharedSaveChain;
}

async function loadSharedData(){
  if(!supabaseClient || !CURRENT_USER?.id) return;
  const legacyData = loadLegacyData();
  const {data, error} = await supabaseClient.from("ledger_state").select("data").eq("id", 1).maybeSingle();
  if(error){
    console.error("Could not load shared ledger data.", error);
    return;
  }
  if(data?.data){
    DB = Object.assign(defaultData(), data.data);
    localStorage.removeItem(STORAGE_KEY);
  } else if(legacyData && (legacyData.students.length || legacyData.payables.length || legacyData.payments.length || legacyData.auditLogs.length || legacyData.editRequests.length) && can("create")){
    DB = legacyData;
    await saveData();
    localStorage.removeItem(STORAGE_KEY);
  }
}

let sharedSaveChain = Promise.resolve();
let sharedStateChannel = null;

function subscribeToSharedData(){
  if(!supabaseClient || !CURRENT_USER?.id) return;
  sharedStateChannel = supabaseClient
    .channel("ledger-state-sync")
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "ledger_state",
      filter: "id=eq.1",
    }, payload=>{
      if(!payload.new?.data) return;
      DB = Object.assign(defaultData(), payload.new.data);
      render();
    })
    .subscribe(status=>{
      if(status === "CHANNEL_ERROR") console.error("Could not subscribe to shared ledger data.");
    });
}

let DB = defaultData();
let USER_SETTINGS = loadUserSettings();

function genId(prefix){
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

/* ---------------- SESSION ---------------- */
function getSession(){
  try{ return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }catch(e){ return null; }
}
function setSession(user){
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession(){
  sessionStorage.removeItem(SESSION_KEY);
}

let CURRENT_USER = getSession();
applyUserSettings(CURRENT_USER);

/* ---------------- APP STATE ---------------- */
let STATE = {
  view: "dashboard",
  studentId: null,
  studentTab: "summary",
  studentSearch: "",
};

/* ---------------- HELPERS ---------------- */
function peso(n){
  const v = Number(n)||0;
  return "₱" + v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso){
  if(!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" });
}
function fmtDateTime(iso){
  const d = new Date(iso);
  return d.toLocaleString("en-PH", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
}
function daysLeft(deadline){
  if(!deadline) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const dl = new Date(deadline); dl.setHours(0,0,0,0);
  return Math.round((dl - today) / 86400000);
}
function deadlineTag(deadline){
  if(!deadline) return `<span class="deadline-tag ok">No deadline set</span>`;
  const d = daysLeft(deadline);
  if(d < 0) return `<span class="deadline-tag overdue">Overdue by ${Math.abs(d)} day${Math.abs(d)===1?"":"s"}</span>`;
  if(d === 0) return `<span class="deadline-tag overdue">Due today</span>`;
  if(d <= 7) return `<span class="deadline-tag soon">${d} day${d===1?"":"s"} left</span>`;
  return `<span class="deadline-tag ok">${d} days left</span>`;
}
function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
}

/* ---------------- COMPUTED / QUERIES ---------------- */
function activePayments(){
  return DB.payments.filter(p => !p.deleted);
}
function paymentsFor(studentId, payableId){
  return activePayments().filter(p => p.studentId === studentId && p.payableId === payableId);
}
function paidAmount(studentId, payableId){
  return paymentsFor(studentId, payableId).reduce((s,p) => s + Number(p.amount), 0);
}
function remainingAmount(studentId, payableId){
  const payable = DB.payables.find(p => p.id === payableId);
  if(!payable) return 0;
  return Math.max(0, payable.amount - paidAmount(studentId, payableId));
}
function statusFor(studentId, payableId){
  const payable = DB.payables.find(p => p.id === payableId);
  if(!payable) return "unpaid";
  const paid = paidAmount(studentId, payableId);
  if(paid <= 0) return "unpaid";
  if(paid >= payable.amount) return "paid";
  return "partial";
}
function statusPill(status){
  const map = { paid:["Paid","pill-paid"], partial:["Partial","pill-partial"], unpaid:["Unpaid","pill-unpaid"] };
  const [label, cls] = map[status] || ["—","pill-neutral"];
  return `<span class="pill ${cls}">${label}</span>`;
}
function totalCollectedForPayable(payableId){
  return activePayments().filter(p => p.payableId === payableId).reduce((s,p)=>s+Number(p.amount),0);
}
function totalExpectedForPayable(payableId){
  const payable = DB.payables.find(p=>p.id===payableId);
  if(!payable) return 0;
  return payable.amount * DB.students.length;
}
function studentTotalDue(studentId){
  return DB.payables.reduce((s,p)=>s+Number(p.amount),0);
}
function studentTotalPaid(studentId){
  return activePayments().filter(p=>p.studentId===studentId).reduce((s,p)=>s+Number(p.amount),0);
}
function pendingEditRequestCount(){
  return DB.editRequests.filter(r=>r.status==="pending").length;
}

/* ---------------- AUDIT LOG ---------------- */
function addAuditLog(action, details){
  DB.auditLogs.unshift({
    id: genId("log"),
    timestamp: new Date().toISOString(),
    user: CURRENT_USER.username,
    role: CURRENT_USER.role,
    action,
    details,
  });
  saveData();
}

/* ---------------- PERMISSIONS ---------------- */
function can(action){
  const role = CURRENT_USER?.role;
  const perms = {
    admin:     ["create","edit","delete","pay","approve","viewAudit","manageSettings"],
    treasurer: ["create","edit","pay","requestEdit","manageSettings"],
    viewer:    [],
  };
  return (perms[role]||[]).includes(action);
}

/* =========================================================
   RENDER: SHELL / NAV
   ========================================================= */
const NAV_ITEMS = [
  { key:"dashboard", label:"Dashboard", roles:["admin","treasurer","viewer"] },
  { key:"students",  label:"Students",  roles:["admin","treasurer","viewer"] },
  { key:"payables",  label:"Payables",  roles:["admin","treasurer","viewer"] },
  { key:"requests",  label:"Edit requests", roles:["admin","treasurer"], badge:true },
  { key:"audit",     label:"Audit log", roles:["admin"] },
];

function renderShell(){
  document.getElementById("whoami-name").textContent = CURRENT_USER.display;
  document.getElementById("whoami-role").textContent = CURRENT_USER.role;
  const avatar = document.getElementById("whoami-avatar");
  if(avatar) avatar.innerHTML = avatarMarkup(CURRENT_USER);
  const accountAction = document.getElementById("account-settings-action");
  if(accountAction) accountAction.hidden = !can("manageSettings");

  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = NAV_ITEMS.filter(i=>i.roles.includes(CURRENT_USER.role)).map(item=>{
    const badgeCount = item.badge ? pendingEditRequestCount() : 0;
    const badge = badgeCount > 0 ? `<span class="nav-badge">${badgeCount}</span>` : "";
    return `<button class="nav-item ${STATE.view===item.key?"active":""}" data-nav="${item.key}">
      <span>${item.label}</span>${badge}
    </button>`;
  }).join("");
}

function setView(view, extra){
  STATE.view = view;
  if(extra) Object.assign(STATE, extra);
  render();
}

/* =========================================================
   RENDER: ROUTER
   ========================================================= */
function render(){
  renderShell();
  const root = document.getElementById("view-root");
  const title = document.getElementById("view-title");
  const actions = document.getElementById("topbar-actions");
  actions.innerHTML = "";

  if(STATE.view === "dashboard"){ title.textContent = "Dashboard"; root.innerHTML = renderDashboard(); }
  else if(STATE.view === "students"){ title.textContent = "Students"; root.innerHTML = renderStudentsList(); renderStudentsActions(actions); }
  else if(STATE.view === "student-detail"){ title.textContent = "Student profile"; root.innerHTML = renderStudentDetail(STATE.studentId); }
  else if(STATE.view === "payables"){ title.textContent = "Payables"; root.innerHTML = renderPayables(); renderPayablesActions(actions); }
  else if(STATE.view === "requests"){ title.textContent = "Edit requests"; root.innerHTML = renderEditRequests(); }
  else if(STATE.view === "audit"){ title.textContent = "Audit log"; root.innerHTML = renderAuditLog(); }

  attachViewListeners();
}

/* =========================================================
   DASHBOARD
   ========================================================= */
function renderDashboard(){
  const totalStudents = DB.students.length;
  const totalPayables = DB.payables.length;
  const totalExpected = DB.payables.reduce((s,p)=>s+totalExpectedForPayable(p.id),0);
  const totalCollected = activePayments().reduce((s,p)=>s+Number(p.amount),0);
  const outstanding = Math.max(0, totalExpected - totalCollected);

  const payableRows = DB.payables.map(p=>{
    const collected = totalCollectedForPayable(p.id);
    const expected = totalExpectedForPayable(p.id);
    const pct = expected > 0 ? Math.round((collected/expected)*100) : 0;
    return `<tr>
      <td><span class="row-link" data-goto-payable="${p.id}">${escapeHtml(p.name)}</span></td>
      <td class="num">${peso(p.amount)}</td>
      <td>${deadlineTag(p.deadline)}</td>
      <td class="num">${peso(collected)} <span style="color:var(--text-dim)">/ ${peso(expected)}</span></td>
      <td style="width:120px;">
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(pct,100)}%"></div></div>
        <span style="font-size:11.5px;color:var(--text-dim);">${pct}%</span>
      </td>
    </tr>`;
  }).join("") || `<tr class="empty-row"><td colspan="5">No payables yet. ${can("create") ? "Create one from the Payables page." : ""}</td></tr>`;

  return `
    <div class="stat-row">
      <div class="stat-card"><div class="label">Students enrolled</div><div class="value">${totalStudents}</div></div>
      <div class="stat-card"><div class="label">Active payables</div><div class="value">${totalPayables}</div></div>
      <div class="stat-card forest"><div class="label">Total collected</div><div class="value">${peso(totalCollected)}</div></div>
      <div class="stat-card rust"><div class="label">Outstanding balance</div><div class="value">${peso(outstanding)}</div></div>
    </div>

    <div class="section">
      <div class="section-head">
        <h3>Collections by payable</h3>
        <span class="hint">Updates automatically as payables and payments are added</span>
      </div>
      <div class="ledger">
        <table>
          <thead><tr><th>Payable</th><th>Price</th><th>Deadline</th><th>Collected / Expected</th><th>Progress</th></tr></thead>
          <tbody>${payableRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* =========================================================
   STUDENTS — LIST
   ========================================================= */
function renderStudentsActions(actions){
  if(can("create")){
    actions.innerHTML = `<button class="btn btn-brass" data-open-modal="add-student">+ Add student</button>`;
  }
}

function renderStudentsList(){
  const search = STATE.studentSearch.trim().toLowerCase();
  const list = DB.students
    .filter(s => !search || s.name.toLowerCase().includes(search) || (s.program||"").toLowerCase().includes(search))
    .sort((a,b)=>a.name.localeCompare(b.name));

  const rows = list.map(s=>{
    const due = studentTotalDue(s.id);
    const paid = studentTotalPaid(s.id);
    const pct = due>0 ? Math.round((paid/due)*100) : 0;
    const status = paid>=due && due>0 ? "paid" : paid>0 ? "partial" : "unpaid";
    return `<tr>
      <td><span class="row-link" data-open-student="${s.id}">${escapeHtml(s.name)}</span><div style="font-size:12px;color:var(--text-dim)">${escapeHtml(s.program||"")}</div></td>
      <td class="num">${peso(paid)}</td>
      <td class="num">${peso(due)}</td>
      <td>${statusPill(status)}</td>
      <td style="width:110px;">
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(pct,100)}%"></div></div>
      </td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm" data-open-student="${s.id}">Open</button>
      </td>
    </tr>`;
  }).join("") || `<tr class="empty-row"><td colspan="6">No students match yet.</td></tr>`;

  return `
    <div class="section-head">
      <div class="field" style="margin:0;max-width:280px;">
        <input type="text" id="student-search" placeholder="Search by name or program…" value="${escapeHtml(STATE.studentSearch)}">
      </div>
      <span class="hint">${DB.students.length} student${DB.students.length===1?"":"s"} on record</span>
    </div>
    <div class="ledger">
      <table>
        <thead><tr><th>Name</th><th>Paid</th><th>Total due</th><th>Status</th><th>Progress</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* =========================================================
   STUDENT — DETAIL
   ========================================================= */
function renderStudentDetail(studentId){
  const student = DB.students.find(s=>s.id===studentId);
  if(!student){
    return `<p>Student not found. <a class="back-link" data-nav="students">Back to students</a></p>`;
  }
  const due = studentTotalDue(studentId);
  const paid = studentTotalPaid(studentId);
  const pct = due>0 ? Math.round((paid/due)*100) : 0;

  const tabs = `
    <div class="tabs">
      <button class="tab-btn ${STATE.studentTab==="summary"?"active":""}" data-student-tab="summary">Payables summary</button>
      <button class="tab-btn ${STATE.studentTab==="history"?"active":""}" data-student-tab="history">Payment history</button>
    </div>`;

  let body = "";
  if(STATE.studentTab === "history"){
    const payments = activePayments().filter(p=>p.studentId===studentId).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const rows = payments.map(p=>{
      const payable = DB.payables.find(pb=>pb.id===p.payableId);
      const requested = DB.editRequests.find(r=>r.paymentId===p.id && r.status==="pending");
      let rowActions = "";
      if(can("delete")){
        rowActions = `<button class="btn btn-ghost btn-sm" data-edit-payment="${p.id}">Edit</button>
                      <button class="btn btn-danger btn-sm" data-delete-payment="${p.id}">Delete</button>`;
      } else if(can("requestEdit")){
        rowActions = requested
          ? `<span class="pill pill-neutral">Edit requested</span>`
          : `<button class="btn btn-ghost btn-sm" data-request-edit="${p.id}">Request edit</button>`;
      }
      return `<tr>
        <td>${fmtDate(p.date)}</td>
        <td>${escapeHtml(payable ? payable.name : "(payable removed)")}</td>
        <td class="num">${peso(p.amount)}</td>
        <td><span class="pill ${p.method==="full"?"pill-paid":"pill-partial"}">${p.method==="full"?"Full":"Partial"}</span></td>
        <td>${escapeHtml(p.recordedBy)}</td>
        <td>${escapeHtml(p.note||"—")}</td>
        <td class="actions-cell">${rowActions}</td>
      </tr>`;
    }).join("") || `<tr class="empty-row"><td colspan="7">No payments recorded yet.</td></tr>`;

    body = `<div class="ledger"><table>
      <thead><tr><th>Date</th><th>Payable</th><th>Amount</th><th>Type</th><th>Recorded by</th><th>Note</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  } else {
    const rows = DB.payables.map(pb=>{
      const paidAmt = paidAmount(studentId, pb.id);
      const rem = remainingAmount(studentId, pb.id);
      const status = statusFor(studentId, pb.id);
      return `<tr>
        <td>${escapeHtml(pb.name)}</td>
        <td class="num">${peso(pb.amount)}</td>
        <td class="num">${peso(paidAmt)}</td>
        <td class="num">${peso(rem)}</td>
        <td>${statusPill(status)}</td>
        <td>${deadlineTag(pb.deadline)}</td>
        <td class="actions-cell">
          ${can("pay") ? `<button class="btn btn-brass btn-sm" data-record-payment="${pb.id}" data-for-student="${studentId}" ${status==="paid"?"disabled":""}>Record payment</button>` : ""}
        </td>
      </tr>`;
    }).join("") || `<tr class="empty-row"><td colspan="7">No payables have been created yet.</td></tr>`;

    body = `<div class="ledger"><table>
      <thead><tr><th>Payable</th><th>Price</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Deadline</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  return `
    <a class="back-link" data-nav="students">&larr; Back to students</a>
    <div class="student-header">
      <div>
        <h3 style="font-size:22px;">${escapeHtml(student.name)}</h3>
        <p class="idline">${escapeHtml(student.program||"No program on file")} ${student.contact ? " · " + escapeHtml(student.contact) : ""}</p>
        <div class="progress-track" style="width:220px;"><div class="progress-fill" style="width:${Math.min(pct,100)}%"></div></div>
        <p class="idline">${peso(paid)} paid of ${peso(due)} total (${pct}%)</p>
      </div>
      <div class="topbar-actions">
        ${STATE.studentTab === "history" ? `<button class="btn btn-ghost btn-sm" data-print-history="${student.id}" title="Print or save this history as a PDF">Print / Save PDF</button>` : ""}
        ${can("edit") ? `<button class="btn btn-ghost btn-sm" data-open-modal="edit-student" data-student-id="${student.id}">Edit profile</button>` : ""}
        ${can("delete") ? `<button class="btn btn-danger btn-sm" data-delete-student="${student.id}">Delete</button>` : ""}
      </div>
    </div>
    ${tabs}
    ${body}
  `;
}

function printStudentHistory(studentId){
  const student = DB.students.find(s=>s.id===studentId);
  if(!student) return;
  const payments = activePayments()
    .filter(p=>p.studentId===studentId)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total = payments.reduce((sum,p)=>sum+Number(p.amount),0);
  const rows = payments.map(payment=>{
    const payable = DB.payables.find(item=>item.id===payment.payableId);
    return `<tr>
      <td>${escapeHtml(fmtDate(payment.date))}</td>
      <td>${escapeHtml(payable?.name || "(payable removed)")}</td>
      <td class="amount">${escapeHtml(peso(payment.amount))}</td>
      <td>${payment.method === "full" ? "Full" : "Partial"}</td>
      <td>${escapeHtml(payment.recordedBy || "—")}</td>
      <td>${escapeHtml(payment.note || "—")}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="empty">No payments recorded yet.</td></tr>`;
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if(!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Payment history - ${escapeHtml(student.name)}</title>
    <style>
      @page{size:A4;margin:16mm}
      *{box-sizing:border-box}body{margin:0;padding:40px;color:#1D2129;font:13px Arial,sans-serif}
      header{border-bottom:2px solid #35505E;padding-bottom:18px;margin-bottom:24px}
      .eyebrow{color:#667085;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 8px}
      h1{font-size:25px;margin:0 0 6px}p{margin:4px 0;color:#667085}.summary{display:flex;gap:36px;margin:0 0 20px}.summary strong{display:block;color:#1D2129;font-size:18px;margin-top:4px}
      table{border-collapse:collapse;width:100%}th{text-align:left;background:#F0F2F5;color:#667085;font-size:11px;font-weight:600;padding:10px;border-bottom:1px solid #D2D6DC}td{padding:11px 10px;border-bottom:1px solid #E4E6EA}td.amount{font-weight:600;text-align:right}.empty{text-align:center;color:#667085;padding:30px}
      @media print{body{padding:0}}
    </style></head><body>
    <header><p class="eyebrow">ETEEAP student collections</p><h1>${escapeHtml(student.name)}</h1><p>${escapeHtml(student.program || "No program on file")}</p></header>
    <div class="summary"><div>Total payments<strong>${payments.length}</strong></div><div>Total collected<strong>${escapeHtml(peso(total))}</strong></div></div>
    <table><thead><tr><th>Date</th><th>Payable</th><th>Amount</th><th>Type</th><th>Recorded by</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
  printWindow.document.close();
  printWindow.addEventListener("load", ()=>{
    printWindow.focus();
    printWindow.print();
  });
}

/* =========================================================
   PAYABLES
   ========================================================= */
function renderPayablesActions(actions){
  if(can("create")){
    actions.innerHTML = `<button class="btn btn-brass" data-open-modal="add-payable">+ Add payable</button>`;
  }
}

function renderPayables(){
  const cards = DB.payables.map(p=>{
    const collected = totalCollectedForPayable(p.id);
    const expected = totalExpectedForPayable(p.id);
    return `<div class="payable-card">
      <h4>${escapeHtml(p.name)}</h4>
      <div class="amount">${peso(p.amount)}</div>
      <div class="meta">${deadlineTag(p.deadline)}</div>
      <div class="meta">Collected: ${peso(collected)} of ${peso(expected)} expected</div>
      <div class="foot">
        ${can("edit") ? `<button class="btn btn-ghost btn-sm" data-open-modal="edit-payable" data-payable-id="${p.id}">Edit</button>` : `<span></span>`}
        ${can("delete") ? `<button class="btn btn-danger btn-sm" data-delete-payable="${p.id}">Delete</button>` : ""}
      </div>
    </div>`;
  }).join("") || `<p class="hint">No payables yet. ${can("create") ? "Add the first one — it will apply to every student automatically." : "Ask an admin or treasurer to add one."}</p>`;

  return `
    <p class="hint" style="margin-bottom:16px;display:block;">Adding a payable here applies it to every current and future student automatically — no per-student setup needed.</p>
    <div class="payable-grid">${cards}</div>
  `;
}

/* =========================================================
   EDIT REQUESTS (admin approves, treasurer files)
   ========================================================= */
function renderEditRequests(){
  const mine = CURRENT_USER.role === "treasurer";
  const list = DB.editRequests
    .filter(r => mine ? r.requestedBy === CURRENT_USER.username : true)
    .sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));

  const rows = list.map(r=>{
    const payment = DB.payments.find(p=>p.id===r.paymentId);
    const student = payment ? DB.students.find(s=>s.id===payment.studentId) : null;
    const payable = payment ? DB.payables.find(pb=>pb.id===payment.payableId) : null;
    let actionsCell = `<span class="pill pill-neutral">Resolved</span>`;
    if(r.status === "pending"){
      actionsCell = CURRENT_USER.role === "admin"
        ? `<button class="btn btn-ghost btn-sm" data-review-request="${r.id}">Review</button>`
        : `<span class="pill pill-partial">Awaiting admin</span>`;
    }
    return `<tr>
      <td>${fmtDateTime(r.timestamp)}</td>
      <td>${escapeHtml(student ? student.name : "—")}</td>
      <td>${escapeHtml(payable ? payable.name : "—")}</td>
      <td class="num">${payment ? peso(payment.amount) : "—"}</td>
      <td>${escapeHtml(r.note)}</td>
      <td>${escapeHtml(r.requestedBy)}</td>
      <td class="actions-cell">${actionsCell}</td>
    </tr>`;
  }).join("") || `<tr class="empty-row"><td colspan="7">No edit requests filed.</td></tr>`;

  return `
    <p class="hint" style="display:block;margin-bottom:16px;">
      ${CURRENT_USER.role==="admin" ? "Review requests filed by the treasurer for corrections to recorded payments." : "Requests you file here are sent to the admin to correct a payment entered in error."}
    </p>
    <div class="ledger"><table>
      <thead><tr><th>Filed</th><th>Student</th><th>Payable</th><th>Amount</th><th>Reason</th><th>Filed by</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  `;
}

/* =========================================================
   AUDIT LOG (admin only)
   ========================================================= */
function renderAuditLog(){
  const rows = DB.auditLogs.map(l=>`
    <tr>
      <td>${fmtDateTime(l.timestamp)}</td>
      <td>${escapeHtml(l.user)} <span class="pill pill-neutral">${escapeHtml(l.role)}</span></td>
      <td>${escapeHtml(l.action)}</td>
      <td>${escapeHtml(l.details)}</td>
    </tr>`).join("") || `<tr class="empty-row"><td colspan="4">No activity recorded yet.</td></tr>`;

  return `
    <p class="hint" style="display:block;margin-bottom:16px;">Every edit, deletion, and approval performed in the ledger is recorded here permanently.</p>
    <div class="ledger"><table>
      <thead><tr><th>When</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  `;
}

/* =========================================================
   MODALS
   ========================================================= */
function openModal(html){
  document.getElementById("modal-root").innerHTML = `<div class="modal-backdrop" id="modal-backdrop">${html}</div>`;
}
function closeModal(){
  document.getElementById("modal-root").innerHTML = "";
}

function modalUserSettings(){
  if(!can("manageSettings")) return;
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Account settings</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <div class="settings-profile-preview">
        <span id="settings-avatar-preview" class="account-avatar account-avatar-large" aria-hidden="true">${avatarMarkup(CURRENT_USER)}</span>
        <div><strong>${escapeHtml(CURRENT_USER.username)}</strong><span>${escapeHtml(CURRENT_USER.role)}</span></div>
      </div>
      <form id="form-user-settings">
        <label class="field"><span>Display name</span><input type="text" id="settings-display-name" value="${escapeHtml(CURRENT_USER.display)}" maxlength="80" required></label>
        <label class="field"><span>Display picture</span><input type="file" id="settings-avatar" accept="image/png,image/jpeg,image/webp"></label>
        <p class="hint" style="display:block;margin-top:-8px;margin-bottom:14px;">Your profile is saved to your account.</p>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Save settings</button>
        </div>
      </form>
    </div>
  `);
  const avatarInput = document.getElementById("settings-avatar");
  avatarInput.addEventListener("change", ()=>{
    const file = avatarInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      document.getElementById("settings-avatar-preview").innerHTML = `<img src="${escapeHtml(reader.result)}" alt="">`;
    };
    reader.readAsDataURL(file);
  });
  document.getElementById("form-user-settings").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const display = document.getElementById("settings-display-name").value.trim();
    if(!display) return;
    const profile = USER_SETTINGS[CURRENT_USER.username] || {};
    const finish = async avatar=>{
      const savedAvatar = avatar || profile.avatar || CURRENT_USER.avatar || null;
      if(!supabaseClient){
        alert("Supabase is not configured. Your profile could not be saved.");
        return;
      }
      const {data, error} = await supabaseClient.auth.updateUser({
        data: { display, avatar: savedAvatar },
      });
      if(error || !data.user){
        console.error("Could not save account settings.", error);
        alert(error?.message || "Could not save account settings.");
        return;
      }
      USER_SETTINGS[CURRENT_USER.username] = { display, avatar: savedAvatar };
      CURRENT_USER.display = display;
      CURRENT_USER.avatar = savedAvatar;
      saveUserSettings();
      setSession(CURRENT_USER);
      addAuditLog("Updated account settings", `Updated profile for "${CURRENT_USER.username}"`);
      closeModal();
      render();
    };
    const file = avatarInput.files[0];
    if(!file){ finish(null); return; }
    if(file.size > 512 * 1024){
      alert("Please choose an image smaller than 512 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = ()=>finish(reader.result);
    reader.readAsDataURL(file);
  });
}

function modalAddStudent(){
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Add student</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <form id="form-add-student">
        <label class="field"><span>Full name</span><input type="text" id="s-name" required></label>
        <label class="field"><span>Program / batch (optional)</span><input type="text" id="s-program" placeholder="e.g. ETEEAP Batch 2026"></label>
        <label class="field"><span>Contact number / email (optional)</span><input type="text" id="s-contact"></label>
        <p class="hint" style="display:block;margin-bottom:14px;">Every existing payable will automatically apply to this student.</p>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-brass">Add student</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById("form-add-student").addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = document.getElementById("s-name").value.trim();
    if(!name) return;
    const student = {
      id: genId("stu"),
      name,
      program: document.getElementById("s-program").value.trim(),
      contact: document.getElementById("s-contact").value.trim(),
      dateAdded: new Date().toISOString(),
    };
    DB.students.push(student);
    addAuditLog("Created student", `Added profile for "${name}"`);
    saveData();
    closeModal();
    setView("students");
  });
}

function modalEditStudent(studentId){
  const student = DB.students.find(s=>s.id===studentId);
  if(!student) return;
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Edit student</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <form id="form-edit-student">
        <label class="field"><span>Full name</span><input type="text" id="s-name" value="${escapeHtml(student.name)}" required></label>
        <label class="field"><span>Program / batch</span><input type="text" id="s-program" value="${escapeHtml(student.program||"")}"></label>
        <label class="field"><span>Contact number / email</span><input type="text" id="s-contact" value="${escapeHtml(student.contact||"")}"></label>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-brass">Save changes</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById("form-edit-student").addEventListener("submit", (e)=>{
    e.preventDefault();
    const before = JSON.stringify(student);
    student.name = document.getElementById("s-name").value.trim();
    student.program = document.getElementById("s-program").value.trim();
    student.contact = document.getElementById("s-contact").value.trim();
    if(before !== JSON.stringify(student)){
      addAuditLog("Edited student", `Updated profile for "${student.name}"`);
      saveData();
    }
    closeModal();
    render();
  });
}

function modalAddPayable(){
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Add payable</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <form id="form-add-payable">
        <label class="field"><span>Payable name</span><input type="text" id="p-name" placeholder="e.g. Cebu Tour" required></label>
        <label class="field"><span>Price (₱)</span><input type="number" id="p-amount" min="0" step="0.01" required></label>
        <label class="field"><span>Payment deadline (optional)</span><input type="date" id="p-deadline"></label>
        <p class="hint" style="display:block;margin-bottom:14px;">This will automatically apply to all ${DB.students.length} current student${DB.students.length===1?"":"s"} and any added later.</p>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-brass">Add payable</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById("form-add-payable").addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = document.getElementById("p-name").value.trim();
    const amount = parseFloat(document.getElementById("p-amount").value);
    if(!name || isNaN(amount)) return;
    DB.payables.push({
      id: genId("pay"),
      name,
      amount,
      deadline: document.getElementById("p-deadline").value || null,
      dateAdded: new Date().toISOString(),
    });
    addAuditLog("Created payable", `Added payable "${name}" at ${peso(amount)}`);
    saveData();
    closeModal();
    setView("payables");
  });
}

function modalEditPayable(payableId){
  const payable = DB.payables.find(p=>p.id===payableId);
  if(!payable) return;
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Edit payable</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <form id="form-edit-payable">
        <label class="field"><span>Payable name</span><input type="text" id="p-name" value="${escapeHtml(payable.name)}" required></label>
        <label class="field"><span>Price (₱)</span><input type="number" id="p-amount" min="0" step="0.01" value="${payable.amount}" required></label>
        <label class="field"><span>Payment deadline</span><input type="date" id="p-deadline" value="${payable.deadline||""}"></label>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-brass">Save changes</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById("form-edit-payable").addEventListener("submit", (e)=>{
    e.preventDefault();
    const before = JSON.stringify(payable);
    payable.name = document.getElementById("p-name").value.trim();
    payable.amount = parseFloat(document.getElementById("p-amount").value);
    payable.deadline = document.getElementById("p-deadline").value || null;
    if(before !== JSON.stringify(payable)){
      addAuditLog("Edited payable", `Updated payable "${payable.name}"`);
      saveData();
    }
    closeModal();
    render();
  });
}

function modalRecordPayment(studentId, payableId){
  const student = DB.students.find(s=>s.id===studentId);
  const payable = DB.payables.find(p=>p.id===payableId);
  if(!student || !payable) return;
  const remaining = remainingAmount(studentId, payableId);
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Record payment</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <p class="hint" style="display:block;margin-bottom:16px;">${escapeHtml(student.name)} — ${escapeHtml(payable.name)}. Remaining balance: <strong>${peso(remaining)}</strong></p>
      <form id="form-record-payment">
        <label class="field"><span>Amount received (₱)</span><input type="number" id="pay-amount" min="0.01" step="0.01" max="${remaining}" value="${remaining}" required></label>
        <label class="field"><span>Date received</span><input type="date" id="pay-date" value="${new Date().toISOString().slice(0,10)}" required></label>
        <label class="field"><span>Note (optional)</span><input type="text" id="pay-note" placeholder="e.g. cash, GCash ref #"></label>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-brass">Save payment</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById("form-record-payment").addEventListener("submit", (e)=>{
    e.preventDefault();
    let amount = parseFloat(document.getElementById("pay-amount").value);
    if(isNaN(amount) || amount <= 0) return;
    if(amount > remaining) amount = remaining;
    const method = amount >= remaining ? "full" : "partial";
    DB.payments.push({
      id: genId("pmt"),
      studentId, payableId, amount, method,
      date: document.getElementById("pay-date").value,
      note: document.getElementById("pay-note").value.trim(),
      recordedBy: CURRENT_USER.username,
      deleted: false,
    });
    addAuditLog("Recorded payment", `${peso(amount)} (${method}) from "${student.name}" for "${payable.name}"`);
    saveData();
    closeModal();
    render();
  });
}

function modalEditPayment(paymentId, requestId=null){
  const payment = DB.payments.find(p=>p.id===paymentId);
  if(!payment) return;
  const payable = DB.payables.find(p=>p.id===payment.payableId);
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Edit payment</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <p class="hint" style="display:block;margin-bottom:16px;">Admin override — this bypasses the treasurer edit-request flow.</p>
      <form id="form-edit-payment">
        <label class="field"><span>Amount (₱)</span><input type="number" id="pay-amount" min="0.01" step="0.01" value="${payment.amount}" required></label>
        <label class="field"><span>Date</span><input type="date" id="pay-date" value="${payment.date}" required></label>
        <label class="field"><span>Note</span><input type="text" id="pay-note" value="${escapeHtml(payment.note||"")}"></label>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-brass">Save changes</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById("form-edit-payment").addEventListener("submit", (e)=>{
    e.preventDefault();
    const before = `${peso(payment.amount)} on ${fmtDate(payment.date)}`;
    payment.amount = parseFloat(document.getElementById("pay-amount").value);
    payment.date = document.getElementById("pay-date").value;
    payment.note = document.getElementById("pay-note").value.trim();
    const paidNow = paidAmount(payment.studentId, payment.payableId);
    payment.method = payable && paidNow >= payable.amount ? "full" : "partial";
    addAuditLog("Edited payment", `Changed payment from ${before} to ${peso(payment.amount)} on ${fmtDate(payment.date)}`);
    if(requestId){
      const request = DB.editRequests.find(r=>r.id===requestId);
      if(request) request.status = "approved";
      addAuditLog("Approved edit request", `Approved correction requested by "${request?.requestedBy||"?"}"`);
    }
    saveData();
    closeModal();
    render();
  });
}

function modalRequestEdit(paymentId){
  const payment = DB.payments.find(p=>p.id===paymentId);
  if(!payment) return;
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Request a correction</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <p class="hint" style="display:block;margin-bottom:16px;">This sends a note to the admin. It does not change the record — only an admin can finalize the correction.</p>
      <form id="form-request-edit">
        <label class="field"><span>What needs correcting?</span><textarea id="req-note" rows="3" required placeholder="e.g. Entered ₱500 instead of ₱1,000 for cash payment on this date."></textarea></label>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-brass">Send request</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById("form-request-edit").addEventListener("submit", (e)=>{
    e.preventDefault();
    const note = document.getElementById("req-note").value.trim();
    if(!note) return;
    DB.editRequests.push({
      id: genId("req"),
      paymentId,
      requestedBy: CURRENT_USER.username,
      note,
      timestamp: new Date().toISOString(),
      status: "pending",
    });
    addAuditLog("Filed edit request", `Requested correction on a payment (${peso(payment.amount)})`);
    saveData();
    closeModal();
    render();
  });
}

function modalReviewRequest(requestId){
  const req = DB.editRequests.find(r=>r.id===requestId);
  if(!req) return;
  const payment = DB.payments.find(p=>p.id===req.paymentId);
  const student = payment ? DB.students.find(s=>s.id===payment.studentId) : null;
  const payable = payment ? DB.payables.find(p=>p.id===payment.payableId) : null;
  openModal(`
    <div class="modal">
      <div class="modal-head"><h3>Review request</h3><button class="modal-close" data-close-modal>&times;</button></div>
      <p class="hint" style="display:block;">Filed by <strong>${escapeHtml(req.requestedBy)}</strong> on ${fmtDateTime(req.timestamp)}</p>
      <p style="margin:12px 0;font-size:13.5px;"><strong>Reason:</strong> ${escapeHtml(req.note)}</p>
      ${payment ? `<div class="banner">${escapeHtml(student?.name||"—")} — ${escapeHtml(payable?.name||"—")}: currently <strong>${peso(payment.amount)}</strong> on ${fmtDate(payment.date)}</div>` : `<div class="banner rust">The related payment no longer exists.</div>`}
      <div class="modal-foot" style="justify-content:space-between;">
        <button type="button" class="btn btn-ghost" data-close-modal>Close</button>
        <div style="display:flex;gap:10px;">
          ${payment ? `<button class="btn btn-ghost" data-approve-edit="${req.id}" data-payment-id="${payment.id}">Edit payment</button>` : ""}
          ${payment ? `<button class="btn btn-danger" data-approve-delete="${req.id}" data-payment-id="${payment.id}">Delete payment</button>` : ""}
          <button class="btn btn-brass" data-resolve-request="${req.id}">Dismiss request</button>
        </div>
      </div>
    </div>
  `);
}

/* =========================================================
   DELETE HANDLERS
   ========================================================= */
function deleteStudent(studentId){
  const student = DB.students.find(s=>s.id===studentId);
  if(!student) return;
  if(!confirm(`Delete ${student.name}'s profile and all their payment records? This cannot be undone.`)) return;
  DB.students = DB.students.filter(s=>s.id!==studentId);
  DB.payments = DB.payments.filter(p=>p.studentId!==studentId);
  addAuditLog("Deleted student", `Removed profile and payment records for "${student.name}"`);
  saveData();
  setView("students");
}
function deletePayable(payableId){
  const payable = DB.payables.find(p=>p.id===payableId);
  if(!payable) return;
  if(!confirm(`Delete "${payable.name}"? This also removes all recorded payments for it, for every student.`)) return;
  DB.payables = DB.payables.filter(p=>p.id!==payableId);
  DB.payments = DB.payments.filter(p=>p.payableId!==payableId);
  addAuditLog("Deleted payable", `Removed payable "${payable.name}"`);
  saveData();
  setView("payables");
}
function deletePayment(paymentId, requestId=null){
  const payment = DB.payments.find(p=>p.id===paymentId);
  if(!payment) return;
  if(!confirm("Delete this payment record? This cannot be undone.")) return;
  const student = DB.students.find(s=>s.id===payment.studentId);
  const payable = DB.payables.find(p=>p.id===payment.payableId);
  DB.payments = DB.payments.filter(p=>p.id!==paymentId);
  addAuditLog("Deleted payment", `Removed ${peso(payment.amount)} payment from "${student?.name||"?"}" for "${payable?.name||"?"}"`);
  if(requestId){
    const request = DB.editRequests.find(r=>r.id===requestId);
    if(request) request.status = "approved";
    addAuditLog("Approved edit request", `Approved deletion requested by "${request?.requestedBy||"?"}"`);
  }
  saveData();
  closeModal();
  render();
}

/* =========================================================
   EVENT WIRING
   ========================================================= */
function attachViewListeners(){
  document.querySelectorAll("[data-nav]").forEach(el=>{
    el.addEventListener("click", ()=> setView(el.dataset.nav));
  });
  document.querySelectorAll("[data-open-student]").forEach(el=>{
    el.addEventListener("click", ()=> setView("student-detail", { studentId: el.dataset.openStudent, studentTab: "summary" }));
  });
  document.querySelectorAll("[data-print-history]").forEach(el=>{
    el.addEventListener("click", ()=> printStudentHistory(el.dataset.printHistory));
  });
  document.querySelectorAll("[data-goto-payable]").forEach(el=>{
    el.addEventListener("click", ()=> setView("payables"));
  });
  document.querySelectorAll("[data-student-tab]").forEach(el=>{
    el.addEventListener("click", ()=> { STATE.studentTab = el.dataset.studentTab; render(); });
  });

  const searchBox = document.getElementById("student-search");
  if(searchBox){
    searchBox.addEventListener("input", (e)=>{ STATE.studentSearch = e.target.value; render(); searchBox2Focus(); });
  }

  document.querySelectorAll("[data-open-modal]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const kind = el.dataset.openModal;
      if(kind === "add-student") modalAddStudent();
      if(kind === "edit-student") modalEditStudent(el.dataset.studentId);
      if(kind === "add-payable") modalAddPayable();
      if(kind === "edit-payable") modalEditPayable(el.dataset.payableId);
      if(kind === "user-settings") modalUserSettings();
    });
  });
  document.querySelectorAll("[data-record-payment]").forEach(el=>{
    el.addEventListener("click", ()=> modalRecordPayment(el.dataset.forStudent, el.dataset.recordPayment));
  });
  document.querySelectorAll("[data-edit-payment]").forEach(el=>{
    el.addEventListener("click", ()=> modalEditPayment(el.dataset.editPayment));
  });
  document.querySelectorAll("[data-approve-edit]").forEach(el=>{
    el.addEventListener("click", ()=> modalEditPayment(el.dataset.paymentId, el.dataset.approveEdit));
  });
  document.querySelectorAll("[data-delete-payment]").forEach(el=>{
    el.addEventListener("click", ()=> deletePayment(el.dataset.deletePayment));
  });
  document.querySelectorAll("[data-approve-delete]").forEach(el=>{
    el.addEventListener("click", ()=> deletePayment(el.dataset.paymentId, el.dataset.approveDelete));
  });
  document.querySelectorAll("[data-request-edit]").forEach(el=>{
    el.addEventListener("click", ()=> modalRequestEdit(el.dataset.requestEdit));
  });
  document.querySelectorAll("[data-delete-student]").forEach(el=>{
    el.addEventListener("click", ()=> deleteStudent(el.dataset.deleteStudent));
  });
  document.querySelectorAll("[data-delete-payable]").forEach(el=>{
    el.addEventListener("click", ()=> deletePayable(el.dataset.deletePayable));
  });
  document.querySelectorAll("[data-review-request]").forEach(el=>{
    el.addEventListener("click", ()=> modalReviewRequest(el.dataset.reviewRequest));
  });

  document.querySelectorAll("[data-close-modal]").forEach(el=>{
    el.addEventListener("click", closeModal);
  });
}

// Keep focus on search input across re-renders while typing
function searchBox2Focus(){
  const el = document.getElementById("student-search");
  if(el){ const val = el.value; el.focus(); el.setSelectionRange(val.length, val.length); }
}

// Delegated handlers for request actions rendered inside the dynamic review modal.
document.addEventListener("click", (e)=>{
  const closeButton = e.target.closest("[data-close-modal]");
  if(closeButton){
    closeModal();
    return;
  }

  const approveEdit = e.target.closest("[data-approve-edit]");
  const approveDelete = e.target.closest("[data-approve-delete]");
  const btn = e.target.closest("[data-resolve-request]");
  if(CURRENT_USER?.role !== "admin") return;

  if(approveEdit){
    closeModal();
    modalEditPayment(approveEdit.dataset.paymentId, approveEdit.dataset.approveEdit);
    return;
  }
  if(approveDelete){
    deletePayment(approveDelete.dataset.paymentId, approveDelete.dataset.approveDelete);
    return;
  }
  if(!btn) return;
  const reqId = btn.dataset.resolveRequest;
  const req = DB.editRequests.find(r=>r.id===reqId);
  if(!req) return;
  req.status = "dismissed";
  addAuditLog("Dismissed edit request", `Dismissed request from "${req.requestedBy}"`);
  saveData();
  closeModal();
  render();
});

/* =========================================================
   AUTH
   ========================================================= */
const loginForm = document.getElementById("login-form");
if(loginForm){
loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  if(!supabaseClient){
    errorEl.textContent = "Supabase is not configured.";
    errorEl.hidden = false;
    return;
  }
  const {data, error} = await supabaseClient.auth.signInWithPassword({ email, password });
  if(error || !data.user){
    errorEl.textContent = error?.message || "Email or password not recognized.";
    errorEl.hidden = false;
    return;
  }
  const role = data.user.app_metadata?.role;
  if(!["admin","treasurer","viewer"].includes(role)){
    await supabaseClient.auth.signOut();
    errorEl.textContent = "This account has no ledger role assigned.";
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;
  CURRENT_USER = {
    id: data.user.id,
    username: data.user.email,
    email: data.user.email,
    password: "",
    role,
        display: data.user.app_metadata?.display || data.user.user_metadata?.display || data.user.email,
  };
  applyUserSettings(CURRENT_USER);
      applySupabaseProfile(CURRENT_USER, data.user);
  setSession(CURRENT_USER);
  window.location.href = "dashboard.html";
});
}

async function signOut(){
  const button = document.getElementById("logout-btn");
  if(button) button.disabled = true;
  if(supabaseClient){
    const {error} = await supabaseClient.auth.signOut({ scope: "local" });
    if(error) console.error("Could not sign out of Supabase.", error);
  }
  clearSession();
  window.location.replace("index.html");
}

const logoutButton = document.getElementById("logout-btn");
if(logoutButton) logoutButton.addEventListener("click", signOut);

function showApp(){
  const appShell = document.getElementById("app-shell");
  if(!appShell || !CURRENT_USER) return;
  STATE = { view: "dashboard", studentId: null, studentTab: "summary", studentSearch: "" };
  render();
}

/* ---------------- INIT ---------------- */
(async function init(){
  if(supabaseClient){
    const {data} = await supabaseClient.auth.getSession();
    const user = data.session?.user;
    if(user){
      const role = user.app_metadata?.role;
      CURRENT_USER = {
        id: user.id,
        username: user.email,
        email: user.email,
        password: "",
        role,
        display: user.app_metadata?.display || user.user_metadata?.display || user.email,
      };
      applyUserSettings(CURRENT_USER);
      applySupabaseProfile(CURRENT_USER, user);
      setSession(CURRENT_USER);
    } else {
      CURRENT_USER = null;
      clearSession();
    }
  }
  if(CURRENT_USER && document.getElementById("app-shell")){
    await loadSharedData();
    showApp();
    subscribeToSharedData();
    render();
  } else if(CURRENT_USER && loginForm){
    window.location.href = "dashboard.html";
  }
})();
