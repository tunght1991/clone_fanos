import {
  filterEditorOptions,
  getEditorPublishWarning,
} from './content-editor-data.js';
import {
  DEMO_AUTHOR_OPTIONS,
  DEMO_CATEGORY_OPTIONS,
  DEMO_NARRATOR_OPTIONS,
  DEMO_TAG_OPTIONS,
} from '../taxonomy/taxonomy-data.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderStatusBadge(state) {
  const label = `${String(state.status ?? 'editing').toUpperCase()}`;
  const publishLocked =
    state.draft.chapterCount <= 0
      ? '<span class="badge badge-editor badge-publish_locked">publish_locked</span>'
      : '';

  return `
    <div class="status-stack">
      <span class="badge badge-editor badge-${escapeHtml(String(state.status ?? 'editing'))}">
        ${escapeHtml(label)}
      </span>
      ${publishLocked}
    </div>
  `;
}

function renderChoiceList({ options, selectedId, inputName, query, listLabel, emptyMessage }) {
  const filtered = filterEditorOptions(options, query);
  return `
    <div class="choice-group">
      <label class="editor-label">
        <span>${escapeHtml(listLabel)}</span>
        <input
          type="search"
          data-editor-search="${escapeHtml(inputName)}"
          value="${escapeHtml(query)}"
          placeholder="Tìm ${escapeHtml(listLabel.toLowerCase())}"
        />
      </label>
      <label class="editor-label">
        <span>Chọn ${escapeHtml(listLabel.toLowerCase())}</span>
        <select data-editor-field="${escapeHtml(inputName)}">
          <option value="">${escapeHtml(emptyMessage)}</option>
          ${filtered
            .map(
              (option) => `
                <option value="${escapeHtml(option.id)}" ${option.id === selectedId ? 'selected' : ''}>
                  ${escapeHtml(option.name)}
                </option>
              `,
            )
            .join('')}
        </select>
      </label>
    </div>
  `;
}

function renderCheckboxList({ options, selectedIds, query, inputName }) {
  const filtered = filterEditorOptions(options, query);
  return `
    <div class="checkbox-panel">
      <label class="editor-label">
        <span>Tìm ${escapeHtml(inputName)}</span>
        <input
          type="search"
          data-editor-search="${escapeHtml(inputName)}"
          value="${escapeHtml(query)}"
          placeholder="Tìm ${escapeHtml(inputName)}"
        />
      </label>
      <div class="checkbox-list">
        ${
          filtered.length > 0
            ? filtered
                .map(
                  (option) => `
                    <label class="checkbox-item">
                      <input
                        type="checkbox"
                        data-editor-toggle="${escapeHtml(inputName)}"
                        value="${escapeHtml(option.id)}"
                        ${selectedIds.includes(option.id) ? 'checked' : ''}
                      />
                      <span>${escapeHtml(option.name)}</span>
                    </label>
                  `,
                )
                .join('')
            : `<div class="empty-inline">Không có kết quả.</div>`
        }
      </div>
    </div>
  `;
}

function renderNarratorSlots(state) {
  return state.draft.narrators
    .map((slot) => {
      const query = state.ui.narratorQueries[slot.roleIndex] ?? '';
      const options = filterEditorOptions(DEMO_NARRATOR_OPTIONS, query);

      return `
        <div class="panel narrator-slot">
          <div class="panel-kicker">Narrator ${slot.roleIndex}</div>
          <label class="editor-label">
            <span>Tìm narrator</span>
            <input
              type="search"
              data-editor-search="narrator-${slot.roleIndex}"
              value="${escapeHtml(query)}"
              placeholder="Tìm narrator"
            />
          </label>
          <label class="editor-label">
            <span>Chọn narrator</span>
            <select data-editor-narrator-slot="${escapeHtml(String(slot.roleIndex))}">
              <option value="">Chọn narrator</option>
              ${options
                .map(
                  (option) => `
                    <option value="${escapeHtml(option.id)}" ${option.id === slot.narratorId ? 'selected' : ''}>
                      ${escapeHtml(option.name)}
                    </option>
                  `,
                )
                .join('')}
            </select>
          </label>
          <div class="slot-summary">
            ${escapeHtml(slot.narratorName || 'Chưa chọn')}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderTagsSummary(ids, options) {
  if (!ids.length) {
    return '<span class="empty-inline">Chưa chọn</span>';
  }

  return ids
    .map((id) => options.find((option) => option.id === id)?.name ?? id)
    .map((name) => `<span class="chip">${escapeHtml(name)}</span>`)
    .join('');
}

function renderSelectedList(ids, options) {
  const names = ids.map((id) => options.find((option) => option.id === id)?.name ?? id);
  return names.length
    ? names.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join('')
    : '<span class="empty-inline">Chưa chọn</span>';
}

export function renderAudiobookEditorView({ state }) {
  const publishActionBusy = ['saving', 'confirming', 'publishing', 'unpublishing'].includes(state.status);
  const warning = getEditorPublishWarning(state.draft);
  const validationBanner =
    state.status === 'validation_error' && Object.keys(state.errors).length > 0
      ? `<div class="alert alert-error">${escapeHtml('Vui lòng kiểm tra các trường bắt buộc.')}</div>`
      : '';

  return `
    <form class="panel editor-panel" data-editor-form>
      <div class="panel-head">
        <div>
          <div class="panel-kicker">${escapeHtml(state.mode === 'create' ? 'New audiobook' : 'Edit audiobook')}</div>
          <h2>${escapeHtml(state.mode === 'create' ? 'Tạo audiobook mới' : state.draft.title || 'Chỉnh sửa audiobook')}</h2>
          <p>Bản editor này lưu metadata vào contract hiện có và giữ state UI cho narrator/category/tag.</p>
        </div>
        <div class="panel-actions">
          ${renderStatusBadge(state)}
          <a class="button button-secondary" href="#/content">Quay lại dashboard</a>
        </div>
      </div>

      ${warning ? `<div class="alert alert-warning">${escapeHtml(warning)}</div>` : ''}
      ${validationBanner}
      ${state.message ? `<div class="alert alert-success">${escapeHtml(state.message)}</div>` : ''}

      <section class="editor-grid">
        <div class="editor-column">
          <div class="panel">
            <div class="panel-kicker">Basic metadata</div>
            <div class="editor-fields">
              <label class="editor-label">
                <span>Title</span>
                <input name="title" value="${escapeHtml(state.draft.title)}" placeholder="Nhập title" />
                ${state.errors.title ? `<small class="field-error">${escapeHtml(state.errors.title)}</small>` : ''}
              </label>

              <label class="editor-label">
                <span>Description</span>
                <textarea name="description" rows="5" placeholder="Mô tả ngắn">${escapeHtml(state.draft.description)}</textarea>
              </label>

              <div class="two-col">
                <label class="editor-label">
                  <span>Duration (sec)</span>
                  <input name="durationSec" type="number" min="0" value="${escapeHtml(String(state.draft.durationSec))}" />
                  ${state.errors.durationSec ? `<small class="field-error">${escapeHtml(state.errors.durationSec)}</small>` : ''}
                </label>
                <label class="editor-label">
                  <span>Language</span>
                  <select name="languageCode">
                    <option value="vi" ${state.draft.languageCode === 'vi' ? 'selected' : ''}>vi</option>
                    <option value="en" ${state.draft.languageCode === 'en' ? 'selected' : ''}>en</option>
                    <option value="ja" ${state.draft.languageCode === 'ja' ? 'selected' : ''}>ja</option>
                  </select>
                </label>
              </div>

              <label class="checkbox-inline">
                <input name="premiumFlag" type="checkbox" ${state.draft.premiumFlag ? 'checked' : ''} />
                <span>Premium flag</span>
              </label>
            </div>
          </div>

          <div class="panel">
            <div class="panel-kicker">Cover</div>
            <div class="cover-grid">
              <div class="cover-preview">
                ${
                  state.draft.coverPreviewUrl
                    ? `<img src="${escapeHtml(state.draft.coverPreviewUrl)}" alt="Cover preview" />`
                    : '<div class="cover-placeholder">No cover</div>'
                }
              </div>
              <div class="editor-fields">
                <label class="editor-label">
                  <span>Upload cover</span>
                  <input name="coverFile" type="file" accept="image/*" data-editor-cover-input />
                </label>
                <label class="editor-label">
                  <span>Cover asset key</span>
                  <input name="coverImageAssetKey" value="${escapeHtml(state.draft.coverImageAssetKey)}" placeholder="covers/..." />
                </label>
                <div class="field-hint">
                  File chọn sẽ cập nhật preview ngay. Payload save chỉ gửi <code>coverImageAssetKey</code>.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="editor-column">
          <div class="panel">
            <div class="panel-kicker">Author</div>
            ${renderChoiceList({
              options: DEMO_AUTHOR_OPTIONS,
              selectedId: state.draft.authorId,
              inputName: 'authorId',
              query: state.ui.authorQuery,
              listLabel: 'Author',
              emptyMessage: 'Chọn author',
            })}
            ${state.errors.authorId ? `<small class="field-error">${escapeHtml(state.errors.authorId)}</small>` : ''}
            <div class="selected-summary">${state.draft.authorName ? escapeHtml(state.draft.authorName) : 'Chưa chọn author'}</div>
          </div>

          <div class="panel">
            <div class="panel-kicker">Narrators</div>
            <div class="narrator-grid">
              ${renderNarratorSlots(state)}
            </div>
            ${state.errors.narrators ? `<small class="field-error">${escapeHtml(state.errors.narrators)}</small>` : ''}
          </div>

          <div class="panel">
            <div class="panel-kicker">Categories</div>
            ${renderCheckboxList({
              options: DEMO_CATEGORY_OPTIONS,
              selectedIds: state.draft.categoryIds,
              query: state.ui.categoryQuery,
              inputName: 'category',
            })}
            <div class="selected-summary">
              ${renderSelectedList(state.draft.categoryIds, DEMO_CATEGORY_OPTIONS)}
            </div>
          </div>

          <div class="panel">
            <div class="panel-kicker">Tags</div>
            ${renderCheckboxList({
              options: DEMO_TAG_OPTIONS,
              selectedIds: state.draft.tagIds,
              query: state.ui.tagQuery,
              inputName: 'tag',
            })}
            <div class="selected-summary">
              ${renderTagsSummary(state.draft.tagIds, DEMO_TAG_OPTIONS)}
            </div>
          </div>
        </div>
      </section>

      <footer class="editor-actions">
        <button class="button button-primary" type="submit" data-editor-save ${state.status === 'saving' ? 'disabled' : ''}>
          ${state.status === 'saving' ? 'Saving...' : 'Save draft'}
        </button>
        ${
          state.draft.id
            ? `
              <button
                class="button button-secondary"
                type="button"
                data-editor-action="${state.draft.status === 'PUBLISHED' ? 'unpublish' : 'publish'}"
                ${publishActionBusy || (state.draft.status !== 'PUBLISHED' && state.draft.chapterCount <= 0) ? 'disabled' : ''}
              >
                ${state.draft.status === 'PUBLISHED' ? 'Unpublish audiobook' : 'Publish audiobook'}
              </button>
              <a class="button button-secondary" href="#/audit?entityType=audiobook&entityId=${encodeURIComponent(state.draft.id)}">
                View audit trail
              </a>
            `
            : ''
        }
        <a
          class="button button-secondary ${state.draft.id ? '' : 'button-disabled'}"
          href="${state.draft.id ? `#/content/${encodeURIComponent(state.draft.id)}/chapters` : '#/content'}"
        >
          Next: chapters
        </a>
      </footer>

      <div class="editor-footnote">
        ${state.draft.chapterCount > 0 ? `${state.draft.chapterCount} chapter(s) đã có sẵn trong metadata demo.` : 'Chưa có chapter metadata.'}
        ${state.draft.id ? ` ID: ${escapeHtml(state.draft.id)}` : ''}
      </div>
    </form>
  `;
}

export function renderChapterStubView({ id }) {
  return `
    <div class="panel">
      <div class="panel-kicker">Chapter upload</div>
      <h2>Đường đi sang chapter upload</h2>
      <p>Task 4 sẽ thay màn này bằng chapter list, upload audio và reorder.</p>
      <a class="button button-secondary" href="#/content/${encodeURIComponent(id)}">Quay lại editor</a>
    </div>
  `;
}
