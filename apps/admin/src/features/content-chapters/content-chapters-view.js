import { getChapterPublishWarning } from './content-chapters-data.js';
import { renderBadge, renderButton, renderEmptyState as renderEmptyStateCard } from '../../ui/primitives.js';

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
  const tone = {
    draft: 'neutral',
    ready: 'warning',
    published: 'success',
    archived: 'muted',
  }[normalized] ?? 'neutral';

  return renderBadge(normalized.toUpperCase(), tone);
}

function renderActionButton({ action, chapterId, label, disabled = false }) {
  return renderButton({
    label,
    variant: 'secondary',
    size: 'sm',
    disabled,
    attrs: {
      'data-chapter-action': action,
      'data-chapter-id': chapterId,
    },
  });
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
  return renderEmptyStateCard('No chapters yet', 'Create a draft chapter to start building the audiobook structure.');
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
          ${renderButton({ label: 'Back to editor', href: `#/content/${encodeURIComponent(audiobookId)}`, variant: 'secondary' })}
          ${renderButton({ label: 'Audit audiobook', href: `#/audit?entityType=audiobook&entityId=${encodeURIComponent(audiobookId)}`, variant: 'secondary' })}
          ${renderButton({ label: 'New chapter', variant: 'primary', attrs: { 'data-chapter-action': 'new' } })}
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
              ${renderButton({
                label: state.status === 'saving' ? 'Saving...' : 'Save chapter',
                variant: 'primary',
                buttonType: 'submit',
                attrs: { 'data-chapter-save': true },
              })}
              ${renderButton({ label: 'Reset draft', variant: 'secondary', attrs: { 'data-chapter-action': 'reset' } })}
              ${
                selectedChapter?.id
                  ? renderButton({
                      label: 'View audit trail',
                      href: `#/audit?entityType=chapter&entityId=${encodeURIComponent(selectedChapter.id)}`,
                      variant: 'secondary',
                    })
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
