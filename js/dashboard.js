/* ADMIN overview page
   Owner: Admin member
   Page: admin/dashboard.html */

const admin = guard('admin');   // only an active admin can open this page

function showPage() {
  const db = DB.load();

  // ----- numbers for the four cards -----
  const people = db.users.filter(x => x.role !== 'admin');
  const activeDonors = db.users.filter(x => x.role === 'donor' && x.status === 'active');
  const pending = db.users.filter(x => x.status === 'pending');
  const openReports = db.reports.filter(x => x.status === 'open');

  // ----- donors per blood group -----
  const perGroup = {};
  GROUPS.forEach(function (group) {
    perGroup[group] = activeDonors.filter(x => x.bloodGroup === group).length;
  });

  // ----- requests by status -----
  const perStatus = { Open: 0, Accepted: 0, Fulfilled: 0, Expired: 0, Cancelled: 0 };
  db.requests.forEach(function (r) {
    const name = capital(r.status);
    perStatus[name] = (perStatus[name] || 0) + 1;
  });

  // ----- page layout (sidebar + title) -----
  const c = shell(
    'admin/dashboard.html',
    'Overview',
    'Platform activity and items that need your attention.',
    `<a class="btn pri" href="../admin/notices.html">${ic('file')}Publish notice</a>`
  );

  // ----- pending approvals table -----
  let approvals = '<p class="empty">No accounts are waiting for approval.</p>';
  if (pending.length > 0) {
    const rows = pending.map(function (x) {
      return [
        `<b>${E(x.name)}</b>`,
        ROLE_NAME[x.role],
        E(x.area) || '—',
        `<div class="actions end">${btn('Approve', 'approve', x.id, 'pri')}${btn('Reject', 'reject', x.id)}</div>`
      ];
    });
    approvals = table(['Name', 'Role', 'Area', ''], rows);
  }

  const colours = ['#C8102E', '#2F5BD3', '#12B76A', '#F5A524', '#98A0B8'];

  c.innerHTML =
    kpis([
      ['users', 'Registered users', people.length, 'Donors, recipients and staff'],
      ['drop', 'Active donors', activeDonors.length, 'Can receive alerts'],
      ['bell', 'Open requests', perStatus.Open, 'Awaiting a donor'],
      ['shield', 'Pending actions', pending.length + openReports.length, pending.length + ' approvals · ' + openReports.length + ' reports']
    ]) +
    `<div class="grid2 gap-bottom">
       ${card('Donors per blood group', bars(perGroup))}
       ${card('Requests by status', donut(perStatus, colours))}
     </div>` +
    card('Pending approvals', approvals);
}

// Approve or reject a pending account
on('click', '[data-a]', function (button) {
  const userId = button.dataset.id;
  const action = button.dataset.a;

  if (action === 'reject' && !confirm('Reject this account? It will be removed.')) {
    return;
  }

  patch('users', userId, function (person, db) {
    if (action === 'approve') {
      person.status = 'active';
      notify(db, person.id, 'Your account was approved. You can sign in.', '../auth/login.html');
    } else {
      db.users = db.users.filter(x => x.id != person.id);
    }
  });

  toast(action === 'approve' ? 'Account approved' : 'Account rejected');
  showPage();   // draw again so the numbers and the sidebar badge update
});

showPage();
