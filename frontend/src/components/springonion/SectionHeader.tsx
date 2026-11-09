import type { ReactNode } from 'react';
import { BrushHeading } from './BrushHeading';
import { cn } from '@/lib/utils';

/** Numbered chapter header: "01 — — —" thin rule, then a brush heading and an optional lead. */
export function SectionHeader({ no, title, lead, accent, accentLabel, className, id }: {
  no: string; title: ReactNode; lead?: ReactNode; accent?: string; accentLabel?: string; className?: string; id?: string;
}) {
  return (
    <header className={cn('max-w-2xl', className)}>
      <div className="mb-4 flex items-center gap-4">
        <span className="section-no">{no}</span>
        <span className="thin-rule max-w-[8rem]" />
      </div>
      <BrushHeading level={2} accent={accent} accentLabel={accentLabel} id={id}>{title}</BrushHeading>
      {lead && <p className="mt-4 text-lg text-muted-foreground">{lead}</p>}
    </header>
  );
}
