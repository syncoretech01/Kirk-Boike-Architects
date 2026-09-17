/* Contact form: inline validation, busy state, then hands off to the visitor's email app. */
export function initContact() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const submit = form.querySelector('.form__submit');

  const fieldOf = (input) => input.closest('.field');
  const setErr = (input, msg) => {
    const f = fieldOf(input);
    const err = f.querySelector('.field__err');
    f.classList.toggle('is-invalid', !!msg);
    if (err) err.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  const validate = () => {
    let ok = true;
    const name = form.name, email = form.email, message = form.message;
    if (!name.value.trim()) { setErr(name, 'Please add your name.'); ok = false; } else setErr(name, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setErr(email, 'Please add a valid email address.'); ok = false; } else setErr(email, '');
    if (message.value.trim().length < 12) { setErr(message, 'A sentence or two about the project helps us prepare.'); ok = false; } else setErr(message, '');
    return ok;
  };
  ['name', 'email', 'message'].forEach((n) => form[n].addEventListener('input', () => { if (fieldOf(form[n]).classList.contains('is-invalid')) validate(); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.className = 'form__status';
    status.textContent = '';
    if (!validate()) { status.classList.add('is-err'); status.textContent = 'A couple of fields need attention.'; return; }
    submit.classList.add('is-busy');
    submit.disabled = true;
    const d = Object.fromEntries(new FormData(form).entries());
    const body = [
      `Name: ${d.name}`, `Email: ${d.email}`, `Phone: ${d.phone || '-'}`,
      `Property: ${d.site || '-'}`, `Project type: ${d.type}`, '', d.message,
    ].join('\n');
    const href = `mailto:hello@kirkboikearchitects.com?subject=${encodeURIComponent(`Consultation request from ${d.name}`)}&body=${encodeURIComponent(body)}`;
    setTimeout(() => {
      submit.classList.remove('is-busy');
      submit.disabled = false;
      window.location.href = href;
      status.classList.add('is-ok');
      status.textContent = `Thanks, ${d.name.split(' ')[0]}. Your message is ready to send from your email app. Prefer to talk? Call +1 360-385-6140.`;
      form.reset();
    }, 900);
  });
}
