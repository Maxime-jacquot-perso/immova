import {
  getLegalDocumentDefinition,
  getLegalDocumentUrl,
  type LegalDocumentType,
} from '../../../../../packages/legal/src';

const publicSiteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://axelys.app').replace(
  /\/$/,
  '',
);

function getLegalLinkHref(type: LegalDocumentType) {
  return getLegalDocumentUrl(publicSiteUrl, type);
}

export function LegalLinksInline({
  documents,
  className,
  linkClassName,
}: {
  documents: readonly LegalDocumentType[];
  className?: string;
  linkClassName?: string;
}) {
  return (
    <span className={className}>
      {documents.map((documentType, index) => {
        const document = getLegalDocumentDefinition(documentType);

        return (
          <span key={documentType}>
            {index > 0 ? ' · ' : null}
            <a
              className={linkClassName}
              href={getLegalLinkHref(documentType)}
              rel="noreferrer"
              target="_blank"
            >
              {document.shortTitle}
            </a>
          </span>
        );
      })}
    </span>
  );
}
