import { getChapterPublishWarning } from './content-chapters-data.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDuration(seconds) {
  const total = Number(seconds ?? 0);
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  const hours = Math.floor(safeTotal / 3600);
  const minutes = Math.floor((safeTotal % 3600) / 60);
  const remainingSeconds = safeTotal % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function renderStatusBadge(status) {
  const normalized = String(status ?? 'draft').toLowerCase();
  const badgeClass = {
    draft: 'badge badge-neutral',
    ready: 'badge badge-warning',
    published: 'badge badge-success',
    archived: 'badge badge-muted',
  }[normalized] ?? 'badge';

  return `<span class="${badgeClass}">${escapeHtml(normalized.toUpperCase())}</span>`;
}

function renderActionButton({ action, chapterId, label, disabled = false }) {
  return `
    <button
      type="button"
      class="button button-secondary button-sm"
      data-chapter-action="${escapeHtml(action)}"
      data-chapter-id="${escapeHtml(chapterId)}"
      ${disabled ? 'disabled' : ''}
    >
      ${escapeHtml(label)}
    </button>
  `;
}

function renderChapterRow(chapter, selectedChapterId, { publishActionsDisabled = false } = {}) {
  const isSelected = chapter.id === selectedChapterId;
  const upDisabled = Number(chapter.orderIndex) <= 1;
  const downDisabled = false;
  const publishAction = chapter.status === 'published' ? 'unpublish' : 'publish';
  const publishLabel = chapter.status === 'published' ? 'Unpublish' : 'Publish';

  return `
    <tr class="${isSelected ? 'chapter-row-selected' : ''}">
      <td>
        <div class="content-title">#${escapeHtml(String(chapter.orderIndex))}</div>
        <div class="content-subtitle">${escapeHtml(chapter.id || 'new')}</div>
      </td>
      <td>
        <div class="content-title">${escapeHtml(chapter.title || 'Untitled chapter')}</div>
        <div class="content-subtitle">${escapeHtml(chapter.audioFileName || chapter.audioAssetKey || 'No audio yet')}</div>
      </td>
      <td>${escapeHtml(formatDuration(chapter.durationSec))}</td>
      <td>${renderStatusBadge(chapter.status)}</td>
      <td>
        <div class="chapter-actions">
          ${renderActionButton({ action: 'select', chapterId: chapter.id, label: 'Edit' })}
          ${renderActionButton({ action: 'up', chapterId: chapter.id, label: 'Up', disabled: upDisabled })}
          ${renderActionButton({ action: 'down', chapterId: chapter.id, label: 'Down', disabled: downDisabled })}
          ${renderActionButton({ action: publishAction, chapterId: chapter.id, label: publishLabel, disabled: publishActionsDisabled })}
        </div>
      </td>
    </tr>
  `;
}

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h2>No chapters yet</h2>
      <p>Create a draft chapter to start building the audiobook structure.</p>
    </div>
  `;
}

function renderFieldError(error) {
  return error ? `<small class="field-error">${escapeHtml(error)}</small>` : '';
}

export function renderChapterManagerView({ state }) {
  const audiobookId = state.audiobook?.id ?? state.draft.audiobookId ?? '';
  const warning = getChapterPublishWarning(state.draft);
  const selectedChapter = state.chapters.find((chapter) => chapter.id === state.selectedChapterId) ?? null;
  const chapterCount = state.chapters.length;
  const selectedLabel = selectedChapter ? selectedChapter.title : 'Draft chapter';
  const publishActionsDisabled = ['saving', 'uploading', 'confirming', 'publishing', 'unpublishing'].includes(state.status);

  return `
    <div class="panel chapter-panel">
      <div class="panel-head">
        <div>
          <div class="panel-kicker">Chapter manager</div>
          <h2>${escapeHtml(state.audiobook?.title ?? 'Chapter manager')}</h2>
          <p>Manage chapter order, upload audio, and publish state for this audiobook.</p>
        </div>
        <div class="panel-actions">
          <a class="button button-secondary" href="#/content/${encodeURIComponent(audiobookId)}">Back to editor</a>
          <a class="button button-secondary" href="#/audit?entityType=audiobook&entityId=${encodeURIComponent(audiobookId)}">Audit audiobook</a>
          <button class="button button-primary" type="button" data-chapter-action="new">New chapter</button>
        </div>
      </div>

      ${warning ? `<div class="alert alert-warning">${escapeHtml(warning)}</div>` : ''}
      ${state.message ? `<div class="alert alert-success">${escapeHtml(state.message)}</div>` : ''}
      ${state.status === 'validation_error' && Object.keys(state.errors).length > 0 ? `<div class="alert alert-error">Please fix the highlighted fields.</div>` : ''}

      <div class="dashboard-meta">
        <div>${escapeHtml(String(chapterCount))} chapter(s)</div>
        <div>Selected: ${escapeHtml(selectedLabel)}</div>
        <div>Next order: ${escapeHtml(String(state.draft.orderIndex))}</div>
        <div>Status: ${escapeHtml(String(state.draft.status ?? 'draft').toUpperCase())}</div>
      </div>

      ${
        state.uploadStatus === 'uploading'
          ? `
            <div class="inline-loading">
              <div class="spinner spinner-small"></div>
              <span>Uploading audio...</span>
            </div>
          `
          : ''
      }

      <section class="editor-grid">
        <div class="editor-column">
          <div class="panel">
            <div class="panel-kicker">Chapter list</div>
            ${
              chapterCount > 0
                ? `
                  <div class="table-wrap">
                    <table class="content-table chapter-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Chapter</th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        ${state.chapters.map((chapter) => renderChapterRow(chapter, state.selectedChapterId, { publishActionsDisabled })).join('')}
                      </tbody>
                  </table>
                </div>
                `
                : renderEmptyState()
            }
          </div>
        </div>

        <div class="editor-column">
          <form class="panel chapter-form" data-chapter-form>
            <div class="panel-kicker">Chapter draft</div>
            <div class="editor-fields">
              <label class="editor-label">
                <span>Title</span>
                <input name="title" value="${escapeHtml(state.draft.title)}" placeholder="Enter chapter title" />
                ${renderFieldError(state.errors.title)}
              </label>

              <div class="two-col">
                <label class="editor-label">
                  <span>Order</span>
                  <input name="orderIndex" type="number" min="1" value="${escapeHtml(String(state.draft.orderIndex))}" />
                  ${renderFieldError(state.errors.orderIndex)}
                </label>
                <label class="editor-label">
                  <span>Duration (sec)</span>
                  <input name="durationSec" type="number" min="0" value="${escapeHtml(String(state.draft.durationSec))}" />
                  ${renderFieldError(state.errors.durationSec)}
                </label>
              </div>

              <label class="editor-label">
                <span>Audio asset key</span>
                <input name="audioAssetKey" value="${escapeHtml(state.draft.audioAssetKey)}" placeholder="audio/..." />
                ${renderFieldError(state.errors.audioAssetKey)}
              </label>

              <label class="editor-label">
                <span>Upload audio file</span>
                <input name="audioFile" type="file" accept="audio/*" data-chapter-audio-input />
                <div class="field-hint">Selecting a file updates the local audio asset key and preview metadata.</div>
              </label>

              <label class="editor-label">
                <span>Transcript</span>
                <textarea name="transcript" rows="8" placeholder="Optional transcript">${escapeHtml(state.draft.transcript)}</textarea>
              </label>

              <div class="detail-grid">
                <div class="detail-card">
                  <div class="detail-label">Audio file</div>
                  <div>${escapeHtml(state.draft.audioFileName || 'No file selected')}</div>
                </div>
                <div class="detail-card">
                  <div class="detail-label">Selected chapter</div>
                  <div>${escapeHtml(selectedChapter?.title ?? 'New draft')}</div>
                </div>
              </div>
            </div>

            <div class="editor-actions">
              <button class="button button-primary" type="submit" data-chapter-save>
                ${state.status === 'saving' ? 'Saving...' : 'Save chapter'}
              </button>
              <button class="button button-secondary" type="button" data-chapter-action="reset">
                Reset draft
              </button>
              ${
                selectedChapter?.id
                  ? `<a class="button button-secondary" href="#/audit?entityType=chapter&entityId=${encodeURIComponent(selectedChapter.id)}">View audit trail</a>`
                  : ''
              }
            </div>
          </form>
        </div>
      </section>

      <div class="editor-footnote">
        Chapter manager is connected to the admin content module and falls back to local state when the chapter list API is unavailable.
      </div>
    </div>
  `;
}
