function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function attrsToString(attrs = {}) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => {
      if (value === true) {
        return `${key}`;
      }

      return `${key}="${escapeHtml(value)}"`;
    })
    .join(' ');
}

export function renderButton({
  label,
  href = null,
  buttonType = 'button',
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  attrs = {},
}) {
  const classes = ['button', `button-${variant}`];
  if (size === 'sm') {
    classes.push('button-sm');
  }
  if (disabled) {
    classes.push('button-disabled');
  }
  if (className) {
    classes.push(className);
  }

  const extraAttrs = attrsToString(attrs);
  const renderedAttrs = extraAttrs ? ` ${extraAttrs}` : '';

  if (href) {
    return `<a class="${classes.join(' ')}" href="${escapeHtml(href)}"${renderedAttrs}>${escapeHtml(label)}</a>`;
  }

  return `<button class="${classes.join(' ')}" type="${escapeHtml(buttonType)}"${disabled ? ' disabled' : ''}${renderedAttrs}>${escapeHtml(label)}</button>`;
}

export function renderBadge(label, tone = 'neutral', extraClass = '') {
  const classes = ['badge'];
  if (tone) {
    classes.push(`badge-${tone}`);
  }
  if (extraClass) {
    classes.push(extraClass);
  }

  return `<span class="${classes.join(' ')}">${escapeHtml(label)}</span>`;
}

export function renderAlert(message, tone = 'error') {
  return `<div class="alert alert-${escapeHtml(tone)}">${escapeHtml(message)}</div>`;
}

export function renderEmptyState(title, description, actionHtml = '') {
  return `
    <div class="empty-state">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
      ${actionHtml}
    </div>
  `;
}

export function renderPanel({ kicker = '', title, description = '', actions = '', body = '', className = '' }) {
  const classes = ['panel'];
  if (className) {
    classes.push(className);
  }

  return `
    <section class="${classes.join(' ')}">
      <div class="panel-head">
        <div>
          ${kicker ? `<div class="panel-kicker">${escapeHtml(kicker)}</div>` : ''}
          <h2>${escapeHtml(title)}</h2>
          ${description ? `<p>${escapeHtml(description)}</p>` : ''}
        </div>
        ${actions ? `<div class="panel-actions">${actions}</div>` : ''}
      </div>
      ${body}
    </section>
  `;
}

export function renderField({
  label,
  name,
  value = '',
  type = 'text',
  placeholder = '',
  hint = '',
  error = '',
  required = false,
  inputClass = '',
  as = 'input',
  options = [],
  attrs = {},
}) {
  const commonAttrs = attrsToString({
    name,
    required: required || undefined,
    ...attrs,
  });
  const errorHtml = error ? `<small class="field-error">${escapeHtml(error)}</small>` : '';
  const hintHtml = hint ? `<div class="field-hint">${escapeHtml(hint)}</div>` : '';

  let control = '';
  if (as === 'textarea') {
    control = `<textarea ${commonAttrs} rows="${attrs.rows ?? 5}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>`;
  } else if (as === 'select') {
    control = `
      <select ${commonAttrs}>
        ${options
          .map((option) => {
            const selected = String(option.value) === String(value) ? 'selected' : '';
            return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
          })
          .join('')}
      </select>
    `;
  } else {
    control = `<input ${commonAttrs} type="${escapeHtml(type)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" />`;
  }

  return `
    <label class="editor-label ${inputClass}">
      <span>${escapeHtml(label)}</span>
      ${control}
      ${errorHtml}
      ${hintHtml}
    </label>
  `;
}

export function renderListItem(title, subtitle = '', trailingHtml = '') {
  return `
    <div class="detail-card">
      <div class="detail-label">${escapeHtml(title)}</div>
      ${subtitle ? `<div>${escapeHtml(subtitle)}</div>` : ''}
      ${trailingHtml}
    </div>
  `;
}
