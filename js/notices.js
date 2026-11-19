/* ADMIN notices page (publish announcements)
   Owner: Admin member
   Page: admin/notices.html */

const admin = guard('admin');

function showPage() {
  const db = DB.load();
  const c = shell('admin/notices.html', 'Notices', 'Publish announcements for users.');

  // ----- published notices (newest first) -----
  const newest = db.notices.slice().reverse();
  let listHtml = '<p class="empty">No notices yet.</p>';
  if (newest.length > 0) {
    listHtml = newest.map(function (n) {
      return `<div class="row">
        <span class="av notice-icon">${ic('file')}</span>
        <div class="t"><b>${E(n.title)}</b><small>Published ${niceDate(n.at)}</small></div>
        ${chip(AUDIENCE_NAME[n.audience] || 'All users', 'blu')}
        ${btn('Delete', 'delete', n.id)}
      </div>`;
    }).join('');
  }

  // ----- form for a new notice -----
  const formHtml = `<form id="noticeForm" novalidate>
    <div class="fld">
      <label for="title">Title</label>
      <input class="inp" id="title" maxlength="80" placeholder="Enter notice title">
      <span class="error" id="titleError"></span>
    </div>
    <div class="fld">
      <label for="msg">Message</label>
      <textarea class="inp" id="msg" rows="4" maxlength="300" placeholder="Write your announcement"></textarea>
      <span class="error" id="msgError"></span>
    </div>
    <div class="fld">
      <label for="audience">Audience</label>
      <select class="inp" id="audience">
        <option value="all">All users</option>
        <option value="donor">Donors</option>
        <option value="recipient">Recipients</option>
        <option value="staff">Blood bank staff</option>
      </select>
      <span class="error" id="audienceError"></span>
    </div>
    <button class="btn pri">${ic('bell')}Publish notice</button>
  </form>`;

  c.innerHTML = `<div class="grid2" style="grid-template-columns:1fr 1.2fr">
    ${card('New notice', formHtml)}
    ${card('Published notices', listHtml)}
  </div>`;

  $('#noticeForm').onsubmit = publishNotice;
}

// Check the form, then save the notice and alert the users
function publishNotice(event) {
  event.preventDefault();
  const form = event.target;
  clearErrors(form);

  const title = $('#title');
  const msg = $('#msg');
  const audience = $('#audience');
  let valid = true;

  // Title validation
  if (title.value.trim() === '') {
    showError(title, 'titleError', 'Title is required.');
    valid = false;
  } else if (title.value.trim().length < 5) {
    showError(title, 'titleError', 'Title must be at least 5 characters.');
    valid = false;
  } else {
    showSuccess(title);
  }

  // Message validation
  if (msg.value.trim() === '') {
    showError(msg, 'msgError', 'Message is required.');
    valid = false;
  } else if (msg.value.trim().length < 10) {
    showError(msg, 'msgError', 'Message must be at least 10 characters.');
    valid = false;
  } else {
    showSuccess(msg);
  }

  // Audience validation
  if (audience.value === '') {
    showError(audience, 'audienceError', 'Please select an audience.');
    valid = false;
  } else {
    showSuccess(audience);
  }

  if (!valid) return;

  // Success: save the notice and send a notification to the matching users
  const db = DB.load();
  const text = title.value.trim();

  db.notices.push({
    id: uid(),
    title: text,
    msg: msg.value.trim(),
    audience: audience.value,
    at: new Date().toISOString()
  });

  let sent = 0;
  db.users.forEach(function (x) {
    const wanted = audience.value === 'all' || x.role === audience.value;
    if (x.status === 'active' && x.role !== 'admin' && wanted) {
      notify(db, x.id, 'Notice: ' + text);
      sent++;
    }
  });

  DB.save(db);
  toast('Notice published to ' + sent + ' user' + (sent === 1 ? '' : 's'));
  showPage();
}

// Click on Delete
on('click', '[data-a="delete"]', function (button) {
  if (!confirm('Delete this notice?')) return;

  const db = DB.load();
  db.notices = db.notices.filter(n => n.id != button.dataset.id);
  DB.save(db);

  toast('Notice deleted');
  showPage();
});

showPage();
