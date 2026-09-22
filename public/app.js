const state = {
  crewLeads: [],
  passengers: [],
  resources: []
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function getCrewLeadId() {
  return $('#crewLeadId').value.trim();
}

function showToast(message, kind) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast show ${kind ?? ''}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const crewLeadId = getCrewLeadId();
    if (!crewLeadId) {
      showToast('Crew Lead ID is required for this action', 'err');
      throw new Error('Missing crew lead id');
    }
    headers['x-crew-lead-id'] = crewLeadId;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.error?.message ?? `Request failed (${res.status})`;
    showToast(message, 'err');
    throw new Error(message);
  }

  return data;
}

// ---------- Tabs ----------
function initTabs() {
  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach((b) => b.classList.remove('active'));
      $$('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      $(`#${btn.dataset.tab}`).classList.add('active');
    });
  });
}

// ---------- Health ----------
async function checkHealth() {
  const dot = $('#healthDot');
  try {
    const res = await fetch('/health');
    const data = await res.json();
    dot.className = `dot ${data.status === 'healthy' ? 'ok' : 'bad'}`;
    dot.title = `${data.status} (db: ${data.database})`;
  } catch {
    dot.className = 'dot bad';
    dot.title = 'API unreachable';
  }
}

// ---------- Crew Leads ----------
async function loadCrewLeads() {
  state.crewLeads = await api('/crew-leads');
  renderCrewLeads();
  updateCrewLeadBadge();
}

function updateCrewLeadBadge() {
  const id = getCrewLeadId();
  const match = state.crewLeads.find((c) => c.id === id);
  $('#crewLeadName').textContent = match ? `${match.name} (${match.role})` : '';
}

function renderCrewLeads() {
  const tbody = $('#crewLeadTable');
  tbody.innerHTML = '';
  for (const cl of state.crewLeads) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cl.id}</td>
      <td>${escapeHtml(cl.name)}</td>
      <td>${escapeHtml(cl.email)}</td>
      <td>${escapeHtml(cl.role)}</td>
      <td>${new Date(cl.createdAt).toLocaleString()}</td>
      <td><button class="secondary use-crew-lead" data-id="${cl.id}">Use</button></td>
    `;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll('.use-crew-lead').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('#crewLeadId').value = btn.dataset.id;
      updateCrewLeadBadge();
      showToast('Crew lead selected', 'ok');
    });
  });
}

function initCrewLeadForm() {
  $('#crewLeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      role: form.get('role')
    };
    try {
      await api('/crew-leads', { method: 'POST', body: payload });
      showToast('Crew lead created', 'ok');
      e.target.reset();
      await loadCrewLeads();
    } catch {
      /* toast already shown */
    }
  });

  $('#crewLeadId').addEventListener('input', updateCrewLeadBadge);
}

// ---------- Passengers ----------
async function loadPassengers() {
  state.passengers = await api('/passengers');
  renderPassengers();
  populatePassengerSelects();
}

function renderPassengers() {
  const tbody = $('#passengerTable');
  tbody.innerHTML = '';
  for (const p of state.passengers) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.email)}</td>
      <td>${escapeHtml(p.phone ?? '-')}</td>
      <td>${p.membership}</td>
      <td>
        <select class="membership-select" data-id="${p.id}">
          ${['SILVER', 'GOLD', 'PLATINUM'].map((m) => `<option value="${m}" ${m === p.membership ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <button class="secondary update-membership" data-id="${p.id}">Update</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll('.update-membership').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const select = tbody.querySelector(`.membership-select[data-id="${id}"]`);
      try {
        await api(`/passengers/${id}/membership`, {
          method: 'PATCH',
          body: { membership: select.value },
          auth: true
        });
        showToast('Membership updated', 'ok');
        await loadPassengers();
      } catch {
        /* toast already shown */
      }
    });
  });
}

function populatePassengerSelects() {
  const options = ['<option value="">Select Passenger</option>']
    .concat(state.passengers.map((p) => `<option value="${p.id}">${escapeHtml(p.name)} (${p.membership})</option>`))
    .join('');
  $('#accessPassengerSelect').innerHTML = options;
  $('#reportPassengerSelect').innerHTML = options;
}

function initPassengerForm() {
  $('#passengerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get('name'),
      email: form.get('email')
    };
    const phone = form.get('phone');
    const membership = form.get('membership');
    if (phone) payload.phone = phone;
    if (membership) payload.membership = membership;

    try {
      await api('/passengers', { method: 'POST', body: payload, auth: true });
      showToast('Passenger created', 'ok');
      e.target.reset();
      await loadPassengers();
    } catch {
      /* toast already shown */
    }
  });
}

// ---------- Resources ----------
async function loadResources() {
  state.resources = await api('/resources');
  renderResources();
  populateResourceSelects();
}

function renderResources() {
  const tbody = $('#resourceTable');
  tbody.innerHTML = '';
  for (const r of state.resources) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.type)}</td>
      <td>${r.status}</td>
      <td>${r.minMembership}</td>
      <td>
        <select class="status-select" data-id="${r.id}">
          <option value="INACTIVE" ${r.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE</option>
          <option value="DECOMMISSIONED" ${r.status === 'DECOMMISSIONED' ? 'selected' : ''}>DECOMMISSIONED</option>
          <option value="ACTIVE" ${r.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
        </select>
        <button class="secondary set-status" data-id="${r.id}">Set Status</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll('.set-status').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const select = tbody.querySelector(`.status-select[data-id="${id}"]`);
      try {
        await api(`/resources/${id}/status`, {
          method: 'PATCH',
          body: { status: select.value },
          auth: true
        });
        showToast('Resource status updated', 'ok');
        await loadResources();
      } catch {
        /* toast already shown */
      }
    });
  });
}

function populateResourceSelects() {
  const options = ['<option value="">Select Resource</option>']
    .concat(state.resources.map((r) => `<option value="${r.id}">${escapeHtml(r.name)} (${r.status})</option>`))
    .join('');
  $('#accessResourceSelect').innerHTML = options;
}

function initResourceForm() {
  $('#resourceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get('name'),
      type: form.get('type')
    };
    const minMembership = form.get('minMembership');
    if (minMembership) payload.minMembership = minMembership;

    try {
      await api('/resources', { method: 'POST', body: payload, auth: true });
      showToast('Resource created', 'ok');
      e.target.reset();
      await loadResources();
    } catch {
      /* toast already shown */
    }
  });
}

// ---------- Access ----------
function initAccessForm() {
  $('#accessForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      passengerId: form.get('passengerId'),
      resourceId: form.get('resourceId')
    };
    const box = $('#accessResult');
    box.className = 'result-box';
    box.textContent = 'Checking access...';
    try {
      const res = await fetch('/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      box.classList.add(data.allowed ? 'allowed' : 'denied');
      box.textContent = JSON.stringify(data, null, 2);
      if (data.allowed) {
        showToast('Access allowed', 'ok');
      } else {
        showToast(data.reason ?? 'Access denied', 'err');
      }
    } catch (err) {
      box.textContent = String(err);
    }
  });
}

// ---------- Reports ----------
function initReports() {
  $('#loadPassengerUsage').addEventListener('click', async () => {
    const id = $('#reportPassengerSelect').value;
    if (!id) {
      showToast('Select a passenger first', 'err');
      return;
    }
    try {
      const data = await api(`/reports/passengers/${id}/usage`, { auth: true });
      $('#passengerUsageOutput').textContent = JSON.stringify(data, null, 2);
    } catch {
      /* toast already shown */
    }
  });

  $('#loadResourceUsage').addEventListener('click', async () => {
    try {
      const data = await api('/reports/resources/usage', { auth: true });
      $('#resourceUsageOutput').textContent = JSON.stringify(data, null, 2);
    } catch {
      /* toast already shown */
    }
  });

  $('#loadResourceDemand').addEventListener('click', async () => {
    try {
      const data = await api('/reports/resources/demand', { auth: true });
      $('#resourceDemandOutput').textContent = JSON.stringify(data, null, 2);
    } catch {
      /* toast already shown */
    }
  });

  $('#loadMembershipUsage').addEventListener('click', async () => {
    try {
      const data = await api('/reports/membership-usage', { auth: true });
      $('#membershipUsageOutput').textContent = JSON.stringify(data, null, 2);
    } catch {
      /* toast already shown */
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function init() {
  initTabs();
  initCrewLeadForm();
  initPassengerForm();
  initResourceForm();
  initAccessForm();
  initReports();

  const savedCrewLeadId = localStorage.getItem('crewLeadId');
  if (savedCrewLeadId) $('#crewLeadId').value = savedCrewLeadId;
  $('#crewLeadId').addEventListener('change', () => {
    localStorage.setItem('crewLeadId', getCrewLeadId());
  });

  await checkHealth();
  await Promise.all([loadCrewLeads(), loadPassengers(), loadResources()]);
  setInterval(checkHealth, 15000);
}

init();
