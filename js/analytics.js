/* ADMIN analytics page
   Owner: Admin member
   Page: admin/analytics.html */

const admin = guard('admin');

const db = DB.load();

// ---------- 1. Donors per blood group ----------
const perGroup = {};
GROUPS.forEach(function (group) {
  perGroup[group] = db.users.filter(x => x.role === 'donor' && x.status === 'active' && x.bloodGroup === group).length;
});

// ---------- 2. Requests per month (last 6 months) ----------
const months = [];
const now = new Date();
for (let i = 5; i >= 0; i--) {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  months.push({
    key: d.getFullYear() + '-' + d.getMonth(),
    label: d.toLocaleString('en', { month: 'short' }),
    count: 0
  });
}
db.requests.forEach(function (r) {
  const d = new Date(r.createdAt);
  const month = months.find(m => m.key === d.getFullYear() + '-' + d.getMonth());
  if (month) month.count++;
});

// ---------- 3. Requests by urgency ----------
const perUrgency = { High: 0, Medium: 0, Low: 0 };
db.requests.forEach(function (r) {
  perUrgency[URG[r.urgency][0]]++;
});

// ---------- 4. Requests by area (biggest first) ----------
const areaCount = {};
AREAS.forEach(function (area) { areaCount[area] = 0; });
db.requests.forEach(function (r) {
  areaCount[r.area] = (areaCount[r.area] || 0) + 1;
});
const perArea = {};
Object.entries(areaCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(function (pair) { perArea[pair[0]] = pair[1]; });

// ---------- Line chart for requests per month ----------
function lineChart() {
  const biggest = Math.max(...months.map(m => m.count), 1);
  const points = months.map((m, i) => [20 + i * 56, 115 - (m.count / biggest) * 85]);

  return `<svg viewBox="0 0 320 150" width="100%">
    <line x1="10" y1="115" x2="310" y2="115" stroke="#E8EAF2"/>
    <polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="#C8102E" stroke-width="3" stroke-linejoin="round"/>
    ${points.map((p, i) => `
      <circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#C8102E"/>
      <text x="${p[0]}" y="${p[1] - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="#17193B">${months[i].count}</text>
      <text x="${p[0]}" y="140" text-anchor="middle" font-size="11" fill="#6B7194">${months[i].label}</text>`).join('')}
  </svg>`;
}

// ---------- Draw the page ----------
const c = shell(
  'admin/analytics.html',
  'Analytics',
  'How the platform is being used.',
  `<button class="btn ghost" id="download">${ic('file')}Download report</button>`
);

c.innerHTML = `<div class="g" style="grid-template-columns:1fr 1fr">
  ${card('Donors per blood group', bars(perGroup))}
  ${card('Requests per month', lineChart())}
  ${card('Requests by urgency', donut(perUrgency, ['#C8102E', '#F5A524', '#12B76A']))}
  ${card('Requests by area', hbars(perArea))}
</div>`;

// ---------- Download report (a CSV file that opens in Excel) ----------
$('#download').onclick = function () {
  const lines = ['Section,Label,Value'];

  function addRows(section, data) {
    Object.entries(data).forEach(function (pair) {
      lines.push(section + ',' + pair[0] + ',' + pair[1]);
    });
  }

  addRows('Donors per blood group', perGroup);
  addRows('Requests per month', Object.fromEntries(months.map(m => [m.label, m.count])));
  addRows('Requests by urgency', perUrgency);
  addRows('Requests by area', perArea);

  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  link.download = 'blood-donor-finder-report-' + today() + '.csv';
  link.click();
  URL.revokeObjectURL(link.href);

  toast('Report downloaded');
};
