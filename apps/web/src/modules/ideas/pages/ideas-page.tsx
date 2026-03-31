import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AdminBadge } from '../../admin/components/admin-badge';
import { canAccessBetaFeatures } from '../../auth/beta-access';
import { useAuth } from '../../auth/auth-context';
import {
  createIdea,
  listBetaIdeas,
  listIdeas,
  removeIdeaVote,
  voteIdea,
} from '../api';
import { EmptyState } from '../../../shared/ui/empty-state';
import { ErrorState } from '../../../shared/ui/error-state';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import {
  getFeatureRequestStatusLabel,
  getFeatureRequestStatusTone,
} from '../../../shared/ui/business-labels';
import { formatDate } from '../../../shared/ui/formatters';

const ideaSchema = z.object({
  title: z
    .string()
    .min(5, 'Le titre doit contenir au moins 5 caracteres.')
    .max(150, 'Le titre est trop long.'),
  description: z
    .string()
    .min(10, 'Precisez un peu mieux le besoin.')
    .max(2000, 'La description est trop longue.'),
});

type IdeaFormValues = z.infer<typeof ideaSchema>;

function getShortDescription(description: string) {
  if (description.length <= 240) {
    return description;
  }

  return `${description.slice(0, 237)}...`;
}

export function IdeasPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<'top' | 'recent'>('top');
  const [status, setStatus] = useState('ALL');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);
  const betaEnabled = canAccessBetaFeatures(session?.user);

  const ideasQuery = useQuery({
    queryKey: ['ideas', sort, status],
    queryFn: () =>
      listIdeas(session, {
        sort,
        status,
      }),
  });
  const betaIdeasQuery = useQuery({
    enabled: betaEnabled,
    queryKey: ['ideas', 'beta'],
    queryFn: () => listBetaIdeas(session),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaSchema),
  });

  const createMutation = useMutation({
    mutationFn: (payload: IdeaFormValues) => createIdea(session, payload),
    onSuccess: async () => {
      reset();
      setFeedback({
        type: 'success',
        title: 'Idee ajoutee',
        message: "Votre suggestion a bien ete enregistree dans la boite a idees.",
      });
      await queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: "Impossible d'enregistrer l'idee",
        message: getErrorMessage(error),
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (payload: {
      featureRequestId: string;
      hasVoted: boolean;
    }) =>
      payload.hasVoted
        ? removeIdeaVote(session, payload.featureRequestId)
        : voteIdea(session, payload.featureRequestId),
    onSuccess: async (_, variables) => {
      setFeedback({
        type: 'info',
        title: variables.hasVoted ? 'Vote retire' : 'Vote ajoute',
        message:
          'Les votes nous aident a reperer les sujets qui meritent une evaluation produit.',
      });
      await queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'Action impossible',
        message: getErrorMessage(error),
      });
    },
  });

  if (ideasQuery.isLoading) {
    return <LoadingBlock label="Chargement des idees produit..." />;
  }

  if (ideasQuery.isError) {
    return (
      <ErrorState
        error={ideasQuery.error}
        onRetry={() => {
          void ideasQuery.refetch();
        }}
        title="Impossible de charger la boite a idees"
      />
    );
  }

  const ideas = ideasQuery.data ?? [];

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

      <header className="page-header">
        <div>
          <h1>Boite a idees</h1>
          <div className="page-subtitle">
            Une liste simple pour signaler les besoins terrain sans transformer
            Immova en forum.
          </div>
        </div>
      </header>

      <div className="info-note">
        <strong>Note produit</strong>
        <div className="meta">
          Les votes nous aident a prioriser, chaque idee est evaluee selon sa
          coherence produit.
        </div>
      </div>

      {betaEnabled ? (
        <div className="info-note info-note--beta">
          <strong>Acces beta actif</strong>
          <div className="meta">
            Vous testez des fonctionnalites en cours de validation.
          </div>
        </div>
      ) : null}

      {betaEnabled && (betaIdeasQuery.data?.length ?? 0) > 0 ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Validation beta en cours</h2>
              <div className="section-subtitle">
                Ces sujets sont actuellement testes avec les clients pilotes.
              </div>
            </div>
          </div>

          <div className="idea-list">
            {(betaIdeasQuery.data ?? []).map((idea) => (
              <article className="card idea-card" key={`beta-${idea.id}`}>
                <div className="idea-card__header">
                  <div className="stack stack--sm">
                    <h3 style={{ margin: 0 }}>{idea.title}</h3>
                    <div>{getShortDescription(idea.description)}</div>
                  </div>
                  <div className="idea-card__badges">
                    <AdminBadge tone="info">Beta</AdminBadge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid--2">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Proposer une idee</h2>
              <div className="section-subtitle">
                Restez concret : besoin, contexte, resultat attendu.
              </div>
            </div>
          </div>

          <form
            className="stack"
            onSubmit={handleSubmit((values) => {
              void createMutation.mutateAsync(values);
            })}
          >
            <div className="field">
              <label htmlFor="idea-title">Titre</label>
              <input id="idea-title" {...register('title')} />
              {errors.title ? (
                <div className="field__error">{errors.title.message}</div>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="idea-description">Description</label>
              <textarea id="idea-description" {...register('description')} />
              {errors.description ? (
                <div className="field__error">{errors.description.message}</div>
              ) : null}
            </div>

            <button className="button" disabled={createMutation.isPending} type="submit">
              {createMutation.isPending ? 'Publication...' : "Publier l'idee"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Filtrer la liste</h2>
              <div className="section-subtitle">
                Les votes signalent, ils ne decident pas a la place de l'equipe.
              </div>
            </div>
          </div>

          <div className="idea-toolbar">
            <div className="field">
              <label htmlFor="ideas-sort">Tri</label>
              <select
                id="ideas-sort"
                onChange={(event) =>
                  setSort(event.target.value as 'top' | 'recent')
                }
                value={sort}
              >
                <option value="top">Plus votees</option>
                <option value="recent">Plus recentes</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="ideas-status">Statut</label>
              <select
                id="ideas-status"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="ALL">Tous</option>
                <option value="OPEN">Ouvertes</option>
                <option value="PLANNED">Planifiees</option>
                <option value="IN_PROGRESS">En test beta</option>
                <option value="DONE">Livrees</option>
                <option value="REJECTED">Non retenues</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Idees de l&apos;organisation</h2>
            <div className="section-subtitle">
              {ideas.length} idee(s) visibles pour votre organisation courante.
            </div>
          </div>
        </div>

        {ideas.length === 0 ? (
          <EmptyState
            description="Ajoutez la premiere idee utile a votre organisation pour demarrer la boucle de feedback."
            title="Aucune idee pour le moment"
            withPanel={false}
          />
        ) : (
          <div className="idea-list">
            {ideas.map((idea) => (
              <article className="card idea-card" key={idea.id}>
                <div className="idea-card__header">
                  <div className="stack stack--sm">
                    <h3 style={{ margin: 0 }}>{idea.title}</h3>
                    <div>{getShortDescription(idea.description)}</div>
                    <div className="idea-card__meta">
                      <span>{idea.votesCount} vote(s)</span>
                      <span>{idea.author.name}</span>
                      <span>{formatDate(idea.createdAt)}</span>
                    </div>
                  </div>

                  <div className="idea-card__badges">
                    <AdminBadge tone={getFeatureRequestStatusTone(idea.status)}>
                      {getFeatureRequestStatusLabel(idea.status)}
                    </AdminBadge>
                    {idea.isBeta ? <AdminBadge tone="info">Beta</AdminBadge> : null}
                  </div>
                </div>

                <div className="row-actions">
                  <button
                    className={idea.hasVoted ? 'button button--secondary' : 'button'}
                    disabled={voteMutation.isPending}
                    onClick={() =>
                      void voteMutation.mutateAsync({
                        featureRequestId: idea.id,
                        hasVoted: idea.hasVoted,
                      })
                    }
                    type="button"
                  >
                    {idea.hasVoted ? 'Retirer mon vote' : 'Voter'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
