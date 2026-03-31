type AdminPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  return (
    <div className="admin-pagination">
      <button
        className="button button--secondary button--small"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        Precedent
      </button>
      <div className="meta">
        Page {page} / {totalPages}
      </div>
      <button
        className="button button--secondary button--small"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Suivant
      </button>
    </div>
  );
}
