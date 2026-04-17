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
              <div className={styles.eyebrow}>Page utilitaire</div>
              <h1 className={styles.heroTitle}>Formulaire de demande d’accès client pilote</h1>
              <p className={styles.heroLead}>
                Cette page reprend le formulaire du programme client pilote en
                version directe. Elle reste volontairement non indexée pour
                éviter les doublons avec la page publique principale.
              </p>
              <ul className={styles.highlightList}>
                <li>Le programme reste sélectif</li>
                <li>Le tarif pilote est de 15 € / mois pour les profils retenus</li>
                <li>Aucune inscription automatique n’est déclenchée ici</li>
              </ul>
            </div>
            <aside className={styles.heroPanel}>
              <p className={styles.kicker}>Conseil</p>
              <h2 className={styles.panelTitle}>La page de référence reste /client-pilote.</h2>
              <p className={styles.panelBody}>
                Utilisez cette page comme accès direct au formulaire si besoin,
                mais gardez /client-pilote comme page publique principale.
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
                On cherche surtout à comprendre si Axelys peut vous aider dès
                maintenant sur des opérations réelles.
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
