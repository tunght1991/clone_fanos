import { getAuditActionLabel, getAuditEntityLabel, summarizeAuditTrail } from './audit-data.js';
import { renderBadge, renderButton, renderEmptyState } from '../../ui/primitives.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function renderEntityTypeOption(type, selectedType) {
  const label = getAuditEntityLabel(type);
  return `<option value="${escapeHtml(type)}" ${type === selectedType ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

function renderTrailRows(entries) {
  return entries
    .map(
      (entry) => `
        <tr>
          <td>${renderBadge(getAuditActionLabel(entry.action), entry.action === 'unpublish' ? 'warning' : 'success')}</td>
          <td>
            <div class="content-title">${escapeHtml(entry.entityTitle || entry.entityId)}</div>
            <div class="content-subtitle">${escapeHtml(entry.entityType)} · ${escapeHtml(entry.entityId)}</div>
          </td>
          <td>${escapeHtml(entry.actorRole ?? 'ADMIN')}</td>
          <td>${escapeHtml(entry.actorUserId ?? 'system')}</td>
          <td>${renderBadge(String(entry.payloadJson?.reindexStatus ?? 'pending'), entry.payloadJson?.reindexStatus === 'done' ? 'success' : 'warning')}</td>
          <td>${escapeHtml(formatDate(entry.createdAt))}</td>
        </tr>
      `,
    )
    .join('');
}

function renderTimeline(entries) {
  if (entries.length === 0) {
    return renderEmptyState('Audit trail is empty', 'No publish or unpublish actions were recorded yet.');
  }

  return `
    <div class="timeline">
      ${entries
        .slice(0, 5)
        .map(
          (entry) => `
            <article class="timeline-item">
              <div class="timeline-dot"></div>
              <div>
                <div class="content-title">${escapeHtml(getAuditActionLabel(entry.action))} ${escapeHtml(entry.entityType)}</div>
                <div class="content-subtitle">${escapeHtml(entry.entityTitle || entry.entityId)} · ${escapeHtml(formatDate(entry.createdAt))}</div>
              </div>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

export function renderAuditTrailView({ state, entityOptions = [] }) {
  const summary = summarizeAuditTrail(state.entries);
  const currentEntityOptions = Array.isArray(entityOptions) ? entityOptions : [];
  const hasEntityOptions = currentEntityOptions.length > 0;
  const isLoading = state.status === 'loading';
  const hasError = state.status === 'error';

  return `
    <div class="panel audit-panel">
      <div class="panel-head">
        <div>
          <div class="panel-kicker">Publish / audit trail</div>
          <h2>Audit trail</h2>
          <p>Track publish/unpublish actions and inspect the latest status by entity.</p>
        </div>
        <div class="panel-actions">
          ${renderButton({ label: 'Back to dashboard', href: '#/dashboard', variant: 'secondary' })}
          ${renderButton({ label: 'Open content', href: '#/content', variant: 'secondary' })}
        </div>
      </div>

      <div class="dashboard-meta">
        <div>Total: ${escapeHtml(String(summary.total))}</div>
        <div>Publish: ${escapeHtml(String(summary.published))}</div>
        <div>Unpublish: ${escapeHtml(String(summary.unpublished))}</div>
        <div>Entity: ${escapeHtml(state.filters.entityType)} ${state.filters.entityId ? `#${escapeHtml(state.filters.entityId)}` : '(recent)'}</div>
      </div>

      ${
        isLoading
          ? `
            <div class="inline-loading">
              <div class="spinner spinner-small"></div>
              <span>Loading audit trail...</span>
            </div>
          `
          : ''
      }

      ${hasError ? `<div class="alert alert-error">${escapeHtml(state.errorMessage || 'Unable to load audit trail.')}</div>` : ''}

      <div class="audit-grid">
        <div class="panel">
          <div class="panel-kicker">Status timeline</div>
          ${renderTimeline(state.entries)}
        </div>

        <form class="panel audit-filter" data-audit-filter-form>
          <div class="panel-kicker">Filter</div>
          <label class="editor-label">
            <span>Entity type</span>
            <select name="entityType">
              ${renderEntityTypeOption('audiobook', state.filters.entityType)}
              ${renderEntityTypeOption('chapter', state.filters.entityType)}
            </select>
          </label>
          <label class="editor-label">
            <span>Entity</span>
            <select name="entityId" ${hasEntityOptions ? '' : 'disabled'}>
              <option value="">Recent events</option>
              ${currentEntityOptions
                .map((entity) => `<option value="${escapeHtml(entity.id)}" ${entity.id === state.filters.entityId ? 'selected' : ''}>${escapeHtml(entity.label)}</option>`)
                .join('')}
            </select>
          </label>
          <label class="editor-label">
            <span>Search</span>
            <input name="query" type="search" value="${escapeHtml(state.filters.query ?? '')}" placeholder="Search entity, actor or action" />
          </label>
          <div class="editor-actions">
            ${renderButton({ label: 'Refresh', variant: 'primary', buttonType: 'submit' })}
            ${renderButton({
              label: 'Reset',
              variant: 'secondary',
              attrs: { 'data-audit-action': 'reset' },
            })}
          </div>
        </form>
      </div>

      <div class="table-wrap">
        <table class="content-table audit-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Role</th>
              <th>Actor</th>
              <th>Reindex</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${
              state.entries.length > 0
                ? renderTrailRows(state.entries)
                : isLoading
                  ? '<tr><td colspan="6"><div class="empty-inline">Loading audit trail...</div></td></tr>'
                  : '<tr><td colspan="6"><div class="empty-inline">Audit trail is empty.</div></td></tr>'
            }
          </tbody>
        </table>
      </div>

      ${state.message ? `<div class="alert alert-success">${escapeHtml(state.message)}</div>` : ''}
      ${state.errorMessage ? `<div class="alert alert-error">${escapeHtml(state.errorMessage)}</div>` : ''}
    </div>
  `;
}
