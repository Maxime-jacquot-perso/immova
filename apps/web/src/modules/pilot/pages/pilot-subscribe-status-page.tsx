import { Link, useSearchParams } from 'react-router-dom';

type PilotSubscribeStatusPageProps = {
  mode: 'success' | 'cancel';
};

export function PilotSubscribeStatusPage({
  mode,
}: PilotSubscribeStatusPageProps) {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');

  const title =
    mode === 'success'
      ? 'Paiement recu, verification en cours'
      : 'Souscription interrompue';
  const message =
    mode === 'success'
      ? 'Stripe nous a rediriges apres le paiement, mais l activation finale depend uniquement du webhook cote backend. Votre acces sera provisionne automatiquement des confirmation Stripe, puis vous recevrez un email Axelys pour finaliser votre compte.'
      : 'Aucun acces n est cree tant que le paiement n est pas confirme. Vous pouvez relancer le parcours depuis le lien present dans votre email d approbation ou demander un renvoi du lien a l equipe Axelys.';

  return (
    <div className="pilot-public-screen">
      <section className="panel pilot-public-card stack">
        <div className="stack stack--sm">
          <div className="meta">Programme pilote Axelys</div>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <div className="page-subtitle">{message}</div>
        </div>

        {applicationId ? (
          <div className="info-note">
            <strong>Reference candidature</strong>
            <div className="meta" style={{ marginTop: 6 }}>
              {applicationId}
            </div>
          </div>
        ) : null}

        <div className="pilot-public-card__actions">
          <Link className="button button--secondary" to="/login">
            Aller a la connexion
          </Link>
        </div>
      </section>
    </div>
  );
}
