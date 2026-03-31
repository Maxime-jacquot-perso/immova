import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { exportExpenses, listExpenses } from '../api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { EmptyState } from '../../../shared/ui/empty-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { getErrorMessage } from '../../../shared/ui/error-utils';

export function ProjectExportPage() {
  const { projectId = '' } = useParams();
  const { session } = useAuth();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const expensesQuery = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: () => listExpenses(session, projectId),
  });

  if (expensesQuery.isLoading) {
    return <LoadingBlock label="Preparation de l'export..." />;
  }

  if (expensesQuery.isError) {
    return (
      <ErrorState
        error={expensesQuery.error}
        onRetry={() => {
          void expensesQuery.refetch();
        }}
        title="Impossible de preparer l'export comptable"
      />
    );
  }

  const expensesCount = (expensesQuery.data ?? []).length;

  return (
    <section className="panel stack">
      {feedback ? (
        <FeedbackMessage
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          title={feedback.title}
          type={feedback.type}
        />
      ) : null}

      <div>
        <h2 style={{ marginTop: 0 }}>Export comptable</h2>
        <div className="page-subtitle">
          La V1 fournit un CSV simple et fiable des depenses du projet.
        </div>
      </div>

      {expensesCount === 0 ? (
        <EmptyState
          description="Saisissez au moins une depense pour generer un export comptable utile."
          title="Aucune depense a exporter"
          withPanel={false}
        />
      ) : (
        <div className="meta">
          {expensesCount} depense{expensesCount > 1 ? 's' : ''} seront exportee
          {expensesCount > 1 ? 's' : ''} dans le fichier CSV.
        </div>
      )}

      <button
        className="button"
        disabled={expensesCount === 0 || isExporting}
        onClick={async () => {
          try {
            setIsExporting(true);
            setFeedback(null);
            await exportExpenses(session, projectId);
            setFeedback({
              type: 'success',
              title: 'Export CSV lance',
              message: 'Le fichier des depenses a ete telecharge.',
            });
          } catch (error) {
            setFeedback({
              type: 'error',
              title: "Echec de l'export",
              message: getErrorMessage(error),
            });
          } finally {
            setIsExporting(false);
          }
        }}
        type="button"
      >
        {isExporting ? 'Export en cours...' : 'Exporter les depenses en CSV'}
      </button>
    </section>
  );
}
