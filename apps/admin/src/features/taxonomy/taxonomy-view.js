import {
  getTaxonomyPublishHint,
  getTaxonomyTypeLabel,
  getTaxonomyTypePluralLabel,
} from './taxonomy-data.js';
import { renderBadge, renderButton, renderEmptyState } from '../../ui/primitives.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderTabs(activeType, query) {
  const types = ['author', 'category', 'tag', 'narrator'];
      return `
    <div class="taxonomy-tabs">
      ${types
        .map(
          (type) => `
          <a
            class="taxonomy-tab ${type === activeType ? 'taxonomy-tab-active' : ''}"
            href="#/taxonomy?tab=${encodeURIComponent(type)}${query ? `&query=${encodeURIComponent(query)}` : ''}"
          >
            ${escapeHtml(getTaxonomyTypeLabel(type))}
          </a>
        `,
        )
        .join('')}
    </div>
  `;
}

function renderRowActions(id) {
  return `
    ${renderButton({
      label: 'Edit',
      variant: 'secondary',
      size: 'sm',
      attrs: { 'data-taxonomy-action': 'select', 'data-taxonomy-id': id },
    })}
    ${renderButton({
      label: 'Delete',
      variant: 'secondary',
      size: 'sm',
      attrs: { 'data-taxonomy-action': 'delete', 'data-taxonomy-id': id },
    })}
  `;
}

function renderTable(records, selectedId) {
  if (records.length === 0) {
    return renderEmptyState('No taxonomy found', 'Try a different search query or create a new item.');
  }

  return `
    <div class="table-wrap">
      <table class="content-table taxonomy-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Usage</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map(
              (record) => `
              <tr class="${record.id === selectedId ? 'taxonomy-row-selected' : ''}">
                <td>
                  <div class="content-title">${escapeHtml(record.name)}</div>
                  <div class="content-subtitle">${escapeHtml(record.description || 'No description')}</div>
                </td>
                <td>${escapeHtml(record.slug)}</td>
                <td>${escapeHtml(String(record.usageCount))}</td>
                <td>${renderBadge(record.isActive ? 'ACTIVE' : 'INACTIVE', record.isActive ? 'success' : 'muted')}</td>
                <td>
                  <div class="taxonomy-actions">
                    ${renderRowActions(record.id)}
                  </div>
                </td>
              </tr>
            `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function renderTaxonomyManagerView({ state }) {
  const selectedRecord = state.records.find((record) => record.id === state.selectedId) ?? null;
  const typeLabel = getTaxonomyTypeLabel(state.type);
  const pluralLabel = getTaxonomyTypePluralLabel(state.type);
  const warning = selectedRecord ? getTaxonomyPublishHint(state.type, state.draft) : '';

  return `
    <div class="panel taxonomy-panel">
      <div class="panel-head">
        <div>
          <div class="panel-kicker">Taxonomy</div>
          <h2>${escapeHtml(pluralLabel)}</h2>
          <p>Manage authors, categories, tags, and narrators from one shared source.</p>
        </div>
        <div class="panel-actions">
          ${renderButton({ label: 'Back to dashboard', href: '#/dashboard', variant: 'secondary' })}
          ${renderButton({
            label: `New ${escapeHtml(typeLabel)}`,
            variant: 'primary',
            attrs: { 'data-taxonomy-action': 'new' },
          })}
        </div>
      </div>

      ${renderTabs(state.type, state.query)}

      <form class="taxonomy-search" data-taxonomy-search-form>
        <label class="editor-label">
          <span>Search</span>
          <input
            name="query"
            type="search"
            value="${escapeHtml(state.query)}"
            placeholder="Search by name, slug, or description"
          />
        </label>
        <input type="hidden" name="tab" value="${escapeHtml(state.type)}" />
        ${renderButton({ label: 'Filter', variant: 'primary', buttonType: 'submit' })}
        ${renderButton({
          label: 'Clear',
          variant: 'secondary',
          attrs: { 'data-taxonomy-action': 'clear-search' },
        })}
      </form>

      <div class="dashboard-meta">
        <div>${escapeHtml(String(state.filteredRecords.length))} result(s)</div>
        <div>Selected: ${escapeHtml(selectedRecord?.name ?? 'New draft')}</div>
        <div>Type: ${escapeHtml(typeLabel)}</div>
        <div>State: ${escapeHtml(String(state.status ?? 'editing'))}</div>
      </div>

      ${state.message ? `<div class="alert alert-success">${escapeHtml(state.message)}</div>` : ''}
      ${state.status === 'error' && state.message ? `<div class="alert alert-error">${escapeHtml(state.message)}</div>` : ''}
      ${warning ? `<div class="alert alert-warning">${escapeHtml(warning)}</div>` : ''}

      <section class="editor-grid">
        <div class="editor-column">
          <div class="panel">
            <div class="panel-kicker">List</div>
            ${renderTable(state.filteredRecords, state.selectedId)}
          </div>
        </div>

        <div class="editor-column">
          <form class="panel taxonomy-form" data-taxonomy-form>
            <div class="panel-kicker">Draft</div>
            <div class="editor-fields">
              <label class="editor-label">
                <span>Name</span>
                <input name="name" value="${escapeHtml(state.draft.name)}" placeholder="Enter name" />
                ${state.errors.name ? `<small class="field-error">${escapeHtml(state.errors.name)}</small>` : ''}
              </label>

              <label class="editor-label">
                <span>Slug</span>
                <input name="slug" value="${escapeHtml(state.draft.slug)}" placeholder="enter-slug" />
                ${state.errors.slug ? `<small class="field-error">${escapeHtml(state.errors.slug)}</small>` : ''}
              </label>

              <label class="editor-label">
                <span>Description</span>
                <textarea name="description" rows="5" placeholder="Optional description">${escapeHtml(state.draft.description)}</textarea>
              </label>

              <label class="checkbox-inline">
                <input name="isActive" type="checkbox" ${state.draft.isActive ? 'checked' : ''} />
                <span>Active</span>
              </label>

              <div class="detail-grid">
                <div class="detail-card">
                  <div class="detail-label">Usage count</div>
                  <div>${escapeHtml(String(state.draft.usageCount ?? 0))}</div>
                </div>
                <div class="detail-card">
                  <div class="detail-label">Selected id</div>
                  <div>${escapeHtml(state.draft.id || 'new')}</div>
                </div>
              </div>
            </div>

            <div class="editor-actions">
              ${renderButton({ label: state.status === 'saving' ? 'Saving...' : 'Save taxonomy', variant: 'primary', buttonType: 'submit' })}
              ${renderButton({
                label: 'Reset',
                variant: 'secondary',
                attrs: { 'data-taxonomy-action': 'reset' },
              })}
              ${renderButton({
                label: 'Delete',
                variant: 'secondary',
                attrs: { 'data-taxonomy-action': 'delete-draft' },
              })}
            </div>
          </form>
        </div>
      </section>
    </div>
  `;
}
