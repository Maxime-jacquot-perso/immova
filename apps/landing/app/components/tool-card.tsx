import Link from 'next/link';
import type { ToolPageListItem } from '../content/tool-pages';
import styles from './marketing-ui.module.css';

type ToolCardProps = {
  tool: ToolPageListItem;
};

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link className={styles.resourceCard} href={tool.href}>
      <p className={styles.resourceMeta}>Calculateur immobilier</p>
      <h3 className={styles.resourceTitle}>{tool.title}</h3>
      <p className={styles.resourceDescription}>{tool.description}</p>
    </Link>
  );
}
