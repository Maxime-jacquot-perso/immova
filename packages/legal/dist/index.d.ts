export declare const LEGAL_DOCUMENT_VERSION = "v2026.04.17";
export declare const LEGAL_DOCUMENT_UPDATED_AT = "2026-04-17";
export type LegalDocumentType = 'MENTIONS_LEGALES' | 'CGU' | 'CGV' | 'PRIVACY_POLICY';
export type LegalAcceptanceScope = 'ACCOUNT' | 'CHECKOUT';
export type LegalDocumentDefinition = {
    type: LegalDocumentType;
    slug: 'mentions-legales' | 'cgu' | 'cgv' | 'politique-de-confidentialite';
    title: string;
    shortTitle: string;
    version: string;
    updatedAt: string;
    acceptanceRequired: boolean;
};
export declare const legalDocumentDefinitions: readonly [{
    readonly type: "MENTIONS_LEGALES";
    readonly slug: "mentions-legales";
    readonly title: "Mentions légales";
    readonly shortTitle: "Mentions légales";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: false;
}, {
    readonly type: "CGU";
    readonly slug: "cgu";
    readonly title: "Conditions Générales d’Utilisation";
    readonly shortTitle: "CGU";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
}, {
    readonly type: "CGV";
    readonly slug: "cgv";
    readonly title: "Conditions Générales de Vente";
    readonly shortTitle: "CGV";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
}, {
    readonly type: "PRIVACY_POLICY";
    readonly slug: "politique-de-confidentialite";
    readonly title: "Politique de confidentialité";
    readonly shortTitle: "Politique de confidentialité";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
}];
export declare function getLegalDocumentDefinition(type: LegalDocumentType): {
    readonly type: "MENTIONS_LEGALES";
    readonly slug: "mentions-legales";
    readonly title: "Mentions légales";
    readonly shortTitle: "Mentions légales";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: false;
} | {
    readonly type: "CGU";
    readonly slug: "cgu";
    readonly title: "Conditions Générales d’Utilisation";
    readonly shortTitle: "CGU";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
} | {
    readonly type: "CGV";
    readonly slug: "cgv";
    readonly title: "Conditions Générales de Vente";
    readonly shortTitle: "CGV";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
} | {
    readonly type: "PRIVACY_POLICY";
    readonly slug: "politique-de-confidentialite";
    readonly title: "Politique de confidentialité";
    readonly shortTitle: "Politique de confidentialité";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
};
export declare function listLegalDocumentDefinitions(): ({
    readonly type: "MENTIONS_LEGALES";
    readonly slug: "mentions-legales";
    readonly title: "Mentions légales";
    readonly shortTitle: "Mentions légales";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: false;
} | {
    readonly type: "CGU";
    readonly slug: "cgu";
    readonly title: "Conditions Générales d’Utilisation";
    readonly shortTitle: "CGU";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
} | {
    readonly type: "CGV";
    readonly slug: "cgv";
    readonly title: "Conditions Générales de Vente";
    readonly shortTitle: "CGV";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
} | {
    readonly type: "PRIVACY_POLICY";
    readonly slug: "politique-de-confidentialite";
    readonly title: "Politique de confidentialité";
    readonly shortTitle: "Politique de confidentialité";
    readonly version: "v2026.04.17";
    readonly updatedAt: "2026-04-17";
    readonly acceptanceRequired: true;
})[];
export declare function normalizeBaseUrl(url: string): string;
export declare function getLegalDocumentUrl(baseUrl: string, type: LegalDocumentType): string;
export declare function getAccountAcceptanceDocumentTypes(hasOrganizationContext: boolean): readonly ["CGU", "CGV", "PRIVACY_POLICY"] | readonly ["CGU", "PRIVACY_POLICY"];
export declare const checkoutAcceptanceDocumentTypes: readonly ["CGV", "PRIVACY_POLICY"];
export declare function getRequiredDocumentTypesForScope(scope: LegalAcceptanceScope, options?: {
    hasOrganizationContext?: boolean;
}): readonly ["CGU", "CGV", "PRIVACY_POLICY"] | readonly ["CGU", "PRIVACY_POLICY"] | readonly ["CGV", "PRIVACY_POLICY"];
