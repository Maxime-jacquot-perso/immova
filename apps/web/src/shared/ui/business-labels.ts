const projectStatusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  ACQUISITION: 'Acquisition',
  WORKS: 'Travaux',
  READY: 'Pret a louer / vendre',
  ACTIVE: 'En exploitation',
  SOLD: 'Vendu',
  ARCHIVED: 'Archive',
};

const projectTypeLabels: Record<string, string> = {
  APARTMENT_BUILDING: 'Immeuble',
  HOUSE: 'Maison',
  MIXED: 'Mixte',
  COMMERCIAL: 'Commercial',
  OTHER: 'Autre',
};

const lotTypeLabels: Record<string, string> = {
  APARTMENT: 'Appartement',
  HOUSE: 'Maison',
  GARAGE: 'Garage',
  CELLAR: 'Cave',
  OFFICE: 'Bureau',
  SHOP: 'Local commercial',
  OTHER: 'Autre',
};

const lotStatusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  AVAILABLE: 'Disponible',
  RENTED: 'Loue',
  SOLD: 'Vendu',
  ARCHIVED: 'Archive',
};

const expenseCategoryLabels: Record<string, string> = {
  ACQUISITION: 'Acquisition',
  WORKS: 'Travaux',
  TAX: 'Taxe',
  INSURANCE: 'Assurance',
  UTILITIES: 'Charges',
  MANAGEMENT: 'Gestion',
  LEGAL: 'Juridique',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Autre',
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'En attente',
  PAID: 'Payee',
  CANCELLED: 'Annulee',
};

const documentTypeLabels: Record<string, string> = {
  INVOICE: 'Facture',
  QUOTE: 'Devis',
  CONTRACT: 'Contrat',
  DIAGNOSTIC: 'Diagnostic',
  PHOTO: 'Photo',
  PLAN: 'Plan',
  INSURANCE: 'Assurance',
  OTHER: 'Autre',
};

const adminRoleLabels: Record<string, string> = {
  USER: 'Utilisateur',
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  SALES_ADMIN: 'Admin sales',
  SUPPORT_ADMIN: 'Admin support',
  READONLY_ADMIN: 'Admin lecture',
};

const subscriptionPlanLabels: Record<string, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  BUSINESS: 'Business',
};

const subscriptionStatusLabels: Record<string, string> = {
  NONE: 'Aucun',
  TRIAL: 'Essai',
  ACTIVE: 'Actif',
  PAST_DUE: 'Impayé',
  CANCELED: 'Annule',
};

const accessStatusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

const invitationStatusLabels: Record<string, string> = {
  PENDING: 'Invitation envoyee',
  ACCEPTED: 'Invitation acceptee',
  EXPIRED: 'Invitation expiree',
  REVOKED: 'Invitation revoquee',
};

const featureRequestStatusLabels: Record<string, string> = {
  OPEN: 'Ouverte',
  PLANNED: 'Planifiee',
  IN_PROGRESS: 'En test beta',
  DONE: 'Livree',
  REJECTED: 'Non retenue',
};

const adminAuditActionLabels: Record<string, string> = {
  TRIAL_GRANTED: 'Essai accorde',
  TRIAL_EXTENDED: 'Essai prolonge',
  USER_SUSPENDED: 'Compte suspendu',
  USER_REACTIVATED: 'Compte reactive',
  SUBSCRIPTION_UPDATED: 'Abonnement modifie',
  ADMIN_CREATED: 'Admin cree',
  ADMIN_ROLE_CHANGED: 'Role admin modifie',
  USER_INVITED: 'Utilisateur invite',
  USER_INVITE_RESENT: 'Invitation renvoyee',
  USER_PILOT_ACCESS_UPDATED: 'Acces pilote modifie',
  FEATURE_REQUEST_STATUS_UPDATED: 'Statut idee modifie',
};

const dashboardAlertLabels: Record<string, string> = {
  PROJECT_WITHOUT_LOTS: 'Aucun lot',
  PROJECT_WITHOUT_EXPENSES: 'Aucune depense',
  LOT_MISSING_ESTIMATED_RENT: 'Loyer estime manquant',
  WORKS_BUDGET_EXCEEDED: 'Budget travaux depasse',
  GROSS_YIELD_NOT_COMPUTABLE: 'Rendement non calculable',
  PROJECT_COMPLETENESS_LOW: 'Projet incomplet',
  PROJECT_COMPLETENESS_MEDIUM: 'Projet partiellement renseigne',
};

const dashboardActivityTypeLabels: Record<string, string> = {
  project: 'Projet',
  expense: 'Depense',
  document: 'Document',
};

const alertSeverityLabels: Record<string, string> = {
  critical: 'Critique',
  warning: 'A surveiller',
  info: 'Info',
};

const decisionStatusLabels: Record<string, string> = {
  ok: 'OK',
  warning: 'A surveiller',
  critical: 'Problematique',
};

const alertSeverityTones: Record<string, string> = {
  critical: 'critical',
  warning: 'warning',
  info: 'info',
};

const decisionStatusTones: Record<string, string> = {
  ok: 'ok',
  warning: 'warning',
  critical: 'critical',
};

const adminAuditActionTones: Record<string, string> = {
  TRIAL_GRANTED: 'info',
  TRIAL_EXTENDED: 'warning',
  USER_SUSPENDED: 'danger',
  USER_REACTIVATED: 'good',
  SUBSCRIPTION_UPDATED: 'info',
  ADMIN_CREATED: 'good',
  ADMIN_ROLE_CHANGED: 'warning',
  USER_PILOT_ACCESS_UPDATED: 'info',
  FEATURE_REQUEST_STATUS_UPDATED: 'warning',
};

const subscriptionStatusTones: Record<string, string> = {
  NONE: 'neutral',
  TRIAL: 'info',
  ACTIVE: 'good',
  PAST_DUE: 'warning',
  CANCELED: 'danger',
};

const accessStatusTones: Record<string, string> = {
  ACTIVE: 'good',
  SUSPENDED: 'danger',
};

const invitationStatusTones: Record<string, string> = {
  PENDING: 'info',
  ACCEPTED: 'good',
  EXPIRED: 'warning',
  REVOKED: 'neutral',
};

const featureRequestStatusTones: Record<string, string> = {
  OPEN: 'neutral',
  PLANNED: 'warning',
  IN_PROGRESS: 'info',
  DONE: 'good',
  REJECTED: 'danger',
};

function getLabel(labels: Record<string, string>, value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return labels[value] ?? value;
}

export function getProjectStatusLabel(value: string | null | undefined) {
  return getLabel(projectStatusLabels, value);
}

export function getProjectTypeLabel(value: string | null | undefined) {
  return getLabel(projectTypeLabels, value);
}

export function getLotTypeLabel(value: string | null | undefined) {
  return getLabel(lotTypeLabels, value);
}

export function getLotStatusLabel(value: string | null | undefined) {
  return getLabel(lotStatusLabels, value);
}

export function getExpenseCategoryLabel(value: string | null | undefined) {
  return getLabel(expenseCategoryLabels, value);
}

export function getPaymentStatusLabel(value: string | null | undefined) {
  return getLabel(paymentStatusLabels, value);
}

export function getDocumentTypeLabel(value: string | null | undefined) {
  return getLabel(documentTypeLabels, value);
}

export function getAdminRoleLabel(value: string | null | undefined) {
  return getLabel(adminRoleLabels, value);
}

export function getSubscriptionPlanLabel(value: string | null | undefined) {
  return getLabel(subscriptionPlanLabels, value);
}

export function getSubscriptionStatusLabel(value: string | null | undefined) {
  return getLabel(subscriptionStatusLabels, value);
}

export function getAccessStatusLabel(value: string | null | undefined) {
  return getLabel(accessStatusLabels, value);
}

export function getInvitationStatusLabel(value: string | null | undefined) {
  return getLabel(invitationStatusLabels, value);
}

export function getFeatureRequestStatusLabel(
  value: string | null | undefined,
) {
  return getLabel(featureRequestStatusLabels, value);
}

export function getAdminAuditActionLabel(value: string | null | undefined) {
  return getLabel(adminAuditActionLabels, value);
}

export function getDashboardAlertLabel(value: string | null | undefined) {
  return getLabel(dashboardAlertLabels, value);
}

export function getDashboardActivityTypeLabel(value: string | null | undefined) {
  return getLabel(dashboardActivityTypeLabels, value);
}

export function getAlertSeverityLabel(value: string | null | undefined) {
  return getLabel(alertSeverityLabels, value);
}

export function getDecisionStatusLabel(value: string | null | undefined) {
  return getLabel(decisionStatusLabels, value);
}

export function getAlertSeverityTone(value: string | null | undefined) {
  return alertSeverityTones[value ?? ''] ?? 'neutral';
}

export function getDecisionStatusTone(value: string | null | undefined) {
  return decisionStatusTones[value ?? ''] ?? 'neutral';
}

export function getAdminAuditActionTone(value: string | null | undefined) {
  return adminAuditActionTones[value ?? ''] ?? 'neutral';
}

export function getSubscriptionStatusTone(value: string | null | undefined) {
  return subscriptionStatusTones[value ?? ''] ?? 'neutral';
}

export function getAccessStatusTone(value: string | null | undefined) {
  return accessStatusTones[value ?? ''] ?? 'neutral';
}

export function getInvitationStatusTone(value: string | null | undefined) {
  return invitationStatusTones[value ?? ''] ?? 'neutral';
}

export function getFeatureRequestStatusTone(value: string | null | undefined) {
  return featureRequestStatusTones[value ?? ''] ?? 'neutral';
}

const pilotApplicationStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAYMENT_PENDING: 'Payment pending',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

const pilotProvisioningStatusLabels: Record<string, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Provisionne',
  FAILED: 'En erreur',
};

const pilotApplicationEventLabels: Record<string, string> = {
  SUBMITTED: 'Candidature recue',
  APPROVED: 'Approuvee',
  REJECTED: 'Rejetee',
  CHECKOUT_LINK_SENT: 'Lien envoye',
  CHECKOUT_STARTED: 'Checkout demarre',
  CHECKOUT_COMPLETED: 'Checkout complete',
  PAYMENT_CONFIRMED: 'Paiement confirme',
  PROVISIONING_COMPLETED: 'Provisioning termine',
  PROVISIONING_FAILED: 'Provisioning echoue',
  CANCELLED: 'Abonnement annule',
  EXPIRED: 'Lien expire',
};

const pilotApplicationStatusTones: Record<string, string> = {
  PENDING: 'neutral',
  APPROVED: 'info',
  REJECTED: 'danger',
  PAYMENT_PENDING: 'warning',
  ACTIVE: 'good',
  EXPIRED: 'warning',
  CANCELLED: 'danger',
};

const pilotProvisioningStatusTones: Record<string, string> = {
  PENDING: 'neutral',
  IN_PROGRESS: 'info',
  COMPLETED: 'good',
  FAILED: 'danger',
};

export function getPilotApplicationStatusLabel(
  value: string | null | undefined,
) {
  return getLabel(pilotApplicationStatusLabels, value);
}

export function getPilotProvisioningStatusLabel(
  value: string | null | undefined,
) {
  return getLabel(pilotProvisioningStatusLabels, value);
}

export function getPilotApplicationEventLabel(
  value: string | null | undefined,
) {
  return getLabel(pilotApplicationEventLabels, value);
}

export function getPilotApplicationStatusTone(
  value: string | null | undefined,
) {
  return pilotApplicationStatusTones[value ?? ''] ?? 'neutral';
}

export function getPilotProvisioningStatusTone(
  value: string | null | undefined,
) {
  return pilotProvisioningStatusTones[value ?? ''] ?? 'neutral';
}
