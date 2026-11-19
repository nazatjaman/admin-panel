/* ADMIN reports page (fake donors and false requests)
   Owner: Admin member
   Page: admin/reports.html */

const admin = guard('admin');

let selectedId = null;   // report shown on the right side

function showPage() {
  const db = DB.load();

  // find a user's name by id (the user may have been deleted already)
  function nameOf(id) {
    const person = db.users.find(x => x.id == id);
    return person ? person.name : '(deleted user)';
  }

  // report shown in the detail box: selected one, else first open one, else first one
  const report =
    db.reports.find(x => x.id == selectedId) ||
    db.reports.find(x => x.status === 'open') ||
    db.reports[0];

  const c = shell('admin/reports.html', 'Reports', 'Review reports about fake donors and false requests.');

  // ----- left side: list of reports -----
  let listHtml = '<p class="empty">No reports.</p>';
  if (db.reports.length > 0) {
    const rows = db.reports.map(function (x) {
      const picked = report && x.id === report.id ? 'picked' : '';
      return `<tr class="clickable ${picked}" data-s="${x.id}">
        <td><b>Report #${x.id}: ${E(nameOf(x.reportedId))}</b></td>
        <td>${E(nameOf(x.by))}</td>
        <td>${reportChip(x)}</td>
      </tr>`;
    }).join('');

    listHtml = `<div class="scroll"><table>
      <tr><th>Report</th><th>Reported by</th><th>Status</th></tr>
      ${rows}
    </table></div>`;
  }

  // ----- right side: details of one report -----
  let detailHtml = card('', '<p class="empty">Select a report to see the details.</p>');
  if (report) {
    const target = db.users.find(x => x.id == report.reportedId);
    const before = db.reports.filter(x => x.reportedId == report.reportedId && x.id !== report.id).length;

    let footer;
    if (report.status === 'open') {
      footer = `<div class="actions">
        ${btn('Block user', 'block', report.id, 'pri')}
        ${btn('Send warning', 'warn', report.id)}
        ${btn('Dismiss', 'dismiss', report.id)}
      </div>`;
    } else {
      footer = `<p class="note">Action taken: <b>${E(report.action || 'Closed')}</b></p>`;
    }

    detailHtml = card(
      'Report #' + report.id + ' ' + reportChip(report),
      `<b>${E(nameOf(report.reportedId))}</b>
       <p class="sub">${target ? ROLE_NAME[target.role] + ' · account ' + target.status : 'This account was deleted'}</p>
       <p class="sub">Reported by ${E(nameOf(report.by))}${report.at ? ' on ' + niceDate(report.at) : ''}</p>
       <div class="quote">“${E(report.reason)}”</div>
       <p class="note">Previous reports against this user: <b>${before}</b></p>
       ${footer}`
    );
  }

  c.innerHTML = `<div class="grid2">${card('', listHtml)}${detailHtml}</div>`;
}

// red = open, green = resolved, grey = dismissed
function reportChip(r) {
  const colours = { open: 'red', resolved: 'grn', dismissed: '' };
  return chip(capital(r.status), colours[r.status]);
}

// Click on a report in the list
on('click', '[data-s]', function (row) {
  selectedId = row.dataset.s;
  showPage();
});

// Click on Block user / Send warning / Dismiss
on('click', '[data-a]', function (button) {
  const action = button.dataset.a;

  patch('reports', button.dataset.id, function (r, db) {
    const target = db.users.find(x => x.id == r.reportedId);

    if (action === 'dismiss') {
      r.status = 'dismissed';
      r.action = 'Dismissed';
    } else if (!target) {
      r.status = 'resolved';
      r.action = 'User was already deleted';
    } else if (action === 'block') {
      target.status = 'blocked';
      r.status = 'resolved';
      r.action = 'User blocked';
    } else {
      notify(db, target.id, 'Warning: a report was filed about your activity. Please follow the platform rules.');
      r.status = 'resolved';
      r.action = 'Warning sent';
    }
    r.handledAt = new Date().toISOString();
  });

  const messages = { block: 'User blocked', warn: 'Warning sent', dismiss: 'Report dismissed' };
  toast(messages[action]);
  showPage();   // draw again so the sidebar badge updates
});

showPage();
