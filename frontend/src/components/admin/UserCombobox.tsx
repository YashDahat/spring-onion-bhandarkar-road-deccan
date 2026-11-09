// Stand-in for the foundation's missing `@/components/admin/UserCombobox` (imported by the fenced loyalty
// CodesPage but absent from webapp-foundation). Minimal searchable user picker over the admin users list.
// Reported upstream as a suspected foundation bug — replace with the foundation's own component when it ships.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Input } from '@/components/ui/input';

interface Props {
  id?: string;
  value: number | null;
  onChange: (userId: number | null) => void;
}

export function UserCombobox({ id, value, onChange }: Props) {
  const { data: users } = useQuery({ queryKey: ['admin-users-combobox'], queryFn: userService.list });
  const [q, setQ] = useState('');
  const options = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (users ?? []).filter((u) =>
      !needle || `${u.firstName ?? ''} ${u.lastName ?? ''} ${u.email} ${u.phone}`.toLowerCase().includes(needle)).slice(0, 50);
  }, [users, q]);
  return (
    <div className="space-y-2">
      <Input id={id ? `${id}-search` : undefined} aria-label="Search users" placeholder="Search name, email or phone"
        value={q} onChange={(e) => setQ(e.target.value)} />
      <select
        id={id}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      >
        <option value="">— Public code (no user) —</option>
        {options.map((u) => (
          <option key={u.id} value={u.id}>
            {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email} · {u.email}
          </option>
        ))}
      </select>
    </div>
  );
}

export default UserCombobox;
