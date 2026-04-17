import Link from 'next/link';
import {
  getLegalDocumentDefinition,
  listLegalDocumentDefinitions,
  type LegalDocumentType,
} from '../../../../packages/legal/src';
import styles from './legal-links.module.css';

type LegalLinksProps = {
  documents?: LegalDocumentType[];
  className?: string;
};

export function LegalLinks({
  documents,
  className,
}: LegalLinksProps) {
  const resolvedDocuments = documents
    ? documents.map((type) => getLegalDocumentDefinition(type))
    : listLegalDocumentDefinitions();

  return (
    <ul className={className ? `${styles.list} ${className}` : styles.list}>
      {resolvedDocuments.map((document) => (
        <li key={document.type}>
          <Link className={styles.link} href={`/${document.slug}`}>
            {document.shortTitle}
          </Link>
        </li>
      ))}
    </ul>
  );
}
