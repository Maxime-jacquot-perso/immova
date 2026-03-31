import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../../auth/auth-context';
import {
  createMembership,
  getCurrentOrganization,
  listMemberships,
} from '../../projects/api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { EmptyState } from '../../../shared/ui/empty-state';
import { getErrorMessage } from '../../../shared/ui/error-utils';

const schema = z.object({
  email: z.string().email('Saisissez un email valide.'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres.'),
  role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'READER']),
});

type FormValues = z.infer<typeof schema>;

function getRoleLabel(role: FormValues['role']) {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'MANAGER':
      return 'Gestion';
    case 'ACCOUNTANT':
      return 'Comptabilite';
    case 'READER':
      return 'Lecture';
    default:
      return role;
  }
}

export function SettingsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);

  const organizationQuery = useQuery({
    queryKey: ['organization-current'],
    queryFn: () => getCurrentOrganization(session),
  });

  const membershipsQuery = useQuery({
    queryKey: ['memberships'],
    queryFn: () => listMemberships(session),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'MANAGER',
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: FormValues) => createMembership(session, payload),
    onSuccess: async (_, variables) => {
      reset();
      setFeedback({
        type: 'success',
        title: 'Membre ajoute',
        message: `Le compte ${variables.email} a ete ajoute a l'organisation.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: "Impossible d'ajouter le membre",
        message: getErrorMessage(error),
      });
    },
  });

  if (organizationQuery.isLoading || membershipsQuery.isLoading) {
    return <LoadingBlock label="Chargement de l'organisation..." />;
  }

  if (organizationQuery.isError) {
    return (
      <ErrorState
        error={organizationQuery.error}
        onRetry={() => {
          void organizationQuery.refetch();
        }}
        title="Impossible de charger l'organisation"
      />
    );
  }

  if (membershipsQuery.isError) {
    return (
      <ErrorState
        error={membershipsQuery.error}
        onRetry={() => {
          void membershipsQuery.refetch();
        }}
        title="Impossible de charger les membres"
      />
    );
  }

  return (
    <div className="stack">
      {feedback ? (
        <FeedbackMessage
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          title={feedback.title}
          type={feedback.type}
        />
      ) : null}

      <div className="grid grid--2">
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>Organisation</h1>
        <div className="stack stack--sm">
          <div>
            <div className="meta">Organisation</div>
            <strong>{organizationQuery.data?.name}</strong>
          </div>
          <div>
            <div className="meta">Slug</div>
            <strong>{organizationQuery.data?.slug}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Ajouter un membre</h2>
        <form
          className="stack"
          onSubmit={handleSubmit((values) => {
            mutation.mutate(values);
          })}
        >
          <div className="field">
            <label htmlFor="member-email">Email</label>
            <input id="member-email" {...register('email')} />
            {errors.email ? <div className="field__error">{errors.email.message}</div> : null}
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="member-first">Prenom</label>
              <input id="member-first" {...register('firstName')} />
            </div>
            <div className="field">
              <label htmlFor="member-last">Nom</label>
              <input id="member-last" {...register('lastName')} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="member-password">Mot de passe</label>
            <input id="member-password" type="password" {...register('password')} />
            {errors.password ? (
              <div className="field__error">{errors.password.message}</div>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="member-role">Role</label>
            <select id="member-role" {...register('role')}>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Gestion</option>
              <option value="ACCOUNTANT">Comptabilite</option>
              <option value="READER">Lecture</option>
            </select>
          </div>
          <button className="button" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </form>
      </section>

      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2 style={{ marginTop: 0 }}>Membres</h2>
        {(membershipsQuery.data ?? []).length === 0 ? (
          <EmptyState
            description="Ajoutez un premier membre pour partager le suivi de l'organisation."
            title="Aucun membre pour le moment"
            withPanel={false}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {(membershipsQuery.data ?? []).map((membership) => (
                  <tr key={membership.id}>
                    <td>
                      {[membership.user.firstName, membership.user.lastName]
                        .filter(Boolean)
                        .join(' ') || '—'}
                    </td>
                    <td>{membership.user.email}</td>
                    <td>{getRoleLabel(membership.role as FormValues['role'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
