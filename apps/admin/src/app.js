import { createAdminApi } from './api/admin-api.js';
import { bootstrapAdminSession } from './auth/session-bootstrap.js';
import { createSessionStore } from './auth/session-store.js';
import { resolveRouteAccess } from './auth/access-control.js';
import { parseAdminLocation, createHashNavigator } from './router.js';
import { createContentDashboardRepository } from './features/content-dashboard/content-dashboard-repository.js';
import {
  normalizeContentDashboardFilters,
  normalizeContentDashboardItem,
  resolveContentAudiobookById,
} from './features/content-dashboard/content-dashboard-data.js';
import {
  renderContentDashboardView,
} from './features/content-dashboard/content-dashboard-view.js';
import { createAudiobookEditorRepository } from './features/content-editor/content-editor-repository.js';
import {
  createAudiobookEditorState,
  toggleAudiobookEditorCategory,
  toggleAudiobookEditorTag,
  updateAudiobookEditorAuthor,
  updateAudiobookEditorCover,
  updateAudiobookEditorField,
  updateAudiobookEditorNarratorSlot,
  validateAudiobookEditorState,
} from './features/content-editor/content-editor-data.js';
import {
  renderAudiobookEditorView,
} from './features/content-editor/content-editor-view.js';
import { createChapterRepository } from './features/content-chapters/content-chapters-repository.js';
import {
  buildChapterDraftFromRecord,
  createBlankChapterDraft,
  createChapterManagerState,
  getDemoAudiobookSummary,
  validateChapterDraft,
} from './features/content-chapters/content-chapters-data.js';
import { renderChapterManagerView } from './features/content-chapters/content-chapters-view.js';
import { createTaxonomyRepository } from './features/taxonomy/taxonomy-repository.js';
import {
  buildTaxonomyDraftFromRecord,
  createTaxonomyManagerState,
  createBlankTaxonomyDraft,
  filterTaxonomyRecords,
  normalizeTaxonomyRecord,
  validateTaxonomyDraft,
} from './features/taxonomy/taxonomy-data.js';
import { renderTaxonomyManagerView } from './features/taxonomy/taxonomy-view.js';
import { createAuditTrailRepository } from './features/audit/audit-repository.js';
import {
  createBlankAuditFilter,
  filterAuditTrailRecords,
  listDemoAuditTrailEntries,
  normalizeAuditTrailFilters,
} from './features/audit/audit-data.js';
import { renderAuditTrailView } from './features/audit/audit-view.js';
import {
  renderForbiddenView,
  renderLoadingView,
  renderLoginView,
  renderShellView,
  renderWorkspaceView,
} from './ui/views.js';

function getRootElement(root) {
  if (typeof root === 'string') {
    const element = document.querySelector(root);
    if (!element) {
      throw new Error(`Admin root element not found: ${root}`);
    }

    return element;
  }

  return root;
}

function readReturnTo(search) {
  const value = search?.returnTo;
  if (!value) {
    return '/dashboard';
  }

  return value.startsWith('/') ? value : '/dashboard';
}

function normalizeSessionForStorage(session) {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
    admin: session.admin,
    expiresAt: session.expiresAt ?? null,
  };
}

export function createAdminApp({
  root = '#app',
  fetchImpl = globalThis.fetch.bind(globalThis),
  storage = globalThis.localStorage,
  location = globalThis.location,
  baseUrl = '',
} = {}) {
  const rootElement = getRootElement(root);
  const store = createSessionStore(storage);
  const authApi = createAdminApi({ baseUrl, fetchImpl });
  const contentRepository = createContentDashboardRepository({ adminApi: authApi });
  const editorRepository = createAudiobookEditorRepository({ adminApi: authApi });
  const chapterRepository = createChapterRepository({ adminApi: authApi });
  const taxonomyRepository = createTaxonomyRepository({ adminApi: authApi });
  const auditRepository = createAuditTrailRepository({ adminApi: authApi, seedRecords: listDemoAuditTrailEntries() });
  const navigator = createHashNavigator(location);

  let sessionState = { status: 'loading', session: null };
  let currentRoute = parseAdminLocation(location);
  let loginErrorMessage = '';
  let isBootstrapped = false;
  let contentState = {
    status: 'idle',
    filters: normalizeContentDashboardFilters(),
    items: [],
    meta: {
      query: '',
      status: 'ALL',
      page: 1,
      pageSize: 6,
      totalItems: 0,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
    source: 'demo',
    errorMessage: '',
  };
  let contentRequestKey = '';
  let contentRequestCounter = 0;
  let isContentRouteLoaded = false;
  let editorState = createAudiobookEditorState();
  let editorRouteKey = '';
  let editorRequestCounter = 0;
  let editorIsLoaded = false;
  let chapterState = createChapterManagerState(null, []);
  let chapterRouteKey = '';
  let chapterRequestCounter = 0;
  let chapterIsLoaded = false;
  let taxonomyState = createTaxonomyManagerState('author', []);
  let taxonomyRouteKey = '';
  let taxonomyRequestCounter = 0;
  let taxonomyIsLoaded = false;
  let auditState = {
    status: 'idle',
    filters: createBlankAuditFilter(),
    entries: [],
    message: '',
    errorMessage: '',
  };
  let auditRouteKey = '';
  let auditRequestCounter = 0;
  let auditIsLoaded = false;

  function navigate(pathname, search = {}) {
    navigator.navigate(pathname, search);
  }

  function getRouteMode(routeState) {
    if (routeState.pathname === '/content') {
      return 'content-list';
    }

    if (routeState.pathname === '/content/new') {
      return 'content-editor-create';
    }

    if (/^\/content\/[^/]+\/chapters$/.test(routeState.pathname)) {
      return 'content-chapters';
    }

    if (routeState.pathname === '/taxonomy') {
      return 'taxonomy';
    }

    if (routeState.pathname === '/audit') {
      return 'audit';
    }

    if (/^\/content\/[^/]+$/.test(routeState.pathname)) {
      return 'content-editor-edit';
    }

    return routeState.pathname.slice(1) || 'dashboard';
  }

  function getContentRequestKey(filters) {
    return JSON.stringify(filters);
  }

  async function loadContentDashboard(routeState) {
    const filters = normalizeContentDashboardFilters(routeState.search);
    const nextRequestKey = getContentRequestKey(filters);

    if (isContentRouteLoaded && contentRequestKey === nextRequestKey) {
      return;
    }

    contentRequestKey = nextRequestKey;
    const requestId = ++contentRequestCounter;
    contentState = {
      ...contentState,
      status: 'loading',
      filters,
      errorMessage: '',
    };
    render();

    const nextState = await contentRepository.listAudiobooks(filters);
    if (requestId !== contentRequestCounter) {
      return;
    }

    contentState = {
      ...contentState,
      status: 'success',
      filters,
      items: nextState.items,
      meta: nextState.meta,
      source: nextState.source,
      errorMessage: '',
    };
    isContentRouteLoaded = true;
    render();
  }

  function getEditorRouteKey(routeState) {
    return routeState.pathname;
  }

  function getChapterRouteKey(routeState) {
    return routeState.pathname;
  }

  async function loadEditor(routeState) {
    const routeKey = getEditorRouteKey(routeState);
    if (editorIsLoaded && editorRouteKey === routeKey) {
      return;
    }

    editorRouteKey = routeKey;
    const requestId = ++editorRequestCounter;
    editorState = {
      ...editorState,
      status: 'loading',
      message: '',
    };
    render();

    let nextEditorState = null;
    if (routeState.pathname === '/content/new') {
      nextEditorState = createAudiobookEditorState();
    } else {
      const audiobookId = routeState.pathname.split('/')[2];
      const localItem = resolveContentAudiobookById(contentState.items, audiobookId);
      const loadedDraft = await editorRepository.getAudiobook(audiobookId);
      const sourceRecord = loadedDraft ?? localItem ?? null;
      nextEditorState = createAudiobookEditorState(sourceRecord);
    }

    if (requestId !== editorRequestCounter) {
      return;
    }

    editorState = {
      ...nextEditorState,
      status: 'editing',
      message: '',
    };
    editorIsLoaded = true;
    render();
  }

  function getChapterAudiobookSummary(audiobookId) {
    return (
      resolveContentAudiobookById(contentState.items, audiobookId)
      ?? getDemoAudiobookSummary(audiobookId)
      ?? {
        id: audiobookId,
        title: 'Untitled audiobook',
        authorName: '',
        premiumFlag: false,
        status: 'DRAFT',
        chapterCount: 0,
      }
    );
  }

  function createNewChapterDraft(audiobookId) {
    const nextDraft = createBlankChapterDraft(audiobookId, chapterRepository.ensureDraftOrder(
      audiobookId,
      createBlankChapterDraft(audiobookId, chapterState.draft.orderIndex || 1),
    ).orderIndex);

    return nextDraft;
  }

  function syncChapterListFromRecord(record) {
    const nextRecord = {
      ...record,
      audiobookId: record.audiobookId || chapterState.audiobook?.id || chapterState.draft.audiobookId,
    };

    chapterState = {
      ...chapterState,
      chapters: chapterState.chapters
        .filter((chapter) => chapter.id !== nextRecord.id)
        .concat([nextRecord])
        .sort((left, right) => left.orderIndex - right.orderIndex),
    };
  }

  function syncChapterDraftFromRecord(record, audiobookId) {
    chapterState = {
      ...chapterState,
      draft: buildChapterDraftFromRecord(record, audiobookId),
      selectedChapterId: record.id,
    };
  }

  function syncChapterDraftFromSelection(audiobookId, chapterId) {
    const existing = chapterRepository.getChapter(audiobookId, chapterId);
    if (existing) {
      syncChapterDraftFromRecord(existing, audiobookId);
      return;
    }

    chapterState = {
      ...chapterState,
      selectedChapterId: '',
      draft: createNewChapterDraft(audiobookId),
    };
  }

  async function loadChapterManager(routeState) {
    const routeKey = getChapterRouteKey(routeState);
    if (chapterIsLoaded && chapterRouteKey === routeKey) {
      return;
    }

    chapterRouteKey = routeKey;
    const requestId = ++chapterRequestCounter;
    const audiobookId = routeState.pathname.split('/')[2];
    const audiobookSummary = getChapterAudiobookSummary(audiobookId);

    chapterState = {
      ...chapterRepository.getInitialState(audiobookSummary),
      status: 'loading',
      message: '',
    };
    render();

    const loadedChapters = await chapterRepository.listChapters(audiobookId);
    if (requestId !== chapterRequestCounter) {
      return;
    }

    const nextState = chapterRepository.getInitialState(audiobookSummary);
    const selectedId = routeState.search.selected || nextState.selectedChapterId;

    chapterState = {
      ...nextState,
      chapters: loadedChapters.length > 0 ? loadedChapters : nextState.chapters,
      selectedChapterId: selectedId && loadedChapters.some((chapter) => chapter.id === selectedId)
        ? selectedId
        : (loadedChapters[0]?.id ?? nextState.selectedChapterId),
      status: 'editing',
      message: '',
    };

    if (chapterState.selectedChapterId) {
      const selectedChapter = chapterRepository.getChapter(audiobookId, chapterState.selectedChapterId);
      if (selectedChapter) {
        chapterState = {
          ...chapterState,
          draft: buildChapterDraftFromRecord(selectedChapter, audiobookId),
        };
      }
    }

    chapterIsLoaded = true;
    render();
  }

  function normalizeTaxonomyType(value) {
    return ['author', 'category', 'tag', 'narrator'].includes(String(value ?? '').toLowerCase())
      ? String(value ?? '').toLowerCase()
      : 'author';
  }

  function getTaxonomyRouteKey(routeState) {
    return JSON.stringify({
      pathname: routeState.pathname,
      tab: normalizeTaxonomyType(routeState.search.tab),
      query: String(routeState.search.query ?? ''),
      selected: String(routeState.search.selected ?? ''),
    });
  }

  function createNewTaxonomyDraft(type) {
    return createBlankTaxonomyDraft(type);
  }

  function syncTaxonomyRecord(record) {
    const normalized = normalizeTaxonomyRecord(taxonomyState.type, record);
    const existing = taxonomyState.records.filter((item) => item.id !== normalized.id);
    taxonomyState = {
      ...taxonomyState,
      records: [normalized, ...existing].sort((left, right) => left.name.localeCompare(right.name)),
      filteredRecords: filterTaxonomyRecords(
        [normalized, ...existing],
        taxonomyState.query,
      ),
    };
  }

  function syncTaxonomyDraftFromSelection(type, recordId) {
    const existing = taxonomyRepository.getTaxonomy(type, recordId);
    if (existing) {
      taxonomyState = {
        ...taxonomyState,
        selectedId: existing.id,
        draft: buildTaxonomyDraftFromRecord(existing, type),
      };
      return;
    }

    taxonomyState = {
      ...taxonomyState,
      selectedId: '',
      draft: createNewTaxonomyDraft(type),
    };
  }

  async function loadTaxonomy(routeState) {
    const type = normalizeTaxonomyType(routeState.search.tab);
    const nextRouteKey = getTaxonomyRouteKey(routeState);

    if (taxonomyIsLoaded && taxonomyRouteKey === nextRouteKey) {
      return;
    }

    taxonomyRouteKey = nextRouteKey;
    const requestId = ++taxonomyRequestCounter;
    taxonomyState = {
      ...taxonomyRepository.getInitialState(type, []),
      status: 'loading',
      message: '',
    };
    render();

    const query = String(routeState.search.query ?? '');
    const records = await taxonomyRepository.listTaxonomy(type, query);
    if (requestId !== taxonomyRequestCounter) {
      return;
    }

    const selectedId = String(routeState.search.selected ?? (records[0]?.id ?? ''));
    const selectedRecord = selectedId ? records.find((record) => record.id === selectedId) ?? null : null;

    taxonomyState = {
      ...taxonomyRepository.getInitialState(type, records),
      status: 'editing',
      query,
      filteredRecords: filterTaxonomyRecords(records, query),
      selectedId: selectedRecord?.id ?? selectedId,
      draft: selectedRecord ? buildTaxonomyDraftFromRecord(selectedRecord, type) : createNewTaxonomyDraft(type),
      message: '',
    };
    taxonomyIsLoaded = true;
    render();
  }

  function getAuditEntityOptions(entityType) {
    if (entityType === 'chapter') {
      return chapterState.chapters.map((chapter) => ({
        id: chapter.id,
        label: `${chapter.title || 'Untitled chapter'} · #${chapter.orderIndex}`,
      }));
    }

    return contentState.items.map((item) => ({
      id: item.id,
      label: item.title,
    }));
  }

  function resolveAuditFilters(routeState) {
    const normalized = normalizeAuditTrailFilters(routeState.search);
    const hasEntityId = Boolean(normalized.entityId);
    if (hasEntityId) {
      return normalized;
    }

    const entityOptions = getAuditEntityOptions(normalized.entityType);
    const defaultEntityId = entityOptions[0]?.id ?? '';
    return {
      ...normalized,
      entityId: defaultEntityId,
    };
  }

  function getAuditRouteKey(routeState) {
    return JSON.stringify(resolveAuditFilters(routeState));
  }

  function createAuditState(filters, entries = []) {
    return {
      status: 'editing',
      filters,
      entries,
      message: '',
      errorMessage: '',
    };
  }

  async function loadAuditTrail(routeState) {
    const nextFilters = resolveAuditFilters(routeState);
    const nextRouteKey = getAuditRouteKey(routeState);

    if (auditIsLoaded && auditRouteKey === nextRouteKey) {
      return;
    }

    auditRouteKey = nextRouteKey;
    const requestId = ++auditRequestCounter;
    auditState = {
      ...createAuditState(nextFilters),
      status: 'loading',
    };
    render();

    try {
      const entries = await auditRepository.listAuditTrails(nextFilters);
      if (requestId !== auditRequestCounter) {
        return;
      }

      auditState = createAuditState(nextFilters, entries);
      auditIsLoaded = true;
      render();
    } catch (error) {
      if (requestId !== auditRequestCounter) {
        return;
      }

      auditState = {
        ...createAuditState(nextFilters),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unable to load audit trail.',
      };
      render();
    }
  }

  function syncAuditEntry(entry) {
    auditState = {
      ...auditState,
      entries: filterAuditTrailRecords([entry, ...auditState.entries], auditState.filters),
      message: 'Audit trail updated.',
    };
  }

  function buildAuditEntryFromRecord(record, entityType, action, extraPayload = {}) {
    return {
      entityType,
      entityId: record.id,
      entityTitle: record.title,
      action,
      actorUserId: sessionState.session?.user?.id ?? sessionState.session?.user?.userId ?? 'admin-demo',
      actorRole: sessionState.session?.admin?.role ?? 'ADMIN',
      traceId: null,
      payloadJson: {
        status: String(record.status ?? '').toLowerCase(),
        ...extraPayload,
      },
      createdAt: new Date().toISOString(),
    };
  }

  function escapeCssAttributeValue(value) {
    const text = String(value ?? '');
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(text);
    }

    return text.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
  }

  function getFocusableSelector(element) {
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    if (element.hasAttribute('data-editor-search')) {
      return `[data-editor-search="${escapeCssAttributeValue(element.getAttribute('data-editor-search'))}"]`;
    }

    if (element.hasAttribute('data-editor-field')) {
      return `[data-editor-field="${escapeCssAttributeValue(element.getAttribute('data-editor-field'))}"]`;
    }

    if (element.hasAttribute('data-editor-narrator-slot')) {
      return `[data-editor-narrator-slot="${escapeCssAttributeValue(element.getAttribute('data-editor-narrator-slot'))}"]`;
    }

    if (element.hasAttribute('data-editor-cover-input')) {
      return '[data-editor-cover-input]';
    }

    if (element.hasAttribute('data-chapter-audio-input')) {
      return '[data-chapter-audio-input]';
    }

    const name = element.getAttribute('name');
    if (name) {
      return `[name="${escapeCssAttributeValue(name)}"]`;
    }

    const id = element.getAttribute('id');
    if (id) {
      return `#${escapeCssAttributeValue(id)}`;
    }

    return null;
  }

  function captureFocusedElement() {
    const activeElement = rootElement.ownerDocument?.activeElement;
    if (!(activeElement instanceof HTMLElement) || !rootElement.contains(activeElement)) {
      return null;
    }

    const selector = getFocusableSelector(activeElement);
    if (!selector) {
      return null;
    }

    const selectionStart = typeof activeElement.selectionStart === 'number' ? activeElement.selectionStart : null;
    const selectionEnd = typeof activeElement.selectionEnd === 'number' ? activeElement.selectionEnd : null;
    const selectionDirection = typeof activeElement.selectionDirection === 'string' ? activeElement.selectionDirection : null;

    return {
      selector,
      selectionStart,
      selectionEnd,
      selectionDirection,
    };
  }

  function restoreFocusedElement(snapshot) {
    if (!snapshot) {
      return;
    }

    const nextElement = rootElement.querySelector(snapshot.selector);
    if (!(nextElement instanceof HTMLElement)) {
      return;
    }

    nextElement.focus({ preventScroll: true });

    if (
      typeof nextElement.setSelectionRange === 'function' &&
      snapshot.selectionStart !== null &&
      snapshot.selectionEnd !== null &&
      (nextElement instanceof HTMLInputElement || nextElement instanceof HTMLTextAreaElement)
    ) {
      try {
        nextElement.setSelectionRange(
          snapshot.selectionStart,
          snapshot.selectionEnd,
          snapshot.selectionDirection ?? 'none',
        );
      } catch {
        // Ignore selection restore failures for non-text inputs.
      }
    }
  }

  function renderPreservingFocus() {
    const snapshot = captureFocusedElement();
    render();
    restoreFocusedElement(snapshot);
  }

  function getAllowedRoute(routeState) {
    const access = resolveRouteAccess(routeState.pathname, sessionState);
    if (access.redirectTo && routeState.pathname !== access.redirectTo) {
      navigate(access.redirectTo, routeState.search);
      return null;
    }

    return access;
  }

  function render() {
    const routeState = parseAdminLocation(location);
    currentRoute = routeState;

    if (sessionState.status === 'loading' && !isBootstrapped) {
      rootElement.innerHTML = renderLoadingView();
      return;
    }

    const access = getAllowedRoute(routeState);
    if (!access) {
      return;
    }

    if (access.view === 'login') {
      rootElement.innerHTML = renderLoginView({
        errorMessage: loginErrorMessage,
        returnTo: readReturnTo(routeState.search),
      });
      bindLoginForm();
      return;
    }

    if (access.view === 'forbidden') {
      rootElement.innerHTML = renderForbiddenView();
      return;
    }

    const routeMode = getRouteMode(routeState);

    if (routeMode === 'content-list') {
      const normalizedFilters = normalizeContentDashboardFilters(routeState.search);
      const requestKey = getContentRequestKey(normalizedFilters);
      if (contentRequestKey !== requestKey) {
        isContentRouteLoaded = false;
      }

      rootElement.innerHTML = renderShellView({
        title: 'Content Dashboard',
        subtitle: 'Quản lý audiobook, search, filter và mở editor.',
        content: renderContentDashboardView({
          state: contentState,
          session: sessionState.session,
        }),
        session: sessionState.session,
      });
      bindWorkspaceActions();
      bindContentDashboardActions(routeState);

      if (contentState.status !== 'loading' && (!isContentRouteLoaded || contentRequestKey !== requestKey)) {
        void loadContentDashboard(routeState);
      }
      return;
    }

    if (routeMode === 'content-editor-create' || routeMode === 'content-editor-edit') {
      if (editorRouteKey !== routeState.pathname) {
        editorIsLoaded = false;
      }

      rootElement.innerHTML = renderShellView({
        title: routeMode === 'content-editor-create' ? 'Tạo audiobook mới' : 'Audiobook Editor',
        subtitle: 'Chỉnh sửa metadata, cover, author và selector cho narrator/category/tag.',
        content: renderAudiobookEditorView({
          state: editorState,
        }),
        session: sessionState.session,
      });
      bindWorkspaceActions();
      bindAudiobookEditorActions(routeState);

      if (editorState.status !== 'loading' && (!editorIsLoaded || editorRouteKey !== routeState.pathname)) {
        void loadEditor(routeState);
      }
      return;
    }

    if (routeMode === 'content-chapters') {
      if (chapterRouteKey !== routeState.pathname) {
        chapterIsLoaded = false;
      }

      rootElement.innerHTML = renderShellView({
        title: 'Chapter Manager',
        subtitle: 'Upload audio, reorder chapters and manage publish state.',
        content: renderChapterManagerView({
          state: chapterState,
        }),
        session: sessionState.session,
      });
      bindWorkspaceActions();
      bindChapterManagerActions(routeState);

      if (chapterState.status !== 'loading' && (!chapterIsLoaded || chapterRouteKey !== routeState.pathname)) {
        void loadChapterManager(routeState);
      }
      return;
    }

    if (routeMode === 'taxonomy') {
      const nextRouteKey = getTaxonomyRouteKey(routeState);
      if (taxonomyRouteKey !== nextRouteKey) {
        taxonomyIsLoaded = false;
      }

      rootElement.innerHTML = renderShellView({
        title: 'Taxonomy Management',
        subtitle: 'Author, category, tag and narrator share the same selector source.',
        content: renderTaxonomyManagerView({
          state: taxonomyState,
        }),
        session: sessionState.session,
      });
      bindWorkspaceActions();
      bindTaxonomyActions(routeState);

      if (taxonomyState.status !== 'loading' && (!taxonomyIsLoaded || taxonomyRouteKey !== nextRouteKey)) {
        void loadTaxonomy(routeState);
      }
      return;
    }

    if (routeMode === 'audit') {
      const nextRouteKey = getAuditRouteKey(routeState);
      if (auditRouteKey !== nextRouteKey) {
        auditIsLoaded = false;
      }

      const filters = resolveAuditFilters(routeState);
      rootElement.innerHTML = renderShellView({
        title: 'Publish / Audit Trail',
        subtitle: 'Track publish and unpublish actions with a fast entity-focused view.',
        content: renderAuditTrailView({
          state: {
            ...auditState,
            filters,
          },
          entityOptions: getAuditEntityOptions(filters.entityType),
        }),
        session: sessionState.session,
      });
      bindWorkspaceActions();
      bindAuditTrailActions(routeState);

      if (auditState.status !== 'loading' && (!auditIsLoaded || auditRouteKey !== nextRouteKey)) {
        void loadAuditTrail(routeState);
      }
      return;
    }

    rootElement.innerHTML = renderWorkspaceView({
      routeName: routeMode,
      session: sessionState.session,
    });
    bindWorkspaceActions();
  }

  async function runBootstrap() {
    sessionState = { status: 'loading', session: null };
    isBootstrapped = false;
    render();

    const result = await bootstrapAdminSession({ store, authApi });
    sessionState = result;
    isBootstrapped = true;

    if (sessionState.status === 'authenticated') {
      loginErrorMessage = '';
      const routeState = parseAdminLocation(location);
      if (routeState.pathname === '/login' || routeState.pathname === '/forbidden') {
        navigate('/dashboard');
        return;
      }
    }

    if (sessionState.status === 'forbidden') {
      navigate('/forbidden');
      return;
    }

    if (sessionState.status === 'unauthenticated') {
      const routeState = parseAdminLocation(location);
      if (routeState.pathname !== '/login') {
        navigate('/login', { returnTo: routeState.pathname });
        return;
      }
    }

    render();
  }

  function bindLoginForm() {
    const form = rootElement.querySelector('[data-login-form]');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const email = String(formData.get('email') ?? '').trim();
      const password = String(formData.get('password') ?? '');
      const returnTo = String(formData.get('returnTo') ?? '/dashboard');

      if (!email || !password) {
        loginErrorMessage = 'Vui lòng nhập email và mật khẩu.';
        render();
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      submitButton?.setAttribute('disabled', 'disabled');
      loginErrorMessage = '';

      try {
        const loginResponse = await authApi.login({ email, password });
        const nextSession = normalizeSessionForStorage(loginResponse);
        store.write(nextSession);

        sessionState = await bootstrapAdminSession({ store, authApi });

        if (sessionState.status === 'authenticated') {
          navigate(returnTo || '/dashboard');
          return;
        }

        if (sessionState.status === 'forbidden') {
          navigate('/forbidden');
          return;
        }

        loginErrorMessage = 'Đăng nhập thành công nhưng không xác thực được phiên admin.';
        navigate('/login');
      } catch (error) {
        loginErrorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại.';
        render();
      } finally {
        submitButton?.removeAttribute('disabled');
      }
    });
  }

  function bindWorkspaceActions() {
    const logoutButton = rootElement.querySelector('[data-action="logout"]');
    if (!logoutButton) {
      return;
    }

    logoutButton.addEventListener('click', async () => {
      try {
        if (sessionState.session?.accessToken) {
          await authApi.logout(
            sessionState.session.accessToken,
            sessionState.session.refreshToken,
          );
        }
      } catch {
        // Ignore logout failures and clear the local session anyway.
      } finally {
        store.clear();
        sessionState = { status: 'unauthenticated', session: null };
        navigate('/login');
      }
    });
  }

  function bindContentDashboardActions(routeState) {
    const form = rootElement.querySelector('[data-content-dashboard-filters]');
    if (!form) {
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const query = String(formData.get('query') ?? '').trim();
      const status = String(formData.get('status') ?? 'ALL').trim().toUpperCase();
      const pageValue = Number.parseInt(String(formData.get('page') ?? '1'), 10);
      const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;

      navigate('/content', {
        query,
        status,
        page: String(page),
      });
    });

    const resetButton = rootElement.querySelector('a[href="#/content"]');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        isContentRouteLoaded = false;
      });
    }
  }

  function syncContentListFromEditorRecord(record) {
    const normalized = normalizeContentDashboardItem(record);
    const existing = contentState.items.filter((item) => item.id !== normalized.id);
    contentState = {
      ...contentState,
      items: [normalized, ...existing],
    };
  }

  function bindAudiobookEditorActions(routeState) {
    const form = rootElement.querySelector('[data-editor-form]');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const validation = validateAudiobookEditorState(editorState);
      editorState = {
        ...editorState,
        status: validation.valid ? 'saving' : 'validation_error',
        errors: validation.errors,
        message: validation.valid ? '' : 'Vui lòng sửa các lỗi trước khi lưu.',
      };
      render();

      if (!validation.valid) {
        return;
      }

      try {
        const savedRecord = await editorRepository.saveAudiobook({
          mode: editorState.mode,
          id: editorState.draft.id,
          state: editorState,
        });

        syncContentListFromEditorRecord(savedRecord);
        editorState = createAudiobookEditorState(savedRecord);
        editorState = {
          ...editorState,
          status: 'saved',
          message: 'Đã lưu draft thành công.',
        };
        editorIsLoaded = true;
        editorRouteKey = routeState.pathname === '/content/new' ? `/content/${savedRecord.id}` : routeState.pathname;

        if (routeState.pathname === '/content/new') {
          navigate(`/content/${savedRecord.id}`);
          return;
        }

        render();
      } catch (error) {
        editorState = {
          ...editorState,
          status: 'editing',
          message: error instanceof Error ? error.message : 'Không thể lưu audiobook.',
        };
        render();
      }
    });

    form.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const fieldName = target.getAttribute('name');
      const dataField = target.getAttribute('data-editor-field');
      const searchField = target.getAttribute('data-editor-search');

      if (fieldName === 'title' || fieldName === 'description' || fieldName === 'durationSec' || fieldName === 'languageCode' || fieldName === 'coverImageAssetKey') {
        editorState = updateAudiobookEditorField(editorState, fieldName, target.value);
        renderPreservingFocus();
        return;
      }

      if (fieldName === 'premiumFlag') {
        editorState = updateAudiobookEditorField(editorState, 'premiumFlag', target.checked);
        renderPreservingFocus();
        return;
      }

      if (dataField === 'authorId') {
        editorState = updateAudiobookEditorAuthor(editorState, target.value);
        renderPreservingFocus();
        return;
      }

      if (searchField === 'authorId') {
        editorState = {
          ...editorState,
          ui: {
            ...editorState.ui,
            authorQuery: target.value,
          },
        };
        renderPreservingFocus();
      }

      if (searchField === 'category') {
        editorState = {
          ...editorState,
          ui: {
            ...editorState.ui,
            categoryQuery: target.value,
          },
        };
        renderPreservingFocus();
      }

      if (searchField === 'tag') {
        editorState = {
          ...editorState,
          ui: {
            ...editorState.ui,
            tagQuery: target.value,
          },
        };
        renderPreservingFocus();
      }

      if (searchField?.startsWith('narrator-')) {
        const roleIndex = Number(searchField.split('-')[1]);
        editorState = {
          ...editorState,
          ui: {
            ...editorState.ui,
            narratorQueries: {
              ...editorState.ui.narratorQueries,
              [roleIndex]: target.value,
            },
          },
        };
        renderPreservingFocus();
      }
    });

    form.addEventListener('change', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const fieldName = target.getAttribute('name');
      const narratorSlot = target.getAttribute('data-editor-narrator-slot');
      const toggleGroup = target.getAttribute('data-editor-toggle');

      if (fieldName === 'authorId') {
        editorState = updateAudiobookEditorAuthor(editorState, target.value);
        renderPreservingFocus();
        return;
      }

      if (narratorSlot) {
        editorState = updateAudiobookEditorNarratorSlot(
          editorState,
          Number(narratorSlot),
          target.value,
        );
        renderPreservingFocus();
        return;
      }

      if (toggleGroup === 'category') {
        editorState = toggleAudiobookEditorCategory(editorState, target.value);
        renderPreservingFocus();
        return;
      }

      if (toggleGroup === 'tag') {
        editorState = toggleAudiobookEditorTag(editorState, target.value);
        renderPreservingFocus();
        return;
      }

      if (target.getAttribute('data-editor-cover-input') !== null) {
        const file = target.files?.[0];
        if (!file) {
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          editorState = updateAudiobookEditorCover(editorState, {
            fileName: file.name,
            previewUrl: String(reader.result ?? ''),
          });
          renderPreservingFocus();
        };
        reader.readAsDataURL(file);
      }
    });

    form.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const actionButton = target.closest('[data-editor-action]');
      if (!actionButton || !(actionButton instanceof HTMLElement)) {
        return;
      }

      const action = actionButton.getAttribute('data-editor-action');
      if (action !== 'publish' && action !== 'unpublish') {
        return;
      }

      const isPublish = action === 'publish';
      editorState = {
        ...editorState,
        status: 'confirming',
        message: '',
      };
      render();

      const confirmed = window.confirm(
        `${isPublish ? 'Publish' : 'Unpublish'} audiobook "${editorState.draft.title || editorState.draft.id}"?`,
      );
      if (!confirmed) {
        editorState = {
          ...editorState,
          status: 'editing',
        };
        render();
        return;
      }

      editorState = {
        ...editorState,
        status: isPublish ? 'publishing' : 'unpublishing',
      };
      render();

      try {
        const nextRecord = isPublish
          ? await editorRepository.publishAudiobook(editorState.draft.id)
          : await editorRepository.unpublishAudiobook(editorState.draft.id);

        if (!nextRecord) {
          throw new Error('Unable to update audiobook publish state.');
        }

        syncContentListFromEditorRecord(nextRecord);
        editorState = createAudiobookEditorState(nextRecord);
        editorState = {
          ...editorState,
          status: 'success',
          message: isPublish ? 'Audiobook published.' : 'Audiobook unpublished.',
        };

        const auditEntry = await auditRepository.recordAuditTrail(
          buildAuditEntryFromRecord(
            nextRecord,
            'audiobook',
            isPublish ? 'publish' : 'unpublish',
            { reindexStatus: 'done' },
          ),
        );
        syncAuditEntry(auditEntry);

        if (routeState.pathname === '/audit') {
          void loadAuditTrail(parseAdminLocation(location));
        }

        render();
      } catch (error) {
        editorState = {
          ...editorState,
          status: 'error',
          message: error instanceof Error ? error.message : 'Không thể cập nhật publish state.',
        };
        render();
      }
    });
  }

  function bindChapterManagerActions(routeState) {
    const form = rootElement.querySelector('[data-chapter-form]');
    if (!form) {
      return;
    }

    const audiobookId = routeState.pathname.split('/')[2];

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const validation = validateChapterDraft(chapterState.draft, chapterState.chapters);
      chapterState = {
        ...chapterState,
        status: validation.valid ? 'saving' : 'validation_error',
        errors: validation.errors,
        message: validation.valid ? '' : 'Please fix the errors before saving.',
      };
      render();

      if (!validation.valid) {
        return;
      }

      try {
        const savedRecord = await chapterRepository.saveChapter({
          mode: chapterState.draft.id ? 'edit' : 'create',
          audiobookId,
          draft: chapterState.draft,
        });

        syncChapterListFromRecord(savedRecord);

        chapterState = {
          ...chapterState,
          status: 'saved',
          errors: {},
          message: 'Chapter saved successfully.',
          selectedChapterId: savedRecord.id,
          draft: buildChapterDraftFromRecord(savedRecord, audiobookId),
        };
        chapterIsLoaded = true;
        chapterRouteKey = routeState.pathname;
        render();
      } catch (error) {
        chapterState = {
          ...chapterState,
          status: 'editing',
          message: error instanceof Error ? error.message : 'Unable to save chapter.',
        };
        render();
      }
    });

    form.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const fieldName = target.getAttribute('name');

      if (fieldName === 'title' || fieldName === 'audioAssetKey' || fieldName === 'transcript') {
        chapterState = {
          ...chapterState,
          draft: {
            ...chapterState.draft,
            [fieldName]: target.value,
          },
        };
        renderPreservingFocus();
        return;
      }

      if (fieldName === 'orderIndex' || fieldName === 'durationSec') {
        chapterState = {
          ...chapterState,
          draft: {
            ...chapterState.draft,
            [fieldName]: Number(target.value),
          },
        };
        renderPreservingFocus();
      }
    });

    form.addEventListener('change', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const fileInput = target.getAttribute('data-chapter-audio-input');
      if (fileInput === null) {
        return;
      }

      const file = target.files?.[0];
      if (!file) {
        return;
      }

      chapterState = {
        ...chapterState,
        status: 'uploading',
        message: '',
      };
      render();

      const reader = new FileReader();
      reader.onload = () => {
        Promise.resolve(
          chapterRepository.uploadChapterAudio({
            audiobookId,
            draft: chapterState.draft,
            fileName: file.name,
            previewUrl: String(reader.result ?? ''),
          }),
        )
          .then((nextDraft) => {
            chapterState = {
              ...chapterState,
              status: 'editing',
              draft: {
                ...chapterState.draft,
                ...nextDraft,
              },
            };
            render();
          })
          .catch((error) => {
            chapterState = {
              ...chapterState,
              status: 'editing',
              message: error instanceof Error ? error.message : 'Unable to upload audio.',
            };
            render();
          });
      };
      reader.readAsDataURL(file);
    });

    form.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const actionButton = target.closest('[data-chapter-action]');
      if (!actionButton || !(actionButton instanceof HTMLElement)) {
        return;
      }

      const action = actionButton.getAttribute('data-chapter-action');
      const chapterId = actionButton.getAttribute('data-chapter-id');

      if (action === 'new') {
        chapterState = {
          ...chapterState,
          status: 'editing',
          errors: {},
          message: '',
          selectedChapterId: '',
          draft: createNewChapterDraft(audiobookId),
        };
        render();
        return;
      }

      if (action === 'reset') {
        chapterState = {
          ...chapterState,
          status: 'editing',
          errors: {},
          message: '',
          selectedChapterId: chapterState.selectedChapterId || '',
          draft: chapterState.selectedChapterId
            ? buildChapterDraftFromRecord(
                chapterRepository.getChapter(audiobookId, chapterState.selectedChapterId)
                  ?? chapterState.chapters[0]
                  ?? createBlankChapterDraft(audiobookId),
                audiobookId,
              )
            : createNewChapterDraft(audiobookId),
        };
        render();
        return;
      }

      if (!chapterId) {
        return;
      }

      if (action === 'select') {
        syncChapterDraftFromSelection(audiobookId, chapterId);
        render();
        return;
      }

      if (action === 'up' || action === 'down') {
        chapterState = {
          ...chapterState,
          chapters: chapterRepository.reorderChapter(audiobookId, chapterId, action),
        };
        if (chapterState.selectedChapterId === chapterId) {
          const nextSelected = chapterRepository.getChapter(audiobookId, chapterId);
          if (nextSelected) {
            chapterState = {
              ...chapterState,
              draft: buildChapterDraftFromRecord(nextSelected, audiobookId),
            };
          }
        }
        render();
        return;
      }

      if (action === 'publish' || action === 'unpublish') {
        const published = action === 'publish';
        chapterState = {
          ...chapterState,
          status: 'confirming',
          message: '',
        };
        render();

        const confirmed = window.confirm(
          `${published ? 'Publish' : 'Unpublish'} chapter "${chapterState.chapters.find((chapter) => chapter.id === chapterId)?.title ?? chapterId}"?`,
        );
        if (!confirmed) {
          chapterState = {
            ...chapterState,
            status: 'editing',
          };
          render();
          return;
        }

        chapterState = {
          ...chapterState,
          status: published ? 'publishing' : 'unpublishing',
        };
        render();

        try {
          const updated = await chapterRepository.publishChapter(audiobookId, chapterId, published);
          if (!updated) {
            throw new Error('Unable to update chapter publish state.');
          }

          if (updated) {
            syncChapterListFromRecord(updated);
          }

          if (chapterState.selectedChapterId === updated.id) {
            chapterState = {
              ...chapterState,
              draft: buildChapterDraftFromRecord(updated, audiobookId),
            };
          }

          chapterState = {
            ...chapterState,
            status: 'success',
            message: published ? 'Chapter published.' : 'Chapter unpublished.',
          };

          const auditEntry = await auditRepository.recordAuditTrail(
            buildAuditEntryFromRecord(
              updated,
              'chapter',
              published ? 'publish' : 'unpublish',
              {
                audiobookId,
                reindexStatus: 'done',
              },
            ),
          );
          syncAuditEntry(auditEntry);

          if (routeState.pathname === '/audit') {
            void loadAuditTrail(parseAdminLocation(location));
          }

          render();
        } catch (error) {
          chapterState = {
            ...chapterState,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update chapter publish state.',
          };
          render();
        }
      }
    });
  }

  function bindTaxonomyActions(routeState) {
    const form = rootElement.querySelector('[data-taxonomy-form]');
    const searchForm = rootElement.querySelector('[data-taxonomy-search-form]');
    if (!form || !searchForm) {
      return;
    }

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(searchForm);
      const query = String(formData.get('query') ?? '').trim();
      navigate('/taxonomy', {
        tab: taxonomyState.type,
        query,
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const validation = validateTaxonomyDraft(taxonomyState.draft, taxonomyState.records);
      taxonomyState = {
        ...taxonomyState,
        status: validation.valid ? 'saving' : 'error',
        errors: validation.errors,
        message: validation.valid ? '' : 'Please fix the errors before saving.',
      };
      render();

      if (!validation.valid) {
        return;
      }

      try {
        const savedRecord = await taxonomyRepository.saveTaxonomy({
          type: taxonomyState.type,
          mode: taxonomyState.draft.id ? 'edit' : 'create',
          draft: taxonomyState.draft,
        });

        syncTaxonomyRecord(savedRecord);
        taxonomyState = {
          ...taxonomyState,
          status: 'saved',
          message: `${savedRecord.name} saved successfully.`,
          selectedId: savedRecord.id,
          draft: buildTaxonomyDraftFromRecord(savedRecord, taxonomyState.type),
          filteredRecords: filterTaxonomyRecords(taxonomyState.records, taxonomyState.query),
        };
        taxonomyIsLoaded = true;
        taxonomyRouteKey = getTaxonomyRouteKey({
          pathname: '/taxonomy',
          search: {
            tab: taxonomyState.type,
            query: taxonomyState.query,
            selected: savedRecord.id,
          },
        });
        navigate('/taxonomy', {
          tab: taxonomyState.type,
          query: taxonomyState.query,
          selected: savedRecord.id,
        });
        render();
      } catch (error) {
        taxonomyState = {
          ...taxonomyState,
          status: 'editing',
          message: error instanceof Error ? error.message : 'Unable to save taxonomy.',
        };
        render();
      }
    });

    form.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const fieldName = target.getAttribute('name');
      if (fieldName === 'name' || fieldName === 'slug' || fieldName === 'description') {
        taxonomyState = {
          ...taxonomyState,
          draft: {
            ...taxonomyState.draft,
            [fieldName]: target.value,
          },
        };
        renderPreservingFocus();
      }
    });

    form.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const fieldName = target.getAttribute('name');
      if (fieldName === 'isActive') {
        taxonomyState = {
          ...taxonomyState,
          draft: {
            ...taxonomyState.draft,
            isActive: target.checked,
          },
        };
        renderPreservingFocus();
      }
    });

    form.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const button = target.closest('[data-taxonomy-action]');
      if (!button || !(button instanceof HTMLElement)) {
        return;
      }

      const action = button.getAttribute('data-taxonomy-action');
      const recordId = button.getAttribute('data-taxonomy-id');

      if (action === 'new') {
        taxonomyState = {
          ...taxonomyState,
          status: 'editing',
          errors: {},
          message: '',
          selectedId: '',
          draft: createNewTaxonomyDraft(taxonomyState.type),
        };
        render();
        return;
      }

      if (action === 'clear-search') {
        navigate('/taxonomy', {
          tab: taxonomyState.type,
          query: '',
        });
        return;
      }

      if (action === 'reset') {
        const selectedRecord = taxonomyRepository.getTaxonomy(taxonomyState.type, taxonomyState.selectedId);
        taxonomyState = {
          ...taxonomyState,
          status: 'editing',
          errors: {},
          message: '',
          draft: selectedRecord
            ? buildTaxonomyDraftFromRecord(selectedRecord, taxonomyState.type)
            : createNewTaxonomyDraft(taxonomyState.type),
        };
        render();
        return;
      }

      if (action === 'delete-draft') {
        if (!taxonomyState.draft.id) {
          taxonomyState = {
            ...taxonomyState,
            draft: createNewTaxonomyDraft(taxonomyState.type),
            message: '',
          };
          render();
          return;
        }

        const confirmed = window.confirm(`Delete ${taxonomyState.draft.name || 'this taxonomy'}?`);
        if (!confirmed) {
          return;
        }

        const nextRecords = await taxonomyRepository.deleteTaxonomy({
          type: taxonomyState.type,
          id: taxonomyState.draft.id,
        });

        taxonomyState = {
          ...taxonomyState,
          records: nextRecords,
          filteredRecords: filterTaxonomyRecords(nextRecords, taxonomyState.query),
          selectedId: nextRecords[0]?.id ?? '',
          draft: nextRecords[0]
            ? buildTaxonomyDraftFromRecord(nextRecords[0], taxonomyState.type)
            : createNewTaxonomyDraft(taxonomyState.type),
          message: 'Taxonomy deleted.',
        };
        render();
        return;
      }

      if (!recordId) {
        return;
      }

      if (action === 'select') {
        syncTaxonomyDraftFromSelection(taxonomyState.type, recordId);
        navigate('/taxonomy', {
          tab: taxonomyState.type,
          query: taxonomyState.query,
          selected: recordId,
        });
        render();
        return;
      }

      if (action === 'delete') {
        const record = taxonomyRepository.getTaxonomy(taxonomyState.type, recordId);
        const confirmed = window.confirm(`Delete ${record?.name ?? 'this taxonomy'}?`);
        if (!confirmed) {
          return;
        }

        const nextRecords = await taxonomyRepository.deleteTaxonomy({
          type: taxonomyState.type,
          id: recordId,
        });
        const nextSelected = nextRecords[0]?.id ?? '';

        taxonomyState = {
          ...taxonomyState,
          records: nextRecords,
          filteredRecords: filterTaxonomyRecords(nextRecords, taxonomyState.query),
          selectedId: nextSelected,
          draft: nextSelected
            ? buildTaxonomyDraftFromRecord(nextRecords[0], taxonomyState.type)
            : createNewTaxonomyDraft(taxonomyState.type),
          message: 'Taxonomy deleted.',
        };
        navigate('/taxonomy', {
          tab: taxonomyState.type,
          query: taxonomyState.query,
          selected: nextSelected,
        });
        render();
      }
    });
  }

  function bindAuditTrailActions(routeState) {
    const form = rootElement.querySelector('[data-audit-filter-form]');
    if (!form) {
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const entityType = String(formData.get('entityType') ?? 'audiobook').trim() || 'audiobook';
      const entityId = String(formData.get('entityId') ?? '').trim();
      const query = String(formData.get('query') ?? '').trim();

      navigate('/audit', {
        entityType,
        entityId,
        query,
      });
    });

    form.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.getAttribute('name') !== 'entityType') {
        return;
      }

      const entityType = String(target.value ?? 'audiobook').trim() || 'audiobook';
      const nextOptions = getAuditEntityOptions(entityType);
      navigate('/audit', {
        entityType,
        entityId: nextOptions[0]?.id ?? '',
        query: auditState.filters.query ?? '',
      });
    });

    const resetButton = rootElement.querySelector('[data-audit-action="reset"]');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        navigate('/audit', {
          entityType: 'audiobook',
          entityId: getAuditEntityOptions('audiobook')[0]?.id ?? '',
          query: '',
        });
      });
    }
  }

  function handleHashChange() {
    render();
  }

  async function start() {
    window.addEventListener('hashchange', handleHashChange);

    if (!location.hash) {
      navigate('/dashboard');
    }

    await runBootstrap();
  }

  function destroy() {
    window.removeEventListener('hashchange', handleHashChange);
  }

  return {
    start,
    destroy,
    render,
    getSessionState: () => sessionState,
    getCurrentRoute: () => currentRoute,
  };
}
