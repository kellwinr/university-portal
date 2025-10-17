// Front-end-only dummy login (NOT secure; demo purposes only)
// Demo credentials: ID: 22123456, Password: password123
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
      return;
    }

    const ok = (idVal === '22123456' && pwdVal === 'password123');

    if (ok) {
      status.style.color = '#0a7a25';
      status.textContent = 'Login successful. Redirecting…';
      localStorage.setItem('demo_user', JSON.stringify({ id: idVal, time: Date.now() }));
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } else {
      status.style.color = '#d02b2b';
      status.textContent = 'Invalid credentials (try ID 22123456 / password123).';
    }
  });
});
