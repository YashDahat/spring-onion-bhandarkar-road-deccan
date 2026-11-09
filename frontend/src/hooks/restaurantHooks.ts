import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurantService';
import { withToast } from '@/lib/apiToast';
import { useAuth } from '@/context/AuthContext';
import type {
  CreateReservationRequest, MenuFilter, UpsertMenuItemRequest, UpsertStoryChapterRequest, UpsertWokOptionRequest,
} from '@/types/restaurant';

export const rkeys = {
  menu: (f: MenuFilter) => ['menu', f] as const,
  wokOptions: ['wok-options'] as const,
  story: ['story'] as const,
  slots: (date: string, branchId?: number | null) => ['slots', date, branchId ?? null] as const,
  favourites: ['favourites'] as const,
  reservations: ['reservations'] as const,
  passport: ['passport'] as const,
  track: (id: number) => ['track', id] as const,
  adminMenu: ['admin-menu'] as const,
  adminWok: ['admin-wok-options'] as const,
  adminStory: ['admin-story'] as const,
  adminReservations: ['admin-reservations'] as const,
};

// ── Public ──
export const useMenu = (filter: MenuFilter = {}) =>
  useQuery({ queryKey: rkeys.menu(filter), queryFn: () => restaurantService.menu(filter), staleTime: 60_000 });
export const useWokOptions = () =>
  useQuery({ queryKey: rkeys.wokOptions, queryFn: restaurantService.wokOptions, staleTime: 60_000 });
export const useStory = () => useQuery({ queryKey: rkeys.story, queryFn: restaurantService.story, staleTime: 300_000 });
export const useSlots = (date: string | null, branchId?: number | null) =>
  useQuery({ queryKey: rkeys.slots(date ?? '', branchId), queryFn: () => restaurantService.availability(date!, branchId), enabled: !!date });

// ── Signed-in guest ──
export function useFavourites() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: rkeys.favourites, queryFn: restaurantService.favourites, enabled: isAuthenticated });
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemType, itemId, name }: { itemType: string; itemId: number; name: string }) => {
      const res = await restaurantService.toggleFavourite(itemType, itemId);
      const { toast } = await import('sonner');
      toast.success(res.favourited ? `${name} saved to your favourites` : `${name} removed from favourites`);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rkeys.favourites }),
  });
}

export function useMyReservations() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: rkeys.reservations, queryFn: restaurantService.myReservations, enabled: isAuthenticated });
}

export function useBookTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateReservationRequest) => withToast(restaurantService.book(req), 'Table requested — we’ll confirm shortly'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rkeys.reservations });
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => withToast(restaurantService.cancelReservation(id), 'Booking cancelled'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rkeys.reservations });
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function usePassport() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: rkeys.passport, queryFn: restaurantService.passport, enabled: isAuthenticated });
}

export function useClaimMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: number) => withToast(restaurantService.claimMilestone(m), 'Milestone claimed'),
    onSuccess: () => qc.invalidateQueries({ queryKey: rkeys.passport }),
  });
}

export const useTrack = (orderId: number | null) =>
  useQuery({
    queryKey: rkeys.track(orderId ?? 0),
    queryFn: () => restaurantService.track(orderId!),
    enabled: orderId != null,
    refetchInterval: (q) => (q.state.data?.finished || q.state.data?.cancelled ? false : 15_000),
  });

// ── Admin ──
export const useAdminMenu = () => useQuery({ queryKey: rkeys.adminMenu, queryFn: restaurantService.adminMenu });
export function useSaveDish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id?: number | null; req: UpsertMenuItemRequest }) =>
      withToast(id ? restaurantService.updateDish(id, req) : restaurantService.createDish(req), id ? 'Dish updated' : 'Dish added'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rkeys.adminMenu }); qc.invalidateQueries({ queryKey: ['menu'] }); },
  });
}
export function useDeleteDish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => withToast(restaurantService.deleteDish(id), 'Dish removed'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rkeys.adminMenu }); qc.invalidateQueries({ queryKey: ['menu'] }); },
  });
}

export const useAdminWokOptions = () => useQuery({ queryKey: rkeys.adminWok, queryFn: restaurantService.adminWokOptions });
export function useSaveWokOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id?: number | null; req: UpsertWokOptionRequest }) =>
      withToast(id ? restaurantService.updateWokOption(id, req) : restaurantService.createWokOption(req), id ? 'Option updated' : 'Option added'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rkeys.adminWok }); qc.invalidateQueries({ queryKey: rkeys.wokOptions }); },
  });
}
export function useDeactivateWokOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => withToast(restaurantService.deactivateWokOption(id), 'Option switched off'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rkeys.adminWok }); qc.invalidateQueries({ queryKey: rkeys.wokOptions }); },
  });
}

export const useAdminStory = () => useQuery({ queryKey: rkeys.adminStory, queryFn: restaurantService.adminStory });
export function useSaveChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id?: number | null; req: UpsertStoryChapterRequest }) =>
      withToast(id ? restaurantService.updateChapter(id, req) : restaurantService.createChapter(req), id ? 'Chapter updated' : 'Chapter added'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rkeys.adminStory }); qc.invalidateQueries({ queryKey: rkeys.story }); },
  });
}
export function useDeleteChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => withToast(restaurantService.deleteChapter(id), 'Chapter removed'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rkeys.adminStory }); qc.invalidateQueries({ queryKey: rkeys.story }); },
  });
}

export const useAdminReservations = () =>
  useQuery({ queryKey: rkeys.adminReservations, queryFn: restaurantService.adminReservations, refetchInterval: 60_000 });
