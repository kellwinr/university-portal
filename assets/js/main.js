// Front-end demo only (not secure).
// Demo users (ID → { name, password })
const USERS = {
  "22123456": { name: "Demo Student", password: "password123" },
  // Add more if you like:
  // "22111111": { name: "Kelvin Lim", password: "pass123" },
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const id = document.getElementById('id');
  const pwd = document.getElementById('pwd');
  const status = document.getElementById('status');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const idVal = (id.value || '').trim();
    const pwdVal = (pwd.value || '').trim();

    if (!idVal || !pwdVal) {
      status.textContent = 'Please enter both Student ID and Password.';
      status.style.color = '#d02b2b';
      return;
    }

    const user = USERS[idVal];

    if (user && user.password === pwdVal) {
      status.style.color = '#0a7a25';
      status.textContent = 'Login successful. Redirecting…';

      // Save BOTH id and name for the dashboard greeting
      localStorage.setItem('demo_user', JSON.stringify({
        id: idVal,
        name: user.name,
        time: Date.now()
      }));

      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } else {
      status.style.color = '#d02b2b';
      status.textContent = 'Invalid credentials (try ID 22123456 / password123).';
    }
  });
});
