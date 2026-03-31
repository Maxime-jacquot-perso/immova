type BetaCapableUser = {
  isPilotUser?: boolean | null;
  betaAccessEnabled?: boolean | null;
};

export function canAccessBetaFeatures(
  user: BetaCapableUser | null | undefined,
) {
  return Boolean(user?.isPilotUser && user?.betaAccessEnabled);
}
