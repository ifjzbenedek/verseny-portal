import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { GradeResponse } from '../schemas';

interface Props {
  grades: GradeResponse[];
  onDelete?: (id: number) => void;
  showSubject?: boolean;
  showActions?: boolean;
}

export function GradeTable({ grades, onDelete, showSubject = true, showActions = false }: Props) {
  const { t, i18n } = useTranslation();
  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showSubject && <TableHead>{t('grades.subject')}</TableHead>}
          <TableHead>{t('grades.value')}</TableHead>
          <TableHead>{t('grades.type')}</TableHead>
          <TableHead>{t('grades.weight')}</TableHead>
          <TableHead>{t('grades.comment')}</TableHead>
          <TableHead>{t('grades.recordedAt')}</TableHead>
          {showActions && <TableHead className="text-right">{t('common.actions')}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {grades.map((g) => (
          <TableRow key={g.id}>
            {showSubject && <TableCell>{g.subjectName ?? '—'}</TableCell>}
            <TableCell>
              <Badge
                variant={g.value >= 4 ? 'default' : g.value === 1 ? 'destructive' : 'secondary'}
              >
                {g.value}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{t(`grades.types.${g.type}`)}</TableCell>
            <TableCell>{g.weight.toFixed(1)}</TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">
              {g.comment ?? ''}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {dateFmt.format(new Date(g.recordedAt))}
            </TableCell>
            {showActions && (
              <TableCell className="text-right">
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(t('grades.deleteConfirm'))) onDelete(g.id);
                    }}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
