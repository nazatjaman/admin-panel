/* ADMIN users page (approve, block, unblock, delete)
   Owner: Admin member
   Page: admin/users.html */

const admin = guard('admin');

let currentTab = 'all';   // which filter button is selected
let searchText = '';      // what the admin typed in the search box

const TABS = [
  ['all', 'All'],
  ['donor', 'Donors'],
  ['recipient', 'Recipients'],
  ['staff', 'Staff'],
  ['pending', 'Pending']
];

// Draw the whole page (title, sidebar, search box, buttons, table)
function showPage() {
  const c = shell('admin/users.html', 'Users', 'Approve, block or delete accounts.');

  c.innerHTML = `
    <div class="toolbar">
      <input class="inp" id="search" placeholder="Search name or email" value="${E(searchText)}">
      <div class="tabs" id="tabs"></div>
    </div>
    <div id="list"></div>`;

  drawTabs();
  drawList();

  // typing only redraws the table, so the cursor stays in the box
  $('#search').oninput = function () {
    searchText = this.value.trim().toLowerCase();
    drawList();
  };
}

// Filter buttons: All, Donors, Recipients, Staff, Pending (n)
function drawTabs() {
  const db = DB.load();
  const pendingCount = db.users.filter(x => x.status === 'pending').length;

  $('#tabs').innerHTML = TABS.map(function (tab) {
    const key = tab[0];
    const label = key === 'pending' ? tab[1] + ' (' + pendingCount + ')' : tab[1];
    return `<button class="btn ${key === currentTab ? 'pri' : 'ghost'}" data-t="${key}">${label}</button>`;
  }).join('');
}

// Buttons shown at the end of each row
function userButtons(x) {
  if (x.status === 'pending') {
    return btn('Approve', 'approve', x.id, 'pri') + btn('Reject', 'reject', x.id);
  }
  if (x.status === 'blocked') {
    return btn('Unblock', 'unblock', x.id) + btn('Delete', 'delete', x.id);
  }
  return btn('Block', 'block', x.id) + btn('Delete', 'delete', x.id);
}

// The users table
function drawList() {
  const db = DB.load();

  const list = db.users.filter(function (x) {
    if (x.role === 'admin') return false;                                   // admin is never listed
    if (currentTab === 'pending') return x.status === 'pending' && matchesSearch(x);
    if (currentTab !== 'all' && x.role !== currentTab) return false;
    return matchesSearch(x);
  });

  if (list.length === 0) {
    $('#list').innerHTML = card('', '<p class="empty">No users found.</p>');
    return;
  }

  const rows = list.map(function (x) {
    return [
      `<div class="who"><b>${E(x.name)}</b><small>${E(x.email)}</small></div>`,
      chip(ROLE_NAME[x.role], 'blu'),
      E(x.area) || '—',
      chip(capital(x.status), STATUS_COLOUR[x.status]),
      `<div class="actions">${userButtons(x)}</div>`
    ];
  });

  $('#list').innerHTML = card('', table(['User', 'Role', 'Area', 'Status', 'Actions'], rows));
}

function matchesSearch(x) {
  return (x.name + ' ' + x.email).toLowerCase().includes(searchText);
}

// Click on a filter button
on('click', '[data-t]', function (button) {
  currentTab = button.dataset.t;
  drawTabs();
  drawList();
});

// Click on Approve / Reject / Block / Unblock / Delete
on('click', '[data-a]', function (button) {
  const userId = button.dataset.id;
  const action = button.dataset.a;

  if ((action === 'delete' || action === 'reject') && !confirm('Remove this user? This cannot be undone.')) {
    return;
  }

  patch('users', userId, function (person, db) {
    if (action === 'approve') {
      person.status = 'active';
      notify(db, person.id, 'Your account was approved. You can sign in.', '../auth/login.html');
    } else if (action === 'block') {
      person.status = 'blocked';
    } else if (action === 'unblock') {
      person.status = 'active';
    } else {
      db.users = db.users.filter(x => x.id != person.id);   // reject or delete
    }
  });

  const messages = {
    approve: 'Account approved',
    reject: 'Account rejected',
    block: 'User blocked',
    unblock: 'User unblocked',
    delete: 'User deleted'
  };
  toast(messages[action]);
  showPage();   // draw again so the sidebar badge and counts update
});

showPage();
