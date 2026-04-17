import Image from 'next/image';
import Link from 'next/link';
import {
  getLegalDocumentDefinition,
  listLegalDocumentDefinitions,
  type LegalDocumentType,
} from '../../../../packages/legal/src';
import { LegalFooter } from '../components/legal-footer';
import { siteName } from '../site-config';
import { getLegalPageContent } from './legal-content';
import styles from './legal-page.module.css';

function formatFrenchDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}

export function LegalDocumentPage({
  documentType,
}: {
  documentType: LegalDocumentType;
}) {
  const document = getLegalDocumentDefinition(documentType);
  const content = getLegalPageContent(documentType);

  return (
    <div className={styles.shell}>
      <div className={styles.glowLeft} />
      <div className={styles.glowRight} />

      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <Image
            src="/logo-text-bleu.svg"
            alt={siteName}
            width={220}
            height={44}
            priority
          />
        </Link>

        <nav aria-label="Documents juridiques" className={styles.nav}>
          {listLegalDocumentDefinitions().map((item) => (
            <Link
              className={styles.navLink}
              href={`/${item.slug}`}
              key={item.type}
            >
              {item.shortTitle}
            </Link>
          ))}
        </nav>
      </header>

      <main className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.eyebrow}>{content.eyebrow}</div>
          <h1>{document.title}</h1>
          <p className={styles.intro}>{content.intro}</p>

          <div className={styles.metaStrip}>
            <span className={styles.metaPill}>Version {document.version}</span>
            <span className={styles.metaPill}>
              Mise à jour le {formatFrenchDate(document.updatedAt)}
            </span>
          </div>
        </section>

        {content.sections.map((section) => (
          <section className={styles.section} key={section.title}>
            <h2>{section.title}</h2>
            <div className={styles.paragraphs}>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>
                  {paragraph.includes('[À compléter') ? (
                    <>
                      {paragraph.split(/\[À compléter[^\]]*\]/).map((part, index, array) => (
                        <span key={`${section.title}-${index}`}>
                          {part}
                          {index < array.length - 1 ? (
                            <span className={styles.placeholder}>
                              {paragraph.match(/\[À compléter[^\]]*\]/g)?.[index]}
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </>
                  ) : (
                    paragraph
                  )}
                </p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>
                      {bullet.includes('[À compléter') ? (
                        <>
                          {bullet.split(/\[À compléter[^\]]*\]/).map((part, index, array) => (
                            <span key={`${section.title}-bullet-${index}`}>
                              {part}
                              {index < array.length - 1 ? (
                                <span className={styles.placeholder}>
                                  {bullet.match(/\[À compléter[^\]]*\]/g)?.[index]}
                                </span>
                              ) : null}
                            </span>
                          ))}
                        </>
                      ) : (
                        bullet
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}

        <footer className={styles.footer}>
          <p className={styles.version}>
            Version {document.version} publiée le{' '}
            {formatFrenchDate(document.updatedAt)}.
          </p>
          <LegalFooter ctaLocation="footer" />
        </footer>
      </main>
    </div>
  );
}
