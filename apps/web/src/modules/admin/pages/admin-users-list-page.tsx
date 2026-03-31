import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../auth/auth-context";
import {
  inviteAdminUser,
  listAdminOrganizationOptions,
  listAdminUsers,
} from "../api";
import { AdminBadge } from "../components/admin-badge";
import { AdminFiltersToolbar } from "../components/admin-filters-toolbar";
import { AdminPagination } from "../components/admin-pagination";
import { ADMIN_PERMISSIONS, hasAdminPermission } from "../permissions";
import { ErrorState } from "../../../shared/ui/error-state";
import { FeedbackMessage } from "../../../shared/ui/feedback-message";
import { LoadingBlock } from "../../../shared/ui/loading-block";
import {
  getAccessStatusLabel,
  getAccessStatusTone,
  getAdminRoleLabel,
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
  getSubscriptionStatusTone,
} from "../../../shared/ui/business-labels";
import {
  formatCount,
  formatDate,
  formatDateTime,
} from "../../../shared/ui/formatters";
import { getErrorMessage } from "../../../shared/ui/error-utils";

const inviteSchema = z
  .object({
    email: z.string().email("Saisissez un email valide."),
    organizationMode: z.enum(["existing", "personal"]),
    organizationId: z.string().optional(),
    membershipRole: z.enum(["ADMIN", "MANAGER", "ACCOUNTANT", "READER"]),
    reason: z
      .string()
      .min(5, "Renseignez un motif explicite.")
      .max(500, "Le motif est trop long."),
  })
  .superRefine((values, context) => {
    if (values.organizationMode === "existing" && !values.organizationId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organizationId"],
        message: "Selectionnez une organisation.",
      });
    }
  });

type InviteFormValues = z.infer<typeof inviteSchema>;

export function AdminUsersListPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const canInviteUsers = hasAdminPermission(
    session,
    ADMIN_PERMISSIONS.usersUpdate,
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [accessStatus, setAccessStatus] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message?: string;
    userId?: string;
  } | null>(null);

  const usersQuery = useQuery({
    queryKey: [
      "admin-users",
      page,
      search,
      adminRole,
      subscriptionStatus,
      subscriptionPlan,
      accessStatus,
    ],
    queryFn: () =>
      listAdminUsers(session, {
        page,
        pageSize: 10,
        search,
        adminRole: adminRole || undefined,
        subscriptionStatus: subscriptionStatus || undefined,
        subscriptionPlan: subscriptionPlan || undefined,
        accessStatus: accessStatus as "ACTIVE" | "SUSPENDED" | undefined,
      }),
  });

  const organizationsQuery = useQuery({
    enabled: canInviteUsers,
    queryKey: ["admin-organization-options"],
    queryFn: () => listAdminOrganizationOptions(session),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      organizationMode: "existing",
      organizationId: "",
      membershipRole: "MANAGER",
      reason: "",
    },
  });
  const organizationOptions = organizationsQuery.data ?? [];
  const organizationMode = useWatch({
    control,
    name: "organizationMode",
  });

  useEffect(() => {
    if (!organizationsQuery.isSuccess) {
      return;
    }

    if (organizationOptions.length === 0 && organizationMode !== "personal") {
      setValue("organizationMode", "personal");
    }
  }, [
    organizationMode,
    organizationOptions.length,
    organizationsQuery.isSuccess,
    setValue,
  ]);

  useEffect(() => {
    if (organizationMode === "personal") {
      setValue("organizationId", "");
    }
  }, [organizationMode, setValue]);

  const inviteMutation = useMutation({
    mutationFn: (payload: InviteFormValues) =>
      inviteAdminUser(session, {
        email: payload.email,
        organizationMode: payload.organizationMode,
        organizationId:
          payload.organizationMode === "existing"
            ? payload.organizationId
            : undefined,
        membershipRole: payload.membershipRole,
        reason: payload.reason,
      }),
    onSuccess: async (response, variables) => {
      reset({
        email: "",
        organizationMode:
          organizationOptions.length === 0
            ? "personal"
            : variables.organizationMode,
        organizationId: "",
        membershipRole: variables.membershipRole,
        reason: "",
      });
      setFeedback({
        type: "success",
        title: "Invitation envoyee",
        message:
          response.deliveryMode === "console"
            ? "Le lien a ete journalise localement pour le dev et l'invitation est prete."
            : "L'utilisateur a recu son lien securise par email.",
        userId: response.userId,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] }),
      ]);
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        title: "Invitation impossible",
        message: getErrorMessage(error),
      });
    },
  });

  function resetFilters() {
    setPage(1);
    setSearch("");
    setAdminRole("");
    setSubscriptionStatus("");
    setSubscriptionPlan("");
    setAccessStatus("");
  }

  if (
    usersQuery.isLoading ||
    (canInviteUsers && organizationsQuery.isLoading)
  ) {
    return <LoadingBlock label="Chargement des utilisateurs..." />;
  }

  if (usersQuery.isError) {
    return (
      <ErrorState
        error={usersQuery.error}
        onRetry={() => {
          void usersQuery.refetch();
        }}
        title="Impossible de charger les utilisateurs admin"
      />
    );
  }

  if (canInviteUsers && organizationsQuery.isError) {
    return (
      <ErrorState
        error={organizationsQuery.error}
        onRetry={() => {
          void organizationsQuery.refetch();
        }}
        title="Impossible de charger les organisations admin"
      />
    );
  }

  const response = usersQuery.data;
  if (!response) {
    return <ErrorState title="Liste utilisateurs indisponible" withPanel />;
  }

  return (
    <div className="stack">
      {feedback ? (
        <FeedbackMessage
          action={
            feedback.userId ? (
              <Link
                className="button button--secondary"
                to={`/admin/users/${feedback.userId}`}
              >
                Ouvrir la fiche
              </Link>
            ) : undefined
          }
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          title={feedback.title}
          type={feedback.type}
        />
      ) : null}

      <header className="page-header">
        <div>
          <h1>Utilisateurs</h1>
          <div className="page-subtitle">
            Recherche, filtres et lecture d&apos;exploitation pour piloter les
            comptes sans intervention BDD.
          </div>
        </div>
      </header>

      <div className="grid grid--2">
        <AdminFiltersToolbar>
          <div className="field">
            <label htmlFor="admin-users-search">Recherche</label>
            <input
              id="admin-users-search"
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Email, nom, organisation"
              value={search}
            />
          </div>
          <div className="field">
            <label htmlFor="admin-users-role">Role admin</label>
            <select
              id="admin-users-role"
              onChange={(event) => {
                setPage(1);
                setAdminRole(event.target.value);
              }}
              value={adminRole}
            >
              <option value="">Tous</option>
              <option value="USER">Utilisateur</option>
              <option value="READONLY_ADMIN">Admin lecture</option>
              <option value="SALES_ADMIN">Admin sales</option>
              <option value="SUPPORT_ADMIN">Admin support</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-users-access">Acces</label>
            <select
              id="admin-users-access"
              onChange={(event) => {
                setPage(1);
                setAccessStatus(event.target.value);
              }}
              value={accessStatus}
            >
              <option value="">Tous</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-users-plan">Plan</label>
            <select
              id="admin-users-plan"
              onChange={(event) => {
                setPage(1);
                setSubscriptionPlan(event.target.value);
              }}
              value={subscriptionPlan}
            >
              <option value="">Tous</option>
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-users-status">Abonnement</label>
            <select
              id="admin-users-status"
              onChange={(event) => {
                setPage(1);
                setSubscriptionStatus(event.target.value);
              }}
              value={subscriptionStatus}
            >
              <option value="">Tous</option>
              <option value="NONE">Aucun</option>
              <option value="TRIAL">Essai</option>
              <option value="ACTIVE">Actif</option>
              <option value="PAST_DUE">Impay&eacute;</option>
              <option value="CANCELED">Annule</option>
            </select>
          </div>
          <div className="row-actions admin-filters__actions">
            <button
              className="button button--secondary"
              onClick={resetFilters}
              type="button"
            >
              Reinitialiser
            </button>
          </div>
        </AdminFiltersToolbar>

        {canInviteUsers ? (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="section-title">Inviter un utilisateur</h2>
                <div className="section-subtitle">
                  Creation admin-driven avec lien securise vers
                  l&apos;application, sans signup public ni passage par la
                  landing.
                </div>
              </div>
            </div>

            <form
              className="stack"
              onSubmit={handleSubmit((values) => {
                void inviteMutation.mutateAsync(values);
              })}
            >
              <div className="field">
                <label htmlFor="invite-user-email">Email</label>
                <input
                  id="invite-user-email"
                  type="email"
                  {...register("email")}
                />
                {errors.email ? (
                  <div className="field__error">{errors.email.message}</div>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="invite-user-target">Cible du compte</label>
                <select
                  id="invite-user-target"
                  {...register("organizationMode")}
                >
                  {organizationOptions.length > 0 ? (
                    <option value="existing">Organisation existante</option>
                  ) : null}
                  <option value="personal">Espace personnel</option>
                </select>
                <div className="meta">
                  {organizationOptions.length === 0
                    ? "Aucune organisation n'existe encore : l'invitation creera automatiquement un espace personnel pour cet utilisateur lors de l'activation."
                    : organizationMode === "personal"
                      ? "Un espace personnel dedie sera cree automatiquement pour cet utilisateur lors de l'activation."
                      : "L'utilisateur sera rattache a l'organisation selectionnee."}
                </div>
              </div>

              {organizationMode === "existing" ? (
                <div className="field">
                  <label htmlFor="invite-user-organization">Organisation</label>
                  <select
                    id="invite-user-organization"
                    {...register("organizationId")}
                  >
                    <option value="">Selectionner une organisation</option>
                    {organizationOptions.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name} · {organization.slug}
                      </option>
                    ))}
                  </select>
                  {errors.organizationId ? (
                    <div className="field__error">
                      {errors.organizationId.message}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="invite-user-role">Role membership</label>
                <select id="invite-user-role" {...register("membershipRole")}>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Gestion</option>
                  <option value="ACCOUNTANT">Comptabilite</option>
                  <option value="READER">Lecture</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="invite-user-reason">Motif</label>
                <textarea
                  id="invite-user-reason"
                  placeholder="Expliquez le contexte de cet acces."
                  {...register("reason")}
                />
                {errors.reason ? (
                  <div className="field__error">{errors.reason.message}</div>
                ) : null}
              </div>

              <button
                className="button"
                disabled={inviteMutation.isPending}
                type="submit"
              >
                {inviteMutation.isPending
                  ? "Invitation en cours..."
                  : "Inviter un utilisateur"}
              </button>
            </form>
          </section>
        ) : null}
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Comptes</h2>
            <div className="section-subtitle">
              {formatCount(response.total)} compte(s) correspondant aux filtres.
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Acces</th>
                <th>Programme</th>
                <th>Role admin</th>
                <th>Abonnement</th>
                <th>Essai</th>
                <th>Organisations</th>
                <th>Derniere connexion</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {response.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="stack stack--sm">
                      <strong>{user.fullName}</strong>
                      <div className="meta">{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <AdminBadge tone={getAccessStatusTone(user.accessStatus)}>
                      {getAccessStatusLabel(user.accessStatus)}
                    </AdminBadge>
                  </td>
                  <td>
                    <div className="inline-actions">
                      {user.isPilotUser ? (
                        <AdminBadge tone="info">Pilote</AdminBadge>
                      ) : (
                        <AdminBadge tone="neutral">Standard</AdminBadge>
                      )}
                      {user.betaAccessEnabled ? (
                        <AdminBadge tone="warning">Acces beta</AdminBadge>
                      ) : null}
                    </div>
                  </td>
                  <td>{getAdminRoleLabel(user.adminRole)}</td>
                  <td>
                    <div className="stack stack--sm">
                      <AdminBadge
                        tone={getSubscriptionStatusTone(
                          user.subscriptionStatus,
                        )}
                      >
                        {getSubscriptionStatusLabel(user.subscriptionStatus)}
                      </AdminBadge>
                      <div className="meta">
                        Plan {getSubscriptionPlanLabel(user.subscriptionPlan)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="stack stack--sm">
                      <strong>{formatDate(user.trialEndsAt)}</strong>
                      <div className="meta">
                        {formatCount(user.trialExtensionsCount)} prolongation(s)
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="stack stack--sm">
                      <strong>{formatCount(user.organizationsCount)}</strong>
                      <div className="meta">
                        {formatCount(user.totalProjectsCount)} projet(s)
                      </div>
                    </div>
                  </td>
                  <td>{formatDateTime(user.lastLoginAt)}</td>
                  <td>
                    <Link
                      className="button button--secondary button--small"
                      to={`/admin/users/${user.id}`}
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={response.page}
          onPageChange={setPage}
          totalPages={response.totalPages}
        />
      </section>
    </div>
  );
}
