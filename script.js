/* Professional Booking Dashboard JS
   - Calendar rendering
   - Table rendering
   - Add booking modal
   - Booking detail modal
   - Row selection & bulk actions
   - Toast notifications
*/

/* -------------------------
   INITIAL DATA & DOM refs
   -------------------------*/
const calendarEl = document.getElementById('calendar');
const monthYearEl = document.getElementById('monthYear');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');

const openAddBtn = document.getElementById('openAddBtn');
const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addForm');
const modalCloses = document.querySelectorAll('.modal-close');

const detailModal = document.getElementById('detailModal');
const detailClose = document.querySelector('.detail-close');

const d_guest = document.getElementById('d_guest');
const d_unit = document.getElementById('d_unit');
const d_start = document.getElementById('d_start');
const d_end = document.getElementById('d_end');
const d_duration = document.getElementById('d_duration');
const d_deposit = document.getElementById('d_deposit');
const d_status = document.getElementById('d_status');

const detailConfirm = document.getElementById('detailConfirm');
const detailCancel = document.getElementById('detailCancel');
const detailDelete = document.getElementById('detailDelete');

const selectAllCheckbox = document.getElementById('selectAll');
const tableBody = document.getElementById('tableBody');

const confirmSelectedBtn = document.getElementById('confirmSelected');
const cancelSelectedBtn = document.getElementById('cancelSelected');
const deleteSelectedBtn = document.getElementById('deleteSelected');

const toasts = document.getElementById('toasts');

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

/* Example bookings - you can load from backend later */
let bookings = [
  { id: 1, guest: "John Doe", unit: "A101", start: "2025-10-12", end: "2025-10-14", deposit: "Yes", status: "Pending" },
  { id: 2, guest: "Emily Clark", unit: "B201", start: "2025-10-20", end: "2025-10-23", deposit: "No", status: "Confirmed" },
  { id: 3, guest: "Mark Spencer", unit: "C305", start: "2025-10-25", end: "2025-10-26", deposit: "Yes", status: "Pending" },
];

/* -------------------------
   UTILITIES
   -------------------------*/
function formatDateISO(d) {
  // expects Date object
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function daysBetween(startISO, endISO) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return diff;
}
function parseISO(dateISO) { return new Date(dateISO + 'T00:00:00'); }

/* -------------------------
   TOASTS
   -------------------------*/
function showToast(msg, type='info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  toasts.appendChild(el);
  setTimeout(()=> el.remove(), 3000);
}

/* -------------------------
   CALENDAR RENDER
   -------------------------*/
function renderCalendar(month = currentMonth, year = currentYear) {
  calendarEl.innerHTML = '';
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const totalDays = last.getDate();

  monthYearEl.textContent = `${first.toLocaleString('default',{month:'long'})} ${year}`;

  // empty placeholders before first day
  for (let i = 0; i < startDay; i++) {
    const placeholder = document.createElement('div');
    placeholder.className = 'day';
    placeholder.style.visibility = 'hidden';
    calendarEl.appendChild(placeholder);
  }

  // create day cells
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    const iso = formatDateISO(dateObj);

    const cell = document.createElement('div');
    cell.className = 'day';
    cell.dataset.date = iso;
    cell.innerHTML = `<div class="dnum">${d}</div>`;

    // mark today
    const todayISO = formatDateISO(new Date());
    if (iso === todayISO) cell.classList.add('today');

    // check bookings that overlap this date
    const overlapping = bookings.filter(b => iso >= b.start && iso <= b.end);

    if (overlapping.length) {
      // if multiple bookings overlap same date, show the first for click
      const booking = overlapping[0];
      // determine if start, end, or middle
      if (iso === booking.start) cell.classList.add('booked-start');
      else if (iso === booking.end) cell.classList.add('booked-end');
      else cell.classList.add('booked-range');

      // small badge with unit
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = booking.unit;
      cell.appendChild(badge);

      // open detail modal on click
      cell.addEventListener('click', () => openDetailModal(booking));
    }

    calendarEl.appendChild(cell);
  }
}

/* -------------------------
   TABLE RENDER
   -------------------------*/
function renderTable() {
  tableBody.innerHTML = '';
  bookings.sort((a,b)=> a.id - b.id);
  bookings.forEach(b => {
    const tr = document.createElement('tr');
    tr.dataset.id = b.id;

    // select checkbox
    const tdSelect = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'row-select';
    chk.addEventListener('change', updateSelectAllState);
    tdSelect.appendChild(chk);

    // guest
    const tdGuest = document.createElement('td'); tdGuest.textContent = b.guest;
    const tdUnit = document.createElement('td'); tdUnit.textContent = b.unit || '-';
    const tdStart = document.createElement('td'); tdStart.textContent = b.start;
    const tdEnd = document.createElement('td'); tdEnd.textContent = b.end;
    const tdDuration = document.createElement('td'); tdDuration.textContent = `${daysBetween(b.start,b.end)} days`;
    const tdDeposit = document.createElement('td'); tdDeposit.innerHTML = (b.deposit === 'Yes') ? `<span class="deposit-yes">Yes</span>` : `<span class="deposit-no">No</span>`;

    const tdStatus = document.createElement('td');
    const chip = document.createElement('span'); chip.className = 'status-chip';
    if (b.status === 'Confirmed') { chip.classList.add('status-confirmed'); chip.textContent = 'Confirmed'; }
    else if (b.status === 'Cancelled') { chip.classList.add('status-cancelled'); chip.textContent = 'Cancelled'; }
    else { chip.classList.add('status-pending'); chip.textContent = 'Pending'; }
    tdStatus.appendChild(chip);

    // actions
    const tdActions = document.createElement('td');
    const actConfirm = document.createElement('button'); actConfirm.className = 'action-btn action-confirm'; actConfirm.textContent = 'Confirm';
    const actCancel = document.createElement('button'); actCancel.className = 'action-btn action-cancel'; actCancel.textContent = 'Cancel';
    const actDelete = document.createElement('button'); actDelete.className = 'action-btn action-delete'; actDelete.textContent = 'Delete';

    actConfirm.addEventListener('click', ()=> updateBookingStatus(b.id,'Confirmed'));
    actCancel.addEventListener('click', ()=> updateBookingStatus(b.id,'Cancelled'));
    actDelete.addEventListener('click', ()=> deleteBooking(b.id));

    tdActions.append(actConfirm, actCancel, actDelete);

    tr.append(tdSelect, tdGuest, tdUnit, tdStart, tdEnd, tdDuration, tdDeposit, tdStatus, tdActions);
    tableBody.appendChild(tr);
  });

  updateSelectAllState();
}

/* -------------------------
   MODALS & FORM
   -------------------------*/
openAddBtn.addEventListener('click', ()=> { addModal.style.display = 'flex'; });

modalCloses.forEach(btn => btn.addEventListener('click', ()=> {
  btn.closest('.modal').style.display = 'none';
}));

detailClose.addEventListener('click', ()=> detailModal.style.display = 'none');

window.addEventListener('click', (e)=> {
  if (e.target === addModal) addModal.style.display = 'none';
  if (e.target === detailModal) detailModal.style.display = 'none';
});

/* Add booking handler */
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const guest = document.getElementById('guestInput').value.trim();
  const unit = document.getElementById('unitInput').value.trim();
  const start = document.getElementById('startInput').value;
  const end = document.getElementById('endInput').value;
  const deposit = document.getElementById('depositInput').value;

  if (!guest || !start || !end) {
    showToast('Please fill guest and dates', 'error'); return;
  }
  if (new Date(end) < new Date(start)) {
    showToast('End date cannot be before start date', 'error'); return;
  }

  const newBooking = {
    id: Date.now(),
    guest, unit, start, end, deposit,
    status: 'Pending'
  };
  bookings.push(newBooking);
  renderTable();
  renderCalendar();
  showToast('New booking added', 'success');

  addForm.reset();
  addModal.style.display = 'none';
});

/* open detail modal */
let activeDetailBooking = null;
function openDetailModal(booking) {
  activeDetailBooking = booking;
  d_guest.textContent = booking.guest;
  d_unit.textContent = booking.unit || '-';
  d_start.textContent = booking.start;
  d_end.textContent = booking.end;
  d_duration.textContent = `${daysBetween(booking.start, booking.end)} days`;
  d_deposit.textContent = booking.deposit;
  d_status.textContent = booking.status;
  detailModal.style.display = 'flex';
}

/* detail modal actions */
detailConfirm.addEventListener('click', ()=> {
  if (!activeDetailBooking) return;
  updateBookingStatus(activeDetailBooking.id, 'Confirmed');
  detailModal.style.display = 'none';
});
detailCancel.addEventListener('click', ()=> {
  if (!activeDetailBooking) return;
  updateBookingStatus(activeDetailBooking.id, 'Cancelled');
  detailModal.style.display = 'none';
});
detailDelete.addEventListener('click', ()=> {
  if (!activeDetailBooking) return;
  deleteBooking(activeDetailBooking.id);
  detailModal.style.display = 'none';
});

/* -------------------------
   CRUD & bulk actions
   -------------------------*/
function updateBookingStatus(id, newStatus) {
  const b = bookings.find(x => x.id === id);
  if (!b) return;
  b.status = newStatus;
  renderTable();
  renderCalendar();
  showToast(`Booking ${newStatus}`, newStatus === 'Confirmed' ? 'success' : 'error');
}

function deleteBooking(id) {
  bookings = bookings.filter(x => x.id !== id);
  renderTable();
  renderCalendar();
  showToast('Booking deleted', 'info');
}

/* selection helpers */
function getSelectedIds() {
  return Array.from(document.querySelectorAll('.row-select'))
    .map((chk,idx)=> chk.checked ? Number(chk.closest('tr').dataset.id) : null)
    .filter(Boolean);
}

selectAllCheckbox.addEventListener('change', (e)=> {
  const checked = e.target.checked;
  document.querySelectorAll('.row-select').forEach(chk => chk.checked = checked);
});

/* keep select-all state in sync */
function updateSelectAllState() {
  const checks = Array.from(document.querySelectorAll('.row-select'));
  if (!checks.length) { selectAllCheckbox.checked = false; selectAllCheckbox.indeterminate = false; return; }
  const all = checks.every(c=>c.checked);
  const any = checks.some(c=>c.checked);
  selectAllCheckbox.checked = all;
  selectAllCheckbox.indeterminate = !all && any;
}

/* bulk actions */
confirmSelectedBtn.addEventListener('click', ()=> {
  const ids = getSelectedIds();
  if (!ids.length) { showToast('No bookings selected', 'info'); return; }
  ids.forEach(id => updateBookingStatus(id, 'Confirmed'));
});

cancelSelectedBtn.addEventListener('click', ()=> {
  const ids = getSelectedIds();
  if (!ids.length) { showToast('No bookings selected', 'info'); return; }
  ids.forEach(id => updateBookingStatus(id, 'Cancelled'));
});

deleteSelectedBtn.addEventListener('click', ()=> {
  const ids = getSelectedIds();
  if (!ids.length) { showToast('No bookings selected', 'info'); return; }
  bookings = bookings.filter(b => !ids.includes(b.id));
  renderTable(); renderCalendar();
  showToast('Selected bookings deleted', 'info');
  selectAllCheckbox.checked = false;
});

/* -------------------------
   NAV & init
   -------------------------*/
prevMonth.addEventListener('click', ()=> {
  currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar(currentMonth,currentYear);
});
nextMonth.addEventListener('click', ()=> {
  currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar(currentMonth,currentYear);
});

/* initial render */
renderCalendar();
renderTable();
