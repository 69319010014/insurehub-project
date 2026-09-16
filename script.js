// ข้อมูลจำลองตรงตามภาพ Screenshot ทั้งหมด
let plans = [
  { id: 1, company: "วิริยะประกันภัย", title: "ประกันรถยนต์ ชั้น 1 Pro", price: 15500, coverage: 500000, repair: "ซ่อมห้าง (ศูนย์)", status: "approved" },
  { id: 2, company: "กรุงเทพประกันภัย", title: "ประกันอัคคีภัย คุ้มครองบ้าน 360", price: 2800, coverage: 2000000, repair: "ชดเชยเงินสดตามเงื่อนไข", status: "approved" },
  { id: 3, company: "เอไอเอ (AIA)", title: "ประกันชีวิตตลอดชีพ 99/20", price: 24000, coverage: 1000000, repair: "ชดเชยเงินสดตามเงื่อนไข", status: "approved" },
  { id: 4, company: "เมืองไทยประกันภัย", title: "ประกันรถยนต์ ชั้น 1 สบายใจ", price: 12900, coverage: 400000, repair: "ซ่อมอู่", status: "pending" }
];

function showToast(msg) {
  alert(msg);
}

// สลับหน้าใหญ่ (Partner / Admin / User)
function showMainView(view) {
  document.getElementById('view-partner').style.display = view === 'partner' ? 'flex' : 'none';
  document.getElementById('view-admin').style.display = view === 'admin' ? 'flex' : 'none';
  document.getElementById('view-user').style.display = view === 'user' ? 'block' : 'none';

  document.getElementById('navBtnPartner').classList.toggle('active', view === 'partner');
  document.getElementById('navBtnAdmin').classList.toggle('active', view === 'admin');

  if (view === 'partner') renderPartnerPlans();
}

// สลับ Tab ใน Sidebar ของ Partner
function switchPartnerTab(tab) {
  document.getElementById('partnerTabOverview').style.display = tab === 'overview' ? 'block' : 'none';
  document.getElementById('partnerTabPlans').style.display = tab === 'plans' ? 'block' : 'none';
  document.getElementById('partnerTabAdd').style.display = tab === 'add' ? 'block' : 'none';

  document.getElementById('sidePartnerOverview').classList.toggle('active', tab === 'overview');
  document.getElementById('sidePartnerPlans').classList.toggle('active', tab === 'plans');
  document.getElementById('sidePartnerAdd').classList.toggle('active', tab === 'add');
}

// สลับ Tab ใน Sidebar ของ Admin
function switchAdminTab(tab) {
  document.getElementById('adminTabOverview').style.display = tab === 'overview' ? 'block' : 'none';
  document.getElementById('adminTabUsers').style.display = tab === 'users' ? 'block' : 'none';
  document.getElementById('adminTabSponsors').style.display = tab === 'sponsors' ? 'block' : 'none';
  document.getElementById('adminTabApprovals').style.display = tab === 'approvals' ? 'block' : 'none';

  document.getElementById('sideAdminOverview').classList.toggle('active', tab === 'overview');
  document.getElementById('sideAdminUsers').classList.toggle('active', tab === 'users');
  document.getElementById('sideAdminSponsors').classList.toggle('active', tab === 'sponsors');
  document.getElementById('sideAdminApprovals').classList.toggle('active', tab === 'approvals');
}

// Render ตารางแผนประกันของ Partner
function renderPartnerPlans() {
  const tbody = document.getElementById('partnerPlansTable');
  tbody.innerHTML = plans.map(p => `
    <tr style="border-bottom: 1px solid #eee;">
      <td>#${p.id}</td>
      <td><b>${p.company}</b></td>
      <td>${p.title}</td>
      <td>${Number(p.price).toLocaleString()} บาท</td>
      <td>${Number(p.coverage).toLocaleString()} บาท</td>
      <td>${p.repair}</td>
      <td>
        <span class="badge ${p.status === 'approved' ? 'badge-success' : 'badge-warning'}">
          ${p.status === 'approved' ? 'อนุมัติแล้ว' : 'รอแอดมินอนุมัติ'}
        </span>
      </td>
      <td><button class="btn-danger btn-sm" onclick="deletePlan(${p.id})">ลบ</button></td>
    </tr>
  `).join('');
}

// บันทึกเพิ่มแผนประกันใหม่
function handleAddPlan(e) {
  e.preventDefault();
  const newPlan = {
    id: plans.length + 1,
    company: document.getElementById('addCompany').value,
    title: document.getElementById('addTitle').value,
    price: parseFloat(document.getElementById('addPrice').value),
    coverage: parseFloat(document.getElementById('addCoverage').value),
    repair: document.getElementById('addRepair').value,
    status: "pending"
  };

  plans.push(newPlan);
  showToast('เพิ่มแผนประกันภัยเรียบร้อย! ส่งเรื่องรอ Super Admin อนุมัติ');
  switchPartnerTab('plans');
  renderPartnerPlans();
}

// อนุมัติแผนประกัน (สำหรับ Super Admin)
function approvePlan(id) {
  const item = plans.find(p => p.id === id);
  if (item) item.status = 'approved';
  showToast('อนุมัติแผนประกันภัยเรียบร้อยแล้ว!');
  document.getElementById('adminApprovalsTable').innerHTML = '<tr><td colspan="9" style="text-align:center; color:#888; padding:20px;">ไม่มีรายการรออนุมัติ</td></tr>';
  document.getElementById('pendingBadgeCount').innerText = '0';
}

function rejectPlan(id) {
  plans = plans.filter(p => p.id !== id);
  showToast('ปฏิเสธรายการแผนประกันแล้ว');
  document.getElementById('adminApprovalsTable').innerHTML = '<tr><td colspan="9" style="text-align:center; color:#888; padding:20px;">ไม่มีรายการรออนุมัติ</td></tr>';
  document.getElementById('pendingBadgeCount').innerText = '0';
}

function deletePlan(id) {
  if (confirm('ยืนยันลบแผนประกันนี้?')) {
    plans = plans.filter(p => p.id !== id);
    renderPartnerPlans();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  showMainView('partner');
});
