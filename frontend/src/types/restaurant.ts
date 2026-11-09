// Spring Onion domain types — mirror backend RestaurantDtos.
import type { CatalogItemDto } from '@/types/catalog';

export type Cuisine = 'CHINESE' | 'INDO_CHINESE' | 'THAI' | 'JAPANESE' | 'PAN_ASIAN' | 'DESSERT' | 'BEVERAGE';
export type Course = 'SOUP' | 'SALAD' | 'STARTER' | 'DIM_SUM' | 'MAIN' | 'RICE_NOODLES' | 'DESSERT' | 'DRINK';
export type DietType = 'VEG' | 'EGG' | 'NON_VEG';
export type WokGroup = 'BASE' | 'PROTEIN' | 'SAUCE' | 'VEGGIES' | 'FINISH';
export type Occasion = 'NONE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'DATE_NIGHT' | 'FAMILY' | 'BUSINESS' | 'GROUP_PARTY';

export const CUISINES: Cuisine[] = ['CHINESE', 'INDO_CHINESE', 'THAI', 'JAPANESE', 'PAN_ASIAN', 'DESSERT', 'BEVERAGE'];
export const COURSES: Course[] = ['SOUP', 'SALAD', 'STARTER', 'DIM_SUM', 'MAIN', 'RICE_NOODLES', 'DESSERT', 'DRINK'];
export const DIETS: DietType[] = ['VEG', 'EGG', 'NON_VEG'];
export const WOK_GROUPS: WokGroup[] = ['BASE', 'PROTEIN', 'SAUCE', 'VEGGIES', 'FINISH'];
export const OCCASIONS: Occasion[] = ['NONE', 'BIRTHDAY', 'ANNIVERSARY', 'DATE_NIGHT', 'FAMILY', 'BUSINESS', 'GROUP_PARTY'];

export interface MenuItemDto {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  cuisine: Cuisine;
  course: Course;
  diet: DietType;
  spiceLevel: number;
  signature: boolean;
  passport: boolean;
  jainOption: boolean;
  imageUrl?: string | null;
  active: boolean;
  sortOrder: number;
  workflowCode?: string | null;
  branchIds: number[];
}

export interface UpsertMenuItemRequest {
  name: string;
  description?: string | null;
  price: number;
  cuisine: Cuisine;
  course: Course;
  diet: DietType;
  spiceLevel: number;
  signature: boolean;
  passport: boolean;
  jainOption: boolean;
  imageUrl?: string | null;
  active: boolean;
  sortOrder: number;
  branchIds: number[];
}

export interface MenuFilter { cuisine?: Cuisine; diet?: DietType; q?: string; branchId?: number | null }

export interface WokOptionDto {
  id: number;
  groupCode: WokGroup;
  name: string;
  description?: string | null;
  price: number;
  diet: DietType;
  active: boolean;
  sortOrder: number;
}

export interface UpsertWokOptionRequest {
  groupCode: WokGroup;
  name: string;
  description?: string | null;
  price: number;
  diet: DietType;
  active: boolean;
  sortOrder: number;
}

export interface WokBuildRequest { baseId: number; proteinId: number; sauceId: number; addOnIds: number[]; spiceLevel: number }

export interface WokComboDto {
  id: number;
  name: string;
  summary: string;
  price: number;
  diet: DietType;
  spiceLevel: number;
  baseId: number;
  proteinId: number;
  sauceId: number;
  addOnIds: number[];
}

export interface FavouriteDto { id: number; itemType: string; itemId: number; item: CatalogItemDto; createdAt: string }

export interface SlotDto { time: string; label: string; sitting: string; seatsLeft: number; available: boolean }

export interface CreateReservationRequest {
  date: string;
  time: string;
  partySize: number;
  occasion: Occasion;
  note?: string | null;
  contactName: string;
  contactPhone: string;
  branchId?: number | null;
}

export interface ReservationDto {
  id: number;
  date: string;
  time: string;
  timeLabel: string;
  partySize: number;
  occasion: Occasion;
  note?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  branchId?: number | null;
  orderId?: number | null;
  orderNumber?: string | null;
  statusCode: string;
  statusLabel: string;
  cancellable: boolean;
  createdAt: string;
}

export interface StoryChapterDto { id: number; eyebrow?: string | null; title: string; body: string; imageUrl?: string | null; sortOrder: number; active: boolean }
export interface UpsertStoryChapterRequest { eyebrow?: string | null; title: string; body: string; imageUrl?: string | null; sortOrder: number; active: boolean }

export interface StampDto { itemId: number; name: string; slug: string; cuisine: Cuisine; diet: DietType; imageUrl?: string | null; stamped: boolean; stampedAt?: string | null }
export interface MilestoneDto { at: number; reached: boolean; claimed: boolean; offerCode?: string | null }
export interface PassportDto { stampedCount: number; total: number; stamps: StampDto[]; milestones: MilestoneDto[] }
export interface ClaimMilestoneResult { milestone: number; offerCode?: string | null; message: string }

export type TrackStepState = 'DONE' | 'CURRENT' | 'UPCOMING' | 'SKIPPED';
export interface TrackStepDto { code: string; label: string; state: TrackStepState; enteredAt?: string | null; targetMinutes?: number | null }
export interface TrackDto {
  orderId: number;
  orderNumber: string;
  workflowCode: string;
  currentStageCode: string;
  currentStageLabel: string;
  cancelled: boolean;
  finished: boolean;
  fulfillmentType?: string | null;
  paymentState?: string | null;
  total: number;
  steps: TrackStepDto[];
  createdAt: string;
}
