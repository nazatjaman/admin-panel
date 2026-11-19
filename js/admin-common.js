/* ADMIN common helpers
   Owner: Admin member
   Used by: admin/*.html (loaded after shared/js/core.js and before the page script)
   Only this person edits this file. */

// ---------- 1. Is the shared folder available? ----------
// If shared/js/core.js did not load, every page would stay blank. Show a message instead.
if (typeof shell === 'undefined') {
  document.body.innerHTML =
    '<div style="font:16px/1.6 Arial,sans-serif;max-width:560px;margin:60px auto;padding:24px;border:2px solid #C8102E;border-radius:12px">' +
    '<b style="color:#C8102E">The shared files were not found.</b><br>' +
    'Open the <b>whole blood-donor-finder folder</b> (the one that has <code>shared</code>, <code>admin</code> and <code>auth</code> inside) ' +
    'in VS Code and start Live Server from there, not from the <code>admin</code> folder alone.</div>';
  throw new Error('shared/js/core.js was not loaded');
}

// ---------- 2. Development switch ----------
// true  = open any admin page directly, you are signed in as the demo admin automatically
// false = normal rule: you must sign in on the login page as an admin first
// Set it to false before you submit the project.
const DEV_AUTO_LOGIN = true;

if (DEV_AUTO_LOGIN) {
  const users = DB.load().users;
  const current = users.find(x => x.id == localStorage.bdfUser);
  if (!current || current.role !== 'admin' || current.status !== 'active') {
    const demoAdmin = users.find(x => x.role === 'admin' && x.status === 'active');
    if (demoAdmin) localStorage.bdfUser = demoAdmin.id;
  }
}

// ---------- Names and colours used on the admin pages ----------
const ROLE_NAME = {
  donor: 'Donor',
  recipient: 'Recipient',
  staff: 'Blood Bank Staff',
  admin: 'Administrator'
};

const STATUS_COLOUR = { active: 'grn', pending: 'amb', blocked: 'red' };

const AUDIENCE_NAME = {
  all: 'All users',
  donor: 'Donors',
  recipient: 'Recipients',
  staff: 'Blood bank staff'
};

// ---------- Small helpers ----------

// "2026-11-02T10:00:00Z"  ->  "02 Nov 2026"
function niceDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// "open"  ->  "Open"
function capital(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------- Form validation helpers (same as the registration form) ----------

// Show error
function showError(input, errorId, message) {
  input.classList.add('errorBorder');
  input.classList.remove('successBorder');
  document.getElementById(errorId).innerHTML = message;
}

// Show success
function showSuccess(input) {
  input.classList.remove('errorBorder');
  input.classList.add('successBorder');
}

// Clear all errors of one form
function clearErrors(formElement) {
  const errors = formElement.querySelectorAll('.error');
  errors.forEach(function (item) {
    item.innerHTML = '';
  });

  const fields = formElement.querySelectorAll('input, select, textarea');
  fields.forEach(function (field) {
    field.classList.remove('errorBorder');
    field.classList.remove('successBorder');
  });
}
