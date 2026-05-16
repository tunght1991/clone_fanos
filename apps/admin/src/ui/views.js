function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function shellFrame({ title, subtitle, content, session }) {
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">CF</span>
          <div>
            <div class="brand-title">Clone Fonos</div>
            <div class="brand-subtitle">Admin CMS</div>
          </div>
        </div>
        <nav class="nav">
          <a href="#/dashboard" class="nav-link">Dashboard</a>
          <a href="#/content" class="nav-link">Content</a>
          <a href="#/taxonomy" class="nav-link">Taxonomy</a>
          <a href="#/audit" class="nav-link">Audit</a>
        </nav>
        <div class="sidebar-footer">
          <div class="session-card">
            <div class="session-label">Đăng nhập</div>
            <div class="session-name">${escapeHtml(session?.user?.name ?? session?.user?.email ?? 'Admin')}</div>
            <div class="session-role">${escapeHtml(session?.admin?.role ?? 'ADMIN')}</div>
          </div>
          <button class="button button-secondary" data-action="logout" type="button">Logout</button>
        </div>
      </aside>
      <section class="workspace">
        <header class="topbar">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(subtitle)}</p>
          </div>
          <div class="status-chip">Admin shell ready</div>
        </header>
        <main class="content-area">
          ${content}
        </main>
      </section>
    </div>
  `;
}

export function renderLoadingView() {
  return `
    <div class="center-card">
      <div class="spinner"></div>
      <h1>Đang kiểm tra phiên đăng nhập</h1>
      <p>Admin CMS đang xác minh session và quyền truy cập.</p>
    </div>
  `;
}

export function renderLoginView({ errorMessage = '', returnTo = '/dashboard' } = {}) {
  return `
    <div class="center-card auth-card">
      <div class="hero">
        <div class="brand-mark brand-mark-large">CF</div>
        <div>
          <h1>Clone Fonos Admin</h1>
          <p>Đăng nhập để quản lý audiobook, chapter và taxonomy.</p>
        </div>
      </div>
      ${errorMessage ? `<div class="alert alert-error">${escapeHtml(errorMessage)}</div>` : ''}
      <form class="form" data-login-form>
        <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}" />
        <label>
          <span>Email</span>
          <input name="email" type="email" autocomplete="email" placeholder="admin@clone-fanos.com" required />
        </label>
        <label>
          <span>Mật khẩu</span>
          <input name="password" type="password" autocomplete="current-password" placeholder="••••••••" required />
        </label>
        <button class="button button-primary" type="submit">Đăng nhập</button>
      </form>
      <div class="hint">
        Phiên đăng nhập sẽ được bootstrap lại bằng <code>GET /auth/me</code> và <code>GET /admin/me</code>.
      </div>
    </div>
  `;
}

export function renderForbiddenView({ message = 'Tài khoản hiện tại không có quyền truy cập admin.' } = {}) {
  return `
    <div class="center-card">
      <div class="warning-badge">403</div>
      <h1>Không có quyền truy cập</h1>
      <p>${escapeHtml(message)}</p>
      <a class="button button-primary" href="#/login">Quay lại đăng nhập</a>
    </div>
  `;
}

function dashboardPanels() {
  return `
    <section class="panel-grid">
      <article class="panel">
        <h2>Content Dashboard</h2>
        <p>Xem danh sách audiobook, search, filter và đi vào editor.</p>
        <a class="button button-secondary" href="#/content">Mở dashboard nội dung</a>
      </article>
      <article class="panel">
        <h2>Audiobook Editor</h2>
        <p>Chuẩn bị metadata, cover, narrator và publish workflow.</p>
        <a class="button button-secondary" href="#/content">Đi tới editor</a>
      </article>
      <article class="panel">
        <h2>Taxonomy</h2>
        <p>Quản lý author, category, tag và narrator dùng chung selector.</p>
        <a class="button button-secondary" href="#/taxonomy">Mở taxonomy</a>
      </article>
      <article class="panel">
        <h2>Audit Trail</h2>
        <p>Xem lịch sử publish/unpublish và thay đổi nội dung.</p>
        <a class="button button-secondary" href="#/audit">Mở audit trail</a>
      </article>
    </section>
  `;
}

function placeholderPanels(routeName) {
  const labels = {
    content: 'Content dashboard',
    taxonomy: 'Taxonomy management',
    audit: 'Publish / audit trail',
  };

  const copy = {
    content: 'Task 2 sẽ thay phần này bằng danh sách audiobook, search và filter.',
    taxonomy: 'Task 5 sẽ thay phần này bằng CRUD cho author, category, tag và narrator.',
    audit: 'Task 6 sẽ thay phần này bằng publish/unpublish và audit timeline.',
  };

  return `
    <section class="panel">
      <div class="panel-kicker">Coming next</div>
      <h2>${escapeHtml(labels[routeName] ?? routeName)}</h2>
      <p>${escapeHtml(copy[routeName] ?? 'Màn hình này sẽ được triển khai ở task tiếp theo.')}</p>
    </section>
  `;
}

export function renderWorkspaceView({ routeName, session }) {
  const content = routeName === 'dashboard' ? dashboardPanels() : placeholderPanels(routeName);

  return shellFrame({
    title: routeName === 'dashboard' ? 'Dashboard' : routeName,
    subtitle: 'Admin shell với route protection, session bootstrap và layout dùng chung.',
    content,
    session,
  });
}

export function renderShellView({ title, subtitle, content, session }) {
  return shellFrame({
    title,
    subtitle,
    content,
    session,
  });
}
