import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import type { ColDef } from 'ag-grid-community';
import { AdminDataGrid } from '@/components/admin/AdminDataGrid';
import { type RowAction } from '@/components/admin/RowActionsCell';
import { BulkUploadDialog } from '@/components/admin/BulkUploadDialog';
import { StepperSheet, type WizardStep } from '@/components/admin/StepperSheet';
import ImagePicker from '@/components/admin/ImagePicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useAdminMenu, useAdminReservations, useAdminStory, useAdminWokOptions, useDeactivateWokOption, useDeleteChapter,
  useDeleteDish, useSaveChapter, useSaveDish, useSaveWokOption,
} from '@/hooks/restaurantHooks';
import { restaurantService } from '@/services/restaurantService';
import { COURSE_LABEL, CUISINE_LABEL, formatINR } from '@/lib/format';
import {
  COURSES, CUISINES, DIETS, WOK_GROUPS, type Course, type Cuisine, type DietType, type MenuItemDto, type ReservationDto,
  type StoryChapterDto, type WokGroup, type WokOptionDto,
} from '@/types/restaurant';
import { cn } from '@/lib/utils';

const bad = 'border-destructive focus-visible:ring-destructive';
const DIET_TEXT: Record<DietType, string> = { VEG: 'Veg', EGG: 'Egg', NON_VEG: 'Non-veg' };

function ErrorBar({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div role="alert" className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm">
      <ul className="list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
    </div>
  );
}

export default function AdminRestaurantPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Restaurant</h1>
        <p className="text-sm text-muted-foreground">Menu, Wok Bar options, Our Story and table bookings for Spring Onion.</p>
      </div>
      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="wok">Wok Bar</TabsTrigger>
          <TabsTrigger value="story">Our Story</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="menu"><MenuAdmin /></TabsContent>
        <TabsContent value="wok"><WokAdmin /></TabsContent>
        <TabsContent value="story"><StoryAdmin /></TabsContent>
        <TabsContent value="bookings"><BookingsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Menu ──
interface DishForm { id?: number | null; name: string; description: string; price: string; cuisine: Cuisine; course: Course; diet: DietType; spiceLevel: number; signature: boolean; passport: boolean; jainOption: boolean; imageUrl: string | null; active: boolean; sortOrder: string }
const emptyDish: DishForm = { name: '', description: '', price: '', cuisine: 'CHINESE', course: 'STARTER', diet: 'VEG', spiceLevel: 0, signature: false, passport: false, jainOption: false, imageUrl: null, active: true, sortOrder: '100' };

function MenuAdmin() {
  const { data } = useAdminMenu();
  const save = useSaveDish();
  const del = useDeleteDish();
  const [form, setForm] = useState<DishForm | null>(null);
  const set = (patch: Partial<DishForm>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const priceNum = Number(form?.price);
  const errs = form ? [
    !form.name.trim() && 'Name is required.',
    !(priceNum > 0) && 'Price must be more than ₹0.',
    !(Number(form.sortOrder) >= 0) && 'Sort order must be 0 or more.',
  ].filter(Boolean) as string[] : [];
  const canSave = !!form && errs.length === 0 && !save.isPending;

  const cols = useMemo<ColDef<MenuItemDto>[]>(() => [
    { field: 'name', headerName: 'Dish', flex: 2 },
    { field: 'cuisine', valueFormatter: (p) => CUISINE_LABEL[p.value as string] ?? p.value },
    { field: 'course', valueFormatter: (p) => COURSE_LABEL[p.value as string] ?? p.value },
    { field: 'diet', valueFormatter: (p) => DIET_TEXT[p.value as DietType] ?? p.value, width: 110 },
    { field: 'price', valueFormatter: (p) => formatINR(p.value as number), width: 110 },
    { field: 'signature', width: 110 },
    { field: 'passport', width: 110 },
    { field: 'active', width: 100 },
  ], []);
  const actions: RowAction<MenuItemDto>[] = [
    { label: 'Edit', icon: Pencil, onClick: (d) => setForm({ id: d.id, name: d.name, description: d.description ?? '', price: String(d.price), cuisine: d.cuisine, course: d.course, diet: d.diet, spiceLevel: d.spiceLevel, signature: d.signature, passport: d.passport, jainOption: d.jainOption, imageUrl: d.imageUrl ?? null, active: d.active, sortOrder: String(d.sortOrder) }) },
    { label: 'Delete', icon: Trash2, danger: true, onClick: (d) => { if (window.confirm(`Delete ${d.name}? Past orders keep their copy.`)) del.mutate(d.id); } },
  ];

  async function onSave() {
    if (!form || !canSave) return;
    await save.mutateAsync({ id: form.id, req: { name: form.name.trim(), description: form.description.trim() || null, price: priceNum, cuisine: form.cuisine, course: form.course, diet: form.diet, spiceLevel: form.spiceLevel, signature: form.signature, passport: form.passport, jainOption: form.jainOption, imageUrl: form.imageUrl || null, active: form.active, sortOrder: Number(form.sortOrder), branchIds: [] } });
    setForm(null);
  }

  const steps: WizardStep[] = form ? [
    { id: 'details', title: 'Details', description: 'Name, price, cuisine', error: errs.length > 0, complete: errs.length === 0, content: (
      <div className="space-y-4">
        <ErrorBar errors={errs} />
        <div><Label htmlFor="d-name">Name</Label><Input id="d-name" value={form.name} onChange={(e) => set({ name: e.target.value })} className={cn(!form.name.trim() && bad)} /></div>
        <div><Label htmlFor="d-desc">Description</Label><Textarea id="d-desc" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="d-price">Price (₹)</Label><Input id="d-price" inputMode="decimal" value={form.price} onChange={(e) => set({ price: e.target.value })} className={cn(!(priceNum > 0) && bad)} /></div>
          <div><Label htmlFor="d-sort">Sort order</Label><Input id="d-sort" inputMode="numeric" value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Cuisine</Label><Select value={form.cuisine} onValueChange={(v) => set({ cuisine: v as Cuisine })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CUISINES.map((c) => <SelectItem key={c} value={c}>{CUISINE_LABEL[c]}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Course</Label><Select value={form.course} onValueChange={(v) => set({ course: v as Course })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COURSES.map((c) => <SelectItem key={c} value={c}>{COURSE_LABEL[c]}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Veg / non-veg</Label><Select value={form.diet} onValueChange={(v) => set({ diet: v as DietType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DIETS.map((d) => <SelectItem key={d} value={d}>{DIET_TEXT[d]}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Spice</Label><Select value={String(form.spiceLevel)} onValueChange={(v) => set({ spiceLevel: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Mild', 'Medium', 'Hot', 'Fiery'].map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </div>
    ) },
    { id: 'flags', title: 'Badges & photo', description: 'Signature, passport, Jain', content: (
      <div className="space-y-4">
        {([['signature', 'Signature dish (hanko on the home page)'], ['passport', 'Earns an Oriental Passport stamp'], ['jainOption', 'Can be made Jain on request'], ['active', 'Show on the menu']] as const).map(([k, label]) => (
          <div key={k} className="flex items-center gap-3"><Switch id={`d-${k}`} checked={form[k]} onCheckedChange={(v) => set({ [k]: v } as Partial<DishForm>)} /><Label htmlFor={`d-${k}`}>{label}</Label></div>
        ))}
        <div><Label>Photo</Label><ImagePicker value={form.imageUrl} onChange={(url) => set({ imageUrl: url || null })} /></div>
      </div>
    ) },
  ] : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setForm({ ...emptyDish })}><Plus className="mr-2 h-4 w-4" />Add dish</Button>
        <BulkUploadDialog title="Bulk upload dishes" columns={['name', 'price', 'cuisine', 'course', 'diet', 'spiceLevel', 'description', 'signature', 'passport', 'jainOption', 'imageUrl', 'sortOrder']}
          sampleRow={['Veg Hakka Noodles', '279', 'CHINESE', 'RICE_NOODLES', 'VEG', '1', 'Wok-tossed noodles', 'false', 'false', 'true', '', '200']}
          templateName="menu-template.csv" onUpload={(f) => restaurantService.bulkUploadMenu(f)} />
      </div>
      <AdminDataGrid<MenuItemDto> rowData={data ?? []} columnDefs={cols} actions={actions} emptyMessage="No dishes yet." />
      <StepperSheet open={form != null} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? `Edit — ${form.name}` : 'New dish'} steps={steps} canSave={canSave} saving={save.isPending} onSave={onSave} />
    </div>
  );
}

// ── Wok Bar ──
interface WokForm { id?: number | null; groupCode: WokGroup; name: string; description: string; price: string; diet: DietType; active: boolean; sortOrder: string }
const GROUP_TEXT: Record<WokGroup, string> = { BASE: 'Base', PROTEIN: 'Protein', SAUCE: 'Sauce', VEGGIES: 'Greens', FINISH: 'Finish' };

function WokAdmin() {
  const { data } = useAdminWokOptions();
  const save = useSaveWokOption();
  const off = useDeactivateWokOption();
  const [form, setForm] = useState<WokForm | null>(null);
  const set = (patch: Partial<WokForm>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const priceNum = Number(form?.price);
  const errs = form ? [
    !form.name.trim() && 'Name is required.',
    (form.price.trim() === '' || !(priceNum >= 0)) && 'Price must be ₹0 or more.',
    form.groupCode === 'BASE' && !(priceNum > 0) && 'A base needs a price (it sets the bowl price).',
  ].filter(Boolean) as string[] : [];
  const canSave = !!form && errs.length === 0 && !save.isPending;
  const cols = useMemo<ColDef<WokOptionDto>[]>(() => [
    { field: 'groupCode', headerName: 'Step', valueFormatter: (p) => GROUP_TEXT[p.value as WokGroup] ?? p.value },
    { field: 'name', flex: 2 },
    { field: 'price', valueFormatter: (p) => formatINR(p.value as number) },
    { field: 'diet', valueFormatter: (p) => DIET_TEXT[p.value as DietType] ?? p.value },
    { field: 'active' },
  ], []);
  const actions: RowAction<WokOptionDto>[] = [
    { label: 'Edit', icon: Pencil, onClick: (o) => setForm({ id: o.id, groupCode: o.groupCode, name: o.name, description: o.description ?? '', price: String(o.price), diet: o.diet, active: o.active, sortOrder: String(o.sortOrder) }) },
    { label: 'Switch off', icon: Power, danger: true, hidden: (o) => !o.active, onClick: (o) => off.mutate(o.id) },
  ];
  async function onSave() {
    if (!form || !canSave) return;
    await save.mutateAsync({ id: form.id, req: { groupCode: form.groupCode, name: form.name.trim(), description: form.description.trim() || null, price: priceNum, diet: form.diet, active: form.active, sortOrder: Number(form.sortOrder) || 100 } });
    setForm(null);
  }
  const steps: WizardStep[] = form ? [{ id: 'opt', title: 'Option', error: errs.length > 0, complete: errs.length === 0, content: (
    <div className="space-y-4">
      <ErrorBar errors={errs} />
      <div><Label>Step</Label><Select value={form.groupCode} onValueChange={(v) => set({ groupCode: v as WokGroup })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WOK_GROUPS.map((g) => <SelectItem key={g} value={g}>{GROUP_TEXT[g]}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="w-name">Name</Label><Input id="w-name" value={form.name} onChange={(e) => set({ name: e.target.value })} className={cn(!form.name.trim() && bad)} /></div>
      <div><Label htmlFor="w-desc">Description</Label><Input id="w-desc" value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="w-price">{form.groupCode === 'BASE' ? 'Bowl price (₹)' : 'Adds (₹)'}</Label><Input id="w-price" inputMode="decimal" value={form.price} onChange={(e) => set({ price: e.target.value })} className={cn(errs.some((e) => e.includes('rice')) && bad)} /></div>
        <div><Label>Veg / non-veg</Label><Select value={form.diet} onValueChange={(v) => set({ diet: v as DietType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DIETS.map((d) => <SelectItem key={d} value={d}>{DIET_TEXT[d]}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="flex items-center gap-3"><Switch id="w-active" checked={form.active} onCheckedChange={(v) => set({ active: v })} /><Label htmlFor="w-active">Available</Label></div>
    </div>
  ) }] : [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setForm({ groupCode: 'SAUCE', name: '', description: '', price: '0', diet: 'VEG', active: true, sortOrder: '100' })}><Plus className="mr-2 h-4 w-4" />Add option</Button>
        <BulkUploadDialog title="Bulk upload Wok Bar options" columns={['group', 'name', 'price', 'diet', 'description', 'sortOrder']}
          sampleRow={['SAUCE', 'Black Bean', '20', 'VEG', 'Fermented black bean and garlic', '120']} templateName="wok-options-template.csv"
          onUpload={(f) => restaurantService.bulkUploadWokOptions(f)} />
      </div>
      <AdminDataGrid<WokOptionDto> rowData={data ?? []} columnDefs={cols} actions={actions} emptyMessage="No options yet." />
      <StepperSheet open={form != null} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? `Edit — ${form.name}` : 'New option'} steps={steps} canSave={canSave} saving={save.isPending} onSave={onSave} />
    </div>
  );
}

// ── Story ──
interface StoryForm { id?: number | null; eyebrow: string; title: string; body: string; imageUrl: string | null; sortOrder: string; active: boolean }

function StoryAdmin() {
  const { data } = useAdminStory();
  const save = useSaveChapter();
  const del = useDeleteChapter();
  const [form, setForm] = useState<StoryForm | null>(null);
  const set = (patch: Partial<StoryForm>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const errs = form ? [!form.title.trim() && 'Title is required.', !form.body.trim() && 'Write a few lines for this chapter.'].filter(Boolean) as string[] : [];
  const canSave = !!form && errs.length === 0 && !save.isPending;
  const cols = useMemo<ColDef<StoryChapterDto>[]>(() => [
    { field: 'sortOrder', headerName: 'Order', width: 100 },
    { field: 'eyebrow' },
    { field: 'title', flex: 2 },
    { field: 'active', width: 100 },
  ], []);
  const actions: RowAction<StoryChapterDto>[] = [
    { label: 'Edit', icon: Pencil, onClick: (c) => setForm({ id: c.id, eyebrow: c.eyebrow ?? '', title: c.title, body: c.body, imageUrl: c.imageUrl ?? null, sortOrder: String(c.sortOrder), active: c.active }) },
    { label: 'Delete', icon: Trash2, danger: true, onClick: (c) => { if (window.confirm(`Delete “${c.title}”?`)) del.mutate(c.id); } },
  ];
  async function onSave() {
    if (!form || !canSave) return;
    await save.mutateAsync({ id: form.id, req: { eyebrow: form.eyebrow.trim() || null, title: form.title.trim(), body: form.body.trim(), imageUrl: form.imageUrl || null, sortOrder: Number(form.sortOrder) || 100, active: form.active } });
    setForm(null);
  }
  const steps: WizardStep[] = form ? [{ id: 'chapter', title: 'Chapter', error: errs.length > 0, complete: errs.length === 0, content: (
    <div className="space-y-4">
      <ErrorBar errors={errs} />
      <div><Label htmlFor="s-eyebrow">Small label</Label><Input id="s-eyebrow" value={form.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} placeholder="e.g. The motto" /></div>
      <div><Label htmlFor="s-title">Title</Label><Input id="s-title" value={form.title} onChange={(e) => set({ title: e.target.value })} className={cn(!form.title.trim() && bad)} /></div>
      <div><Label htmlFor="s-body">Text</Label><Textarea id="s-body" rows={6} value={form.body} onChange={(e) => set({ body: e.target.value })} className={cn(!form.body.trim() && bad)} /></div>
      <div><Label htmlFor="s-sort">Order</Label><Input id="s-sort" inputMode="numeric" value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} /></div>
      <div><Label>Photo</Label><ImagePicker value={form.imageUrl} onChange={(url) => set({ imageUrl: url || null })} /></div>
      <div className="flex items-center gap-3"><Switch id="s-active" checked={form.active} onCheckedChange={(v) => set({ active: v })} /><Label htmlFor="s-active">Show on Our Story</Label></div>
    </div>
  ) }] : [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setForm({ eyebrow: '', title: '', body: '', imageUrl: null, sortOrder: '100', active: true })}><Plus className="mr-2 h-4 w-4" />Add chapter</Button>
        <BulkUploadDialog title="Bulk upload story chapters" columns={['eyebrow', 'title', 'body', 'imageUrl', 'sortOrder']} sampleRow={['2026', 'A new chapter', 'What happened…', '', '70']}
          templateName="story-template.csv" onUpload={(f) => restaurantService.bulkUploadStory(f)} />
      </div>
      <AdminDataGrid<StoryChapterDto> rowData={data ?? []} columnDefs={cols} actions={actions} emptyMessage="No chapters yet." />
      <StepperSheet open={form != null} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? 'Edit chapter' : 'New chapter'} steps={steps} canSave={canSave} saving={save.isPending} onSave={onSave} />
    </div>
  );
}

// ── Bookings (read-only; status is managed on the order board, "table" workflow) ──
function BookingsAdmin() {
  const { data } = useAdminReservations();
  const cols = useMemo<ColDef<ReservationDto>[]>(() => [
    { field: 'date', sort: 'desc', width: 120 },
    { field: 'timeLabel', headerName: 'Time', width: 110 },
    { field: 'partySize', headerName: 'Guests', width: 100 },
    { field: 'contactName', headerName: 'Name' },
    { field: 'occasion', valueFormatter: (p) => (p.value === 'NONE' ? '' : String(p.value ?? '').replace('_', ' ').toLowerCase()) },
    { field: 'statusLabel', headerName: 'Status' },
    { field: 'note', flex: 2 },
    { field: 'orderNumber', headerName: 'Ticket' },
  ], []);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Confirm, seat and close bookings on the <Link className="font-medium underline" to="/admin/orders">order board</Link> (choose the “Table bookings” workflow). Guests see each move live.
      </p>
      <AdminDataGrid<ReservationDto> rowData={data ?? []} columnDefs={cols} emptyMessage="No bookings yet." />
    </div>
  );
}
