const API_BASE = '/api';
let rawPlans = [];
let rawUsers = [];
let rawLeads = [];
let rawSponsors = [];
let compareList = [];
let currentSelectedPlanTitle = '';

let categoryChartInstance = null;
let roleChartInstance = null;

const defaultPlans = [
  { id: 1, company: "วิริยะประกันภัย", title: "ประกันรถยนต์ ชั้น 1 คุ้มครองคุ้มค่า", category: "ประกันรถยนต์ ชั้น 1", price: 15500, coverage: 500000, repair_type: "ซ่อมห้าง (ศูนย์)", is_promoted: 1 },
  { id: 2, company: "กรุงเทพประกันภัย", title: "ประกันรถยนต์ ชั้น 1 พรีเมียมแคร์", category: "ประกันรถยนต์ ชั้น 1", price: 18900, coverage: 650000, repair_type: "ซ่อมห้าง (ศูนย์)", is_promoted: 0 },
  { id: 3, company: "สินมั่นคงประกันภัย", title: "ประกันรถยนต์ ชั้น 1 สบายกระเป๋า", category: "ประกันรถยนต์ ชั้น 1", price: 12000, coverage: 400000, repair_type: "ซ่อมอู่", is_promoted: 0 },
  { id: 4, company: "ทิพยประกันภัย", title: "ประกันอัคคีภัยคุ้มครองบ้านอยู่อาศัย", category: "ประกันอัคคีภัย", price: 2500, coverage: 2000000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 1 },
  { id: 5, company: "ไทยวิวัฒน์ประกันภัย", title: "ประกันอุทกภัย อุ่นใจยามน้ำท่วม", category: "ประกันอุทกภัย", price: 1800, coverage: 500000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 0 },
  { id: 6, company: "MSIG ประกันภัย", title: "ประกันภัยทางทะเลและขนส่งสินค้า", category: "ประกันภัยทางทะเลและขนส่ง", price: 8500, coverage: 3000000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 0 },
  { id: 7, company: "AIA Thailand", title: "ประกันชีวิตตลอดชีพ Smart Whole Life", category: "ประกันชีวิตแบบตลอดชีพ", price: 18000, coverage: 1000000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 1 },
  { id: 8, company: "อลิอันซ์ อยุธยา", title: "ประกันชีวิตคุ้มครองระยะยาว Term Protect", category: "ประกันชีวิตแบบตลอดชีพ", price: 9900, coverage: 2000000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 0 },
  { id: 9, company: "เมืองไทยประกันชีวิต", title: "ประกันชีวิตสะสมทรัพย์ มั่งคั่ง 10/5", category: "ประกันชีวิตแบบตลอดชีพ", price: 25000, coverage: 300000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 0 },
  { id: 10, company: "FWD ประกันชีวิต", title: "ประกันชีวิตแบบบำนาญ Retire Happy 85", category: "ประกันชีวิตแบบตลอดชีพ", price: 30000, coverage: 800000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 0 },
  { id: 11, company: "ไทยประกันชีวิต", title: "ประกันชีวิตควบการลงทุน Unit-Linked", category: "ประกันชีวิตแบบตลอดชีพ", price: 35000, coverage: 1500000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 0 },
  { id: 12, company: "คุ้มภัยโตเกียวมารีน", title: "ประกันภัยขนส่งสินค้าและโลจิสติกส์", category: "ประกันภัยทางทะเลและขนส่ง", price: 12500, coverage: 5000000, repair_type: "ชดเชยเงินสดตามเงื่อนไข", is_promoted: 0 }
];

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function showView(viewName) {
  document.getElementById('view-user').style.display = viewName === 'user' ? 'block' : 'none';
  document.getElementById('view-agent').style.display = viewName === 'agent' ? 'block' : 'none';
  document.getElementById('view-admin').style.display = viewName === 'admin' ? 'block' : 'none';
  if (viewName === 'admin') renderAdminDashboard();
}

async function loadAllData() {
  try {
    const [resPlans, resUsers, resLeads, resSponsors] = await Promise.all([
      fetch(`${API_BASE}/plans`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/users`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/leads`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/sponsors`).then(r => r.json()).catch(() => [])
    ]);

    rawPlans = (resPlans && resPlans.length > 0) ? resPlans : defaultPlans;
    rawUsers = resUsers || [];
    rawLeads = resLeads || [];
    rawSponsors = resSponsors || [];

    renderUserGrid();
    renderAgentLeadsTable();
    renderAdminDashboard();
  } catch (err) {
    rawPlans = defaultPlans;
    renderUserGrid();
  }
}

function renderUserGrid() {
  const search = document.getElementById('filterSearch').value.toLowerCase();
  const type = document.getElementById('filterType').value;
  const repair = document.getElementById('filterRepair').value;
  const maxPrice = parseFloat(document.getElementById('filterPrice').value) || Infinity;

  const filtered = rawPlans.filter(p => {
    const matchSearch = (p.company || '').toLowerCase().includes(search) || (p.title || '').toLowerCase().includes(search);
    const matchType = type === 'all' || p.category === type;
    const matchRepair = repair === 'all' || p.repair_type === repair;
    const matchPrice = p.price <= maxPrice;
    return matchSearch && matchType && matchRepair && matchPrice;
  });

  const container = document.getElementById('insuranceGrid');
  container.innerHTML = filtered.map(item => `
    <div class="card ${item.is_promoted ? 'promoted' : ''}">
      ${item.is_promoted ? '<span class="badge-promoted">แนะนำพิเศษ</span>' : ''}
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <strong>${item.company}</strong>
          <div style="font-size: 12px; color: var(--text-muted);">${item.category}</div>
        </div>
        <label style="font-size: 12px; cursor: pointer;">
          <input type="checkbox" onchange="toggleCompare(${item.id}, this)" ${compareList.some(c => c.id === item.id) ? 'checked' : ''}> เปรียบเทียบ
        </label>
      </div>
      <div style="margin-top: 10px;">
        <h4 style="color: var(--primary);">${item.title}</h4>
        <div style="font-size: 13px; margin-top: 4px;">ทุนประกัน: <b>฿${Number(item.coverage).toLocaleString()}</b> | ซ่อม: ${item.repair_type}</div>
      </div>
      <div style="text-align: right; margin-top: 12px;">
        <span style="font-size: 20px; font-weight: 700; color: var(--primary); margin-right: 8px;">฿${Number(item.price).toLocaleString()}/ปี</span>
        <button class="btn-primary btn-sm" onclick="openLeadModal('${item.title}')">ขอใบเสนอราคา</button>
      </div>
    </div>
  `).join('') || '<div style="text-align:center; padding: 40px; color: var(--text-muted);">ไม่พบข้อมูลแผนประกันที่ตรงกับเงื่อนไข</div>';
}

function toggleCompare(id, checkbox) {
  const plan = rawPlans.find(p => p.id === id);
  if (checkbox.checked) {
    if (compareList.length >= 3) {
      checkbox.checked = false;
      showToast('สามารถเปรียบเทียบได้สูงสุด 3 แผนเท่านั้น', 'warning');
      return;
    }
    compareList.push(plan);
  } else {
    compareList = compareList.filter(p => p.id !== id);
  }
  updateCompareDrawer();
}

function updateCompareDrawer() {
  const drawer = document.getElementById('compareDrawer');
  document.getElementById('compareCount').innerText = compareList.length;
  document.getElementById('compareList').innerHTML = compareList.map(item => `<span class="compare-chip">${item.title}</span>`).join('');
  drawer.classList.toggle('show', compareList.length > 0);
}

function openCompareModal() {
  if (compareList.length === 0) return;
  document.getElementById('compareTableHeader').innerHTML = `<th>รายละเอียด</th>` + compareList.map(p => `<th>${p.company}<br><small>${p.title}</small></th>`).join('');
  document.getElementById('compareTableBody').innerHTML = `
    <tr><td><b>เบี้ยประกันภัย/ปี</b></td>${compareList.map(p => `<td>฿${Number(p.price).toLocaleString()}</td>`).join('')}</tr>
    <tr><td><b>ทุนประกัน</b></td>${compareList.map(p => `<td>฿${Number(p.coverage).toLocaleString()}</td>`).join('')}</tr>
    <tr><td><b>ประเภทการซ่อม</b></td>${compareList.map(p => `<td>${p.repair_type}</td>`).join('')}</tr>
    <tr><td><b>ประเภทประกัน</b></td>${compareList.map(p => `<td>${p.category}</td>`).join('')}</tr>
  `;
  document.getElementById('compareModalOverlay').style.display = 'flex';
}
function closeCompareModal() { document.getElementById('compareModalOverlay').style.display = 'none'; }

function openLeadModal(title) {
  currentSelectedPlanTitle = title;
  document.getElementById('leadPlanTitleDisplay').innerText = `แผนประกัน: ${title}`;
  document.getElementById('leadModalOverlay').style.display = 'flex';
}
function closeLeadModal() { document.getElementById('leadModalOverlay').style.display = 'none'; }

async function submitLead() {
  const name = document.getElementById('leadName').value;
  const phone = document.getElementById('leadPhone').value;
  const email = document.getElementById('leadEmail').value;

  if (!name || !phone) {
    showToast('กรุณากรอกชื่อและเบอร์โทรศัพท์', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, plan_title: currentSelectedPlanTitle })
    });

    if (res.ok) {
      showToast('🎉 บันทึกคำขอเรียบร้อย! เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด', 'success');
      closeLeadModal();
      loadAllData();
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาด ไม่สามารถส่งข้อมูลได้', 'danger');
  }
}

function renderAgentLeadsTable() {
  document.getElementById('agentLeadsCount').innerText = `${rawLeads.length} รายการ`;
  document.getElementById('agentActivePlansCount').innerText = `${rawPlans.length} แผน`;
  const tbody = document.getElementById('agentLeadsTable');
  tbody.innerHTML = rawLeads.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${l.name}</b></td>
      <td>${l.phone}</td>
      <td>${l.plan_title || '-'}</td>
      <td>${l.created_at ? new Date(l.created_at).toLocaleDateString('th-TH') : 'วันนี้'}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;">ยังไม่มีข้อมูลคำขอ</td></tr>';
}

function renderAdminDashboard() {
  document.getElementById('adminTotalUsersCount').innerText = `${rawUsers.length} คน`;
  document.getElementById('adminTotalLeads').innerText = `${rawLeads.length} รายการ`;
  document.getElementById('adminPendingSponsors').innerText = `${rawSponsors.filter(s => s.status === 'pending').length} รายการ`;
  document.getElementById('adminTotalPlans').innerText = `${rawPlans.length} แผน`;

  const categories = {};
  rawPlans.forEach(p => { categories[p.category] = (categories[p.category] || 0) + 1; });
  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(document.getElementById('planCategoryChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{ data: Object.values(categories), backgroundColor: ['#1B4D3E', '#0284C7', '#CA8A04', '#DC2626', '#16A34A', '#9333EA'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const roles = { admin: 1, agent: 1, user: rawUsers.length || 2 };
  if (roleChartInstance) roleChartInstance.destroy();
  roleChartInstance = new Chart(document.getElementById('userRoleChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Super Admin', 'Partner / Agent', 'User สมาชิก'],
      datasets: [{ label: 'จำนวนผู้ใช้งาน', data: [roles.admin, roles.agent, roles.user], backgroundColor: ['#DC2626', '#CA8A04', '#16A34A'] }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });

  const tbody = document.getElementById('adminUsersTable');
  tbody.innerHTML = rawUsers.map(u => `
    <tr>
      <td>${u.id}</td>
      <td><b>${u.name}</b></td>
      <td>${u.email}</td>
      <td>${u.phone || '-'}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'agent' ? 'badge-warning' : 'badge-info'}">${u.role ? u.role.toUpperCase() : 'USER'}</span></td>
      <td>${u.quota || 5} แผน</td>
      <td>
        <button class="btn-outline btn-sm" onclick="openEditUserModal('${encodeURIComponent(JSON.stringify(u))}')">แก้ไข</button>
        <button class="btn-danger btn-sm" onclick="deleteUser(${u.id})">ลบ</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;">ยังไม่มีผู้ใช้ในระบบ DB</td></tr>';
}

function openEditUserModal(userJson) {
  const user = JSON.parse(decodeURIComponent(userJson));
  document.getElementById('editUserId').value = user.id;
  document.getElementById('editUserName').value = user.name || '';
  document.getElementById('editUserEmail').value = user.email || '';
  document.getElementById('editUserPhone').value = user.phone || '';
  document.getElementById('editUserRole').value = user.role || 'user';
  document.getElementById('editUserQuota').value = user.quota || 5;
  document.getElementById('editUserModalOverlay').style.display = 'flex';
}
function closeEditUserModal() { document.getElementById('editUserModalOverlay').style.display = 'none'; }

async function saveEditUser() {
  const id = document.getElementById('editUserId').value;
  const payload = {
    name: document.getElementById('editUserName').value,
    email: document.getElementById('editUserEmail').value,
    phone: document.getElementById('editUserPhone').value,
    role: document.getElementById('editUserRole').value,
    quota: parseInt(document.getElementById('editUserQuota').value) || 5
  };

  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast('อัปเดตข้อมูลผู้ใช้งานสำเร็จ!', 'success');
    closeEditUserModal();
    loadAllData();
  }
}

async function deleteUser(id) {
  if (!confirm('ยืนยันลบผู้ใช้ไอดีนี้ออกจากระบบ?')) return;
  const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showToast('ลบข้อมูลสำเร็จ', 'success');
    loadAllData();
  }
}

async function submitSponsorRequest() {
  const payload = {
    company: document.getElementById('sponsorCompany').value,
    contact: document.getElementById('sponsorContact').value,
    phone: document.getElementById('sponsorPhone').value
  };
  const res = await fetch(`${API_BASE}/sponsors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    showToast('ยื่นคำขอพาร์ทเนอร์สำเร็จ!', 'success');
    closeSponsorModal();
  }
}

function openAuthModal() { document.getElementById('authModalOverlay').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('authModalOverlay').style.display = 'none'; }
function openSponsorModal() { document.getElementById('sponsorModalOverlay').style.display = 'flex'; }
function closeSponsorModal() { document.getElementById('sponsorModalOverlay').style.display = 'none'; }

function resetFilters() {
  document.getElementById('filterSearch').value = '';
  document.getElementById('filterType').value = 'all';
  document.getElementById('filterRepair').value = 'all';
  document.getElementById('filterPrice').value = 50000;
  renderUserGrid();
}

window.addEventListener('DOMContentLoaded', loadAllData);