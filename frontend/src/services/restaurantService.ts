// Spring Onion domain SDK (RestaurantPublicController, RestaurantGuestController, AdminRestaurantController).
import apiClient from '@/api/client';
import type { BulkUploadResult } from '@/types/bulkUpload';
import type {
  ClaimMilestoneResult, CreateReservationRequest, FavouriteDto, MenuFilter, MenuItemDto, PassportDto,
  ReservationDto, SlotDto, StoryChapterDto, TrackDto, UpsertMenuItemRequest, UpsertStoryChapterRequest,
  UpsertWokOptionRequest, WokBuildRequest, WokComboDto, WokOptionDto,
} from '@/types/restaurant';

function upload(url: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post<BulkUploadResult>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
}

export const restaurantService = {
  // ── Public ──
  menu: (filter: MenuFilter = {}) =>
    apiClient.get<MenuItemDto[]>('/api/v1/menu', {
      params: { cuisine: filter.cuisine || undefined, diet: filter.diet || undefined, q: filter.q || undefined, branchId: filter.branchId ?? undefined },
    }).then((r) => r.data),
  wokOptions: () => apiClient.get<WokOptionDto[]>('/api/v1/wok/options').then((r) => r.data),
  buildWok: (req: WokBuildRequest) => apiClient.post<WokComboDto>('/api/v1/wok/build', req).then((r) => r.data),
  wokCombo: (id: number) => apiClient.get<WokComboDto>(`/api/v1/wok/combos/${id}`).then((r) => r.data),
  story: () => apiClient.get<StoryChapterDto[]>('/api/v1/story').then((r) => r.data),
  availability: (date: string, branchId?: number | null) =>
    apiClient.get<SlotDto[]>('/api/v1/reservations/availability', { params: { date, branchId: branchId ?? undefined } }).then((r) => r.data),

  // ── Signed-in guest ──
  favourites: () => apiClient.get<FavouriteDto[]>('/api/v1/favourites').then((r) => r.data),
  toggleFavourite: (itemType: string, itemId: number) =>
    apiClient.post<{ favourited: boolean }>('/api/v1/favourites/toggle', { itemType, itemId }).then((r) => r.data),
  myReservations: () => apiClient.get<ReservationDto[]>('/api/v1/reservations').then((r) => r.data),
  book: (req: CreateReservationRequest) => apiClient.post<ReservationDto>('/api/v1/reservations', req).then((r) => r.data),
  cancelReservation: (id: number) => apiClient.post<ReservationDto>(`/api/v1/reservations/${id}/cancel`).then((r) => r.data),
  passport: () => apiClient.get<PassportDto>('/api/v1/passport').then((r) => r.data),
  claimMilestone: (m: number) => apiClient.post<ClaimMilestoneResult>(`/api/v1/passport/milestones/${m}/claim`).then((r) => r.data),
  track: (orderId: number) => apiClient.get<TrackDto>(`/api/v1/track/${orderId}`).then((r) => r.data),

  // ── Admin ──
  adminMenu: () => apiClient.get<MenuItemDto[]>('/api/v1/admin/menu').then((r) => r.data),
  createDish: (req: UpsertMenuItemRequest) => apiClient.post<MenuItemDto>('/api/v1/admin/menu', req).then((r) => r.data),
  updateDish: (id: number, req: UpsertMenuItemRequest) => apiClient.put<MenuItemDto>(`/api/v1/admin/menu/${id}`, req).then((r) => r.data),
  deleteDish: (id: number) => apiClient.delete(`/api/v1/admin/menu/${id}`).then(() => undefined),
  bulkUploadMenu: (file: File) => upload('/api/v1/admin/menu/bulk-upload', file),

  adminWokOptions: () => apiClient.get<WokOptionDto[]>('/api/v1/admin/wok-options').then((r) => r.data),
  createWokOption: (req: UpsertWokOptionRequest) => apiClient.post<WokOptionDto>('/api/v1/admin/wok-options', req).then((r) => r.data),
  updateWokOption: (id: number, req: UpsertWokOptionRequest) => apiClient.put<WokOptionDto>(`/api/v1/admin/wok-options/${id}`, req).then((r) => r.data),
  deactivateWokOption: (id: number) => apiClient.delete(`/api/v1/admin/wok-options/${id}`).then(() => undefined),
  bulkUploadWokOptions: (file: File) => upload('/api/v1/admin/wok-options/bulk-upload', file),

  adminStory: () => apiClient.get<StoryChapterDto[]>('/api/v1/admin/story').then((r) => r.data),
  createChapter: (req: UpsertStoryChapterRequest) => apiClient.post<StoryChapterDto>('/api/v1/admin/story', req).then((r) => r.data),
  updateChapter: (id: number, req: UpsertStoryChapterRequest) => apiClient.put<StoryChapterDto>(`/api/v1/admin/story/${id}`, req).then((r) => r.data),
  deleteChapter: (id: number) => apiClient.delete(`/api/v1/admin/story/${id}`).then(() => undefined),
  bulkUploadStory: (file: File) => upload('/api/v1/admin/story/bulk-upload', file),

  adminReservations: () => apiClient.get<ReservationDto[]>('/api/v1/admin/reservations').then((r) => r.data),
};
