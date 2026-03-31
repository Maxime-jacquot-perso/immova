type LoadingBlockProps = {
  label?: string;
  hint?: string;
};

export function LoadingBlock({
  label = 'Chargement en cours...',
  hint = 'On prepare les donnees utiles a cet ecran.',
}: LoadingBlockProps) {
  return (
    <div className="panel loading-block">
      <div className="loading-block__label">{label}</div>
      <div className="meta">{hint}</div>
    </div>
  );
}
