import { dom } from './dom.js';

export function createForm(fields, onSubmit) {
  const form = dom.create('form', { class: 'crud-form' });
  fields.forEach(f => {
    const group = dom.create('div', { class: 'form-group' });
    const label = dom.create('label', { text: f.label, for: f.name });
    let input;
    if (f.type === 'select') {
      input = dom.create('select', { name: f.name, class: 'form-control' });
      f.options.forEach(opt => {
        const option = dom.create('option', { value: opt, text: opt });
        if (opt === f.value) option.selected = true;
        input.appendChild(option);
      });
    } else if (f.type === 'textarea') {
      input = dom.create('textarea', { name: f.name, class: 'form-control', rows: f.rows || 3 });
      if (f.value) input.value = f.value;
    } else {
      input = dom.create('input', { type: f.type || 'text', name: f.name, class: 'form-control', placeholder: f.placeholder || '' });
      if (f.value) input.value = f.value;
    }
    group.appendChild(label);
    group.appendChild(input);
    form.appendChild(group);
  });

  const submitBtn = dom.create('button', { type: 'submit', class: 'btn btn-primary', text: 'Submit' });
  form.appendChild(submitBtn);

  dom.on(form, 'submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    // Basic validation: check required fields
    const valid = fields.every(f => {
      if (f.required && !data[f.name]) {
        Notification.error(`${f.label} is required`);
        return false;
      }
      return true;
    });
    if (!valid) return;
    await onSubmit(data);
    form.reset();
  });

  return form;
}
