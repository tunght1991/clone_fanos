import {
  CONTENT_STATUS_OPTIONS,
  makeContentDashboardSearch,
} from './content-dashboard-data.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value) {
  if (!value) {
    return 'Chưa có';
  }

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function badgeClassForStatus(status) {
  return {
    DRAFT: 'badge badge-neutral',
    PUBLISHED: 'badge badge-success',
    UNPUBLISHED: 'badge badge-warning',
    ARCHIVED: 'badge badge-muted',
  }[status] ?? 'badge';
}

function renderStatusOptions(selectedStatus) {
  return CONTENT_STATUS_OPTIONS.map(
    (status) => `
      <option value="${escapeHtml(status)}" ${status === selectedStatus ? 'selected' : ''}>
        ${escapeHtml(status === 'ALL' ? 'Tất cả trạng thái' : status)}
      </option>
    `,
  ).join('');
}

function renderAudiobookRow(item, filters) {
  const query = makeContentDashboardSearch(filters);
  const detailSearch = new URLSearchParams(query);
  detailSearch.set('selected', item.id);
  const detailHref = `#/content/${encodeURIComponent(item.id)}?${detailSearch.toString()}`;

  return `
    <tr>
      <td>
        <div class="content-title">${escapeHtml(item.title)}</div>
        <div class="content-subtitle">${escapeHtml(item.authorName)}</div>
      </td>
      <td>${escapeHtml(item.narratorNames.join(', '))}</td>
      <td>${escapeHtml(item.categoryNames.join(', '))}</td>
      <td>
        <span class="${badgeClassForStatus(item.status)}">${escapeHtml(item.status)}</span>
      </td>
      <td>
        <span class="badge ${item.premiumFlag ? 'badge-premium' : 'badge-quiet'}">
          ${item.premiumFlag ? 'Premium' : 'Free'}
        </span>
      </td>
      <td>${escapeHtml(String(item.chapterCount))}</td>
      <td>${escapeHtml(formatDate(item.updatedAt))}</td>
      <td>
        <a class="button button-secondary button-sm" href="${detailHref}" data-content-item="${escapeHtml(item.id)}">
          Mở editor
        </a>
      </td>
    </tr>
  `;
}

function renderEmptyState(title, description) {
  return `
    <div class="empty-state">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
    </div>
  `;
}

export function renderContentDashboardView({ state, session }) {
  const { filters, items, meta, source, loading, errorMessage } = state;

  return `
    <div class="panel dashboard-panel">
      <div class="panel-head">
        <div>
          <div class="panel-kicker">Content dashboard</div>
          <h2>Danh sách audiobook</h2>
          <p>Search, filter và mở vào editor theo từng item. Nguồn dữ liệu: ${escapeHtml(source)}.</p>
        </div>
        <div class="panel-actions">
          <a class="button button-secondary" href="#/content">Reset filters</a>
          <a class="button button-primary" href="#/content/new">Tạo audiobook</a>
        </div>
      </div>

      ${errorMessage ? `<div class="alert alert-error">${escapeHtml(errorMessage)}</div>` : ''}

      <form class="dashboard-filters" data-content-dashboard-filters>
        <label>
          <span>Từ khóa</span>
          <input
            name="query"
            type="search"
            value="${escapeHtml(filters.query)}"
            placeholder="Tìm theo title, author, narrator, tag"
          />
        </label>
        <label>
          <span>Trạng thái</span>
          <select name="status">
            ${renderStatusOptions(filters.status)}
          </select>
        </label>
        <label>
          <span>Trang</span>
          <input name="page" type="number" min="1" value="${escapeHtml(String(meta.page))}" />
        </label>
        <button class="button button-primary" type="submit">${loading ? 'Đang tải...' : 'Áp dụng'}</button>
      </form>

      <div class="dashboard-meta">
        <div>${escapeHtml(String(meta.totalItems))} audiobook</div>
        <div>Trang ${escapeHtml(String(meta.page))} / ${escapeHtml(String(meta.totalPages))}</div>
        <div>Role: ${escapeHtml(session?.admin?.role ?? 'ADMIN')}</div>
      </div>

      ${
        loading
          ? `
            <div class="inline-loading">
              <div class="spinner spinner-small"></div>
              <span>Đang tải danh sách nội dung...</span>
            </div>
          `
          : items.length > 0
            ? `
              <div class="table-wrap">
                <table class="content-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Narrator</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Plan</th>
                      <th>Chapters</th>
                      <th>Updated</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((item) => renderAudiobookRow(item, filters)).join('')}
                  </tbody>
                </table>
              </div>
            `
            : renderEmptyState(
                'Không có nội dung phù hợp',
                'Hãy thử đổi từ khóa, trạng thái hoặc quay về danh sách gốc.',
              )
      }

      <div class="pagination">
        <a
          class="button button-secondary button-sm ${meta.hasPrevious ? '' : 'button-disabled'}"
          href="#/content?query=${encodeURIComponent(filters.query)}&status=${encodeURIComponent(filters.status)}&page=${Math.max(meta.page - 1, 1)}"
        >
          Trang trước
        </a>
        <a
          class="button button-secondary button-sm ${meta.hasNext ? '' : 'button-disabled'}"
          href="#/content?query=${encodeURIComponent(filters.query)}&status=${encodeURIComponent(filters.status)}&page=${Math.min(meta.page + 1, meta.totalPages)}"
        >
          Trang sau
        </a>
      </div>
    </div>
  `;
}

export function renderContentDetailStubView({ item, filters }) {
  const query = makeContentDashboardSearch(filters);
  const backHref = `#/content?${new URLSearchParams(query).toString()}`;

  return `
    <div class="panel dashboard-panel">
      <div class="panel-head">
        <div>
          <div class="panel-kicker">Audiobook editor</div>
          <h2>${escapeHtml(item?.title ?? 'Audiobook chưa tìm thấy')}</h2>
          <p>
            Task 3 sẽ thay màn này bằng audiobook editor đầy đủ.
          </p>
        </div>
        <div class="panel-actions">
          <a class="button button-secondary" href="${backHref}">Quay lại dashboard</a>
        </div>
      </div>

      ${
        item
          ? `
            <section class="detail-grid">
              <article class="detail-card">
                <div class="detail-label">Author</div>
                <div>${escapeHtml(item.authorName)}</div>
              </article>
              <article class="detail-card">
                <div class="detail-label">Narrator</div>
                <div>${escapeHtml(item.narratorNames.join(', '))}</div>
              </article>
              <article class="detail-card">
                <div class="detail-label">Status</div>
                <div>${escapeHtml(item.status)}</div>
              </article>
              <article class="detail-card">
                <div class="detail-label">Premium</div>
                <div>${item.premiumFlag ? 'Yes' : 'No'}</div>
              </article>
            </section>
          `
          : renderEmptyState(
              'Item không tồn tại',
              'Audiobook này chưa có trong cache demo hoặc dữ liệu API hiện tại.',
            )
      }
    </div>
  `;
}
