"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutAcceptanceDocumentTypes = exports.legalDocumentDefinitions = exports.LEGAL_DOCUMENT_UPDATED_AT = exports.LEGAL_DOCUMENT_VERSION = void 0;
exports.getLegalDocumentDefinition = getLegalDocumentDefinition;
exports.listLegalDocumentDefinitions = listLegalDocumentDefinitions;
exports.normalizeBaseUrl = normalizeBaseUrl;
exports.getLegalDocumentUrl = getLegalDocumentUrl;
exports.getAccountAcceptanceDocumentTypes = getAccountAcceptanceDocumentTypes;
exports.getRequiredDocumentTypesForScope = getRequiredDocumentTypesForScope;
exports.LEGAL_DOCUMENT_VERSION = 'v2026.04.17';
exports.LEGAL_DOCUMENT_UPDATED_AT = '2026-04-17';
exports.legalDocumentDefinitions = [
    {
        type: 'MENTIONS_LEGALES',
        slug: 'mentions-legales',
        title: 'Mentions légales',
        shortTitle: 'Mentions légales',
        version: exports.LEGAL_DOCUMENT_VERSION,
        updatedAt: exports.LEGAL_DOCUMENT_UPDATED_AT,
        acceptanceRequired: false,
    },
    {
        type: 'CGU',
        slug: 'cgu',
        title: 'Conditions Générales d’Utilisation',
        shortTitle: 'CGU',
        version: exports.LEGAL_DOCUMENT_VERSION,
        updatedAt: exports.LEGAL_DOCUMENT_UPDATED_AT,
        acceptanceRequired: true,
    },
    {
        type: 'CGV',
        slug: 'cgv',
        title: 'Conditions Générales de Vente',
        shortTitle: 'CGV',
        version: exports.LEGAL_DOCUMENT_VERSION,
        updatedAt: exports.LEGAL_DOCUMENT_UPDATED_AT,
        acceptanceRequired: true,
    },
    {
        type: 'PRIVACY_POLICY',
        slug: 'politique-de-confidentialite',
        title: 'Politique de confidentialité',
        shortTitle: 'Politique de confidentialité',
        version: exports.LEGAL_DOCUMENT_VERSION,
        updatedAt: exports.LEGAL_DOCUMENT_UPDATED_AT,
        acceptanceRequired: true,
    },
];
function getLegalDocumentDefinition(type) {
    return exports.legalDocumentDefinitions.find((document) => document.type === type);
}
function listLegalDocumentDefinitions() {
    return [...exports.legalDocumentDefinitions];
}
function normalizeBaseUrl(url) {
    return url.replace(/\/$/, '');
}
function getLegalDocumentUrl(baseUrl, type) {
    const document = getLegalDocumentDefinition(type);
    return `${normalizeBaseUrl(baseUrl)}/${document.slug}`;
}
function getAccountAcceptanceDocumentTypes(hasOrganizationContext) {
    return hasOrganizationContext
        ? ['CGU', 'CGV', 'PRIVACY_POLICY']
        : ['CGU', 'PRIVACY_POLICY'];
}
exports.checkoutAcceptanceDocumentTypes = [
    'CGV',
    'PRIVACY_POLICY',
];
function getRequiredDocumentTypesForScope(scope, options) {
    if (scope === 'CHECKOUT') {
        return exports.checkoutAcceptanceDocumentTypes;
    }
    return getAccountAcceptanceDocumentTypes(options?.hasOrganizationContext ?? true);
}
//# sourceMappingURL=index.js.map