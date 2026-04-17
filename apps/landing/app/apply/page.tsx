import { PilotApplicationForm } from '../components/pilot-application-form';
import { SiteShell } from '../components/site-shell';
import styles from '../components/marketing-ui.module.css';

export default function ApplyPage() {
  return (
    <SiteShell
      currentPath="/client-pilote"
      ctaHref="#apply-form"
      ctaTarget="#apply-form"
      ctaTrackingLabel="jump_to_apply_form"
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>Demande directe</div>
              <h1 className={styles.heroTitle}>Déposer une demande d’accès au programme client pilote</h1>
              <p className={styles.heroLead}>
                Cette page vous permet d’aller directement au formulaire si vous avez déjà
                le bon contexte en tête et souhaitez tester Axelys sur des opérations
                réelles.
              </p>
              <ul className={styles.highlightList}>
                <li>Accès sur sélection</li>
                <li>Tarif pilote à 15 € / mois</li>
                <li>Réponse humaine après étude du contexte</li>
              </ul>
            </div>
            <aside className={styles.heroPanel}>
              <p className={styles.kicker}>Accès pilote</p>
              <h2 className={styles.panelTitle}>Axelys s’ouvre d’abord sur des cas réels.</h2>
              <p className={styles.panelBody}>
                Si vous voulez décider avant achat et piloter après acquisition dans le
                même cadre, vous pouvez déposer votre demande ici.
              </p>
            </aside>
          </div>
        </section>

        <section className={styles.section} id="apply-form">
          <div className={styles.formGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>Demande d’accès</div>
              <h2 className={styles.sectionTitle}>Présentez votre contexte</h2>
              <p className={styles.sectionLead}>
                On cherche surtout à comprendre si Axelys peut vous aider dès maintenant
                sur des opérations concrètes.
              </p>
            </div>
            <PilotApplicationForm
              submitLabel="Envoyer ma demande"
              successTitle="Demande reçue"
              successDescription="Si votre contexte correspond au programme client pilote, nous reviendrons vers vous pour la suite."
              successNote="Le tri reste volontairement sélectif. On préfère être clairs plutôt que promettre un accès à tout le monde."
              returnHref="/client-pilote"
            />
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
