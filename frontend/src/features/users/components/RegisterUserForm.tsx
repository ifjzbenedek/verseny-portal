import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { Role } from '@/shared/types/api';
import { registerUserSchema, type RegisterUserValues } from '../schemas';
import { useRegisterUser } from '../api';

interface Props {
  onDone?: () => void;
}

const ROLES: Role[] = ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'];

export function RegisterUserForm({ onDone }: Props) {
  const { t } = useTranslation();
  const reg = useRegisterUser();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterUserValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: { email: '', password: '', fullName: '', role: 'HALLGATO' },
  });
  const role = watch('role');

  const onSubmit = async (values: RegisterUserValues) => {
    try {
      await reg.mutateAsync(values);
      toast.success(t('common.created'));
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const pending = isSubmitting || reg.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reg-fullName">{t('auth.fullName')}</Label>
        <Input
          id="reg-fullName"
          {...register('fullName')}
          aria-invalid={Boolean(errors.fullName)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">{t('auth.email')}</Label>
        <Input
          id="reg-email"
          type="email"
          {...register('email')}
          aria-invalid={Boolean(errors.email)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password">{t('auth.password')}</Label>
        <Input
          id="reg-password"
          type="password"
          {...register('password')}
          aria-invalid={Boolean(errors.password)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-role">{t('auth.role')}</Label>
        <Select value={role} onValueChange={(v) => setValue('role', v as Role)}>
          <SelectTrigger id="reg-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {t(`roles.${r}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
