import {
  DEMO_AUDIOBOOKS,
  normalizeContentDashboardFilters,
  normalizeContentDashboardItem,
  paginateContentAudiobooks,
} from './content-dashboard-data.js';

export function createContentDashboardRepository({ adminApi, fallbackItems = DEMO_AUDIOBOOKS } = {}) {
  async function listAudiobooks(search = {}) {
    const filters = normalizeContentDashboardFilters(search);

    try {
      if (!adminApi?.listAudiobooks) {
        throw new Error('Admin API listAudiobooks is unavailable.');
      }

      const response = await adminApi.listAudiobooks(filters);
      const apiItems = Array.isArray(response?.data)
        ? response.data.map(normalizeContentDashboardItem)
        : [];

      return {
        source: 'api',
        items: apiItems,
        meta: {
          query: filters.query,
          status: filters.status,
          page: response?.meta?.page ?? filters.page,
          pageSize: response?.meta?.pageSize ?? filters.pageSize,
          totalItems: response?.meta?.totalItems ?? apiItems.length,
          totalPages: response?.meta?.totalPages ?? 1,
          hasNext: response?.meta?.hasNext ?? false,
          hasPrevious: response?.meta?.hasPrevious ?? false,
        },
      };
    } catch {
      return {
        source: 'demo',
        ...paginateContentAudiobooks(fallbackItems, filters),
      };
    }
  }

  return {
    listAudiobooks,
  };
}
