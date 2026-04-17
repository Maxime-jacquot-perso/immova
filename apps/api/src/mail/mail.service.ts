import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type InvitationEmailVariant = 'standard' | 'pilotActivation';

export type SendUserInvitationMailInput = {
  to: string;
  organizationName: string;
  organizationSlug: string;
  membershipRole: string;
  acceptUrl: string;
  expiresAt: Date;
  requiresPasswordSetup: boolean;
  variant?: InvitationEmailVariant;
};

export type SendPasswordResetMailInput = {
  to: string;
  resetUrl: string;
  expiresAt: Date;
};

export type MailDeliveryResult = {
  mode: 'console' | 'smtp' | 'resend';
};

export type SendPilotApplicationNotificationInput = {
  to: string;
  application: {
    id?: string;
    firstname: string;
    lastname?: string | null;
    email: string;
    projectCount: string;
    profileType: string;
    problemDescription: string;
    acknowledgement: boolean;
  };
};

export type SendPilotApplicationApprovedInput = {
  to: string;
  firstName: string;
  organizationName: string;
  checkoutUrl: string;
  expiresAt: Date;
  planLabel: string;
  priceLabel: string;
};

export type SendPilotApplicationRejectedInput = {
  to: string;
  firstName: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resendApiKey = process.env.RESEND_API_KEY?.trim();
  private readonly mailFrom = process.env.MAIL_FROM?.trim();
  private readonly smtpHost = process.env.SMTP_HOST?.trim();
  private readonly smtpPort = process.env.SMTP_PORT?.trim();
  private readonly smtpUser = process.env.SMTP_USER?.trim();
  private readonly smtpPass = process.env.SMTP_PASS?.trim();
  private readonly smtpSecure = process.env.SMTP_SECURE?.trim();
  private readonly hasSmtpIntent =
    Boolean(this.smtpHost) ||
    Boolean(this.smtpPort) ||
    Boolean(this.smtpUser) ||
    Boolean(this.smtpPass) ||
    Boolean(this.smtpSecure);

  private getPublicSiteUrl() {
    return (
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://axelys.app'
    ).replace(/\/$/, '');
  }

  async sendUserInvitation(
    input: SendUserInvitationMailInput,
  ): Promise<MailDeliveryResult> {
    const subject =
      input.variant === 'pilotActivation'
        ? 'Votre acces pilote Axelys est pret'
        : 'Votre acces Axelys';
    const text = this.buildInvitationText(input);
    const html = this.buildInvitationHtml(input);

    return this.deliverMail({
      to: input.to,
      subject,
      text,
      html,
      consoleLines: [
        'Invitation email logged locally.',
        `To: ${input.to}`,
        `Subject: ${subject}`,
        `Organization: ${input.organizationName} (${input.organizationSlug})`,
        `Role: ${input.membershipRole}`,
        `Accept URL: ${input.acceptUrl}`,
        `Expires at: ${input.expiresAt.toISOString()}`,
        `Requires password setup: ${input.requiresPasswordSetup}`,
        `Variant: ${input.variant ?? 'standard'}`,
      ],
    });
  }

  async sendPasswordReset(
    input: SendPasswordResetMailInput,
  ): Promise<MailDeliveryResult> {
    const subject = 'Reinitialisez votre mot de passe Axelys';
    const text = this.buildPasswordResetText(input);
    const html = this.buildPasswordResetHtml(input);

    return this.deliverMail({
      to: input.to,
      subject,
      text,
      html,
      consoleLines: [
        'Password reset email logged locally.',
        `To: ${input.to}`,
        `Subject: ${subject}`,
        `Reset URL: ${input.resetUrl}`,
        `Expires at: ${input.expiresAt.toISOString()}`,
      ],
    });
  }

  async sendPilotApplicationNotification(
    input: SendPilotApplicationNotificationInput,
  ): Promise<MailDeliveryResult> {
    const subject = 'Nouvelle candidature client pilote';
    const text = this.buildPilotApplicationText(input);
    const html = this.buildPilotApplicationHtml(input);

    return this.deliverMail({
      to: input.to,
      subject,
      text,
      html,
      replyTo: input.application.email,
      consoleLines: [
        'Pilot application notification logged locally.',
        `Application ID: ${input.application.id ?? 'n/a'}`,
        `From: ${input.application.firstname} ${input.application.lastname ?? ''} <${input.application.email}>`.trim(),
        `Project count: ${input.application.projectCount}`,
        `Profile: ${input.application.profileType}`,
        `Problem: ${input.application.problemDescription}`,
        `Acknowledgement: ${input.application.acknowledgement}`,
      ],
    });
  }

  async sendPilotApplicationApproved(
    input: SendPilotApplicationApprovedInput,
  ): Promise<MailDeliveryResult> {
    const subject = 'Votre candidature Axelys est approuvee';
    const text = this.buildPilotApplicationApprovedText(input);
    const html = this.buildPilotApplicationApprovedHtml(input);

    return this.deliverMail({
      to: input.to,
      subject,
      text,
      html,
      consoleLines: [
        'Pilot approval email logged locally.',
        `To: ${input.to}`,
        `Checkout URL: ${input.checkoutUrl}`,
        `Expires at: ${input.expiresAt.toISOString()}`,
      ],
    });
  }

  async sendPilotApplicationRejected(
    input: SendPilotApplicationRejectedInput,
  ): Promise<MailDeliveryResult> {
    const subject = 'Retour sur votre candidature Axelys';
    const text = this.buildPilotApplicationRejectedText(input);
    const html = this.buildPilotApplicationRejectedHtml(input);

    return this.deliverMail({
      to: input.to,
      subject,
      text,
      html,
      consoleLines: [
        'Pilot rejection email logged locally.',
        `To: ${input.to}`,
      ],
    });
  }

  private async deliverMail(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
    consoleLines: string[];
  }): Promise<MailDeliveryResult> {
    const smtpConfig = this.getSmtpConfig();

    if (smtpConfig) {
      const transport = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });

      await transport.sendMail({
        from: this.mailFrom,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo,
      });

      return { mode: 'smtp' };
    }

    if (this.resendApiKey && this.mailFrom) {
      const payload: Record<string, unknown> = {
        from: this.mailFrom,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      };

      if (input.replyTo) {
        payload.reply_to = input.replyTo;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Mail delivery failed with status ${response.status}: ${body}`,
        );
      }

      return { mode: 'resend' };
    }

    this.logger.log(input.consoleLines.join('\n'));
    return { mode: 'console' };
  }

  private getSmtpConfig() {
    if (!this.hasSmtpIntent) {
      return null;
    }

    if (
      !this.smtpHost ||
      !this.smtpPort ||
      !this.smtpUser ||
      !this.smtpPass ||
      !this.mailFrom
    ) {
      throw new Error(
        'SMTP config incomplete. Expected SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM.',
      );
    }

    const port = Number(this.smtpPort);

    if (!Number.isInteger(port) || port <= 0) {
      throw new Error('SMTP_PORT must be a valid positive integer.');
    }

    return {
      host: this.smtpHost,
      port,
      user: this.smtpUser,
      pass: this.smtpPass,
      secure: this.parseSmtpSecure(port),
    };
  }

  private parseSmtpSecure(port: number) {
    if (!this.smtpSecure) {
      return port === 465;
    }

    return ['1', 'true', 'yes', 'on'].includes(this.smtpSecure.toLowerCase());
  }

  private buildInvitationText(input: SendUserInvitationMailInput) {
    const expirationLabel = this.formatDate(input.expiresAt);
    const legalLinks = this.getLegalLinks();
    const isPilotActivation = input.variant === 'pilotActivation';
    const intro = isPilotActivation
      ? 'Votre abonnement pilote Axelys est confirme. Votre acces peut maintenant etre finalise.'
      : 'Un administrateur a cree votre acces Axelys.';
    const nextStep = input.requiresPasswordSetup
      ? 'Utilisez ce lien pour definir votre mot de passe et finaliser votre acces.'
      : 'Utilisez ce lien pour confirmer votre acces, puis connectez-vous avec votre mot de passe habituel.';

    return [
      intro,
      '',
      `Organisation : ${input.organizationName}`,
      `Role : ${input.membershipRole}`,
      '',
      nextStep,
      input.acceptUrl,
      '',
      'Documents juridiques applicables :',
      `CGU : ${legalLinks.cgu}`,
      `CGV : ${legalLinks.cgv}`,
      `Politique de confidentialite : ${legalLinks.privacyPolicy}`,
      '',
      `Ce lien expire le ${expirationLabel}.`,
      "Si vous n'etes pas concerne, ignorez simplement cet email.",
    ].join('\n');
  }

  private buildInvitationHtml(input: SendUserInvitationMailInput) {
    const expirationLabel = this.formatDate(input.expiresAt);
    const legalLinks = this.getLegalLinks();
    const isPilotActivation = input.variant === 'pilotActivation';
    const intro = isPilotActivation
      ? 'Votre abonnement pilote Axelys est confirme. Votre acces peut maintenant etre finalise.'
      : 'Un administrateur a cree votre acces Axelys.';
    const nextStep = input.requiresPasswordSetup
      ? 'Utilisez ce lien securise pour definir votre mot de passe et finaliser votre acces.'
      : 'Utilisez ce lien securise pour confirmer votre acces, puis connectez-vous avec votre mot de passe habituel.';

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>${this.escapeHtml(intro)}</p>
        <p>
          <strong>Organisation :</strong> ${this.escapeHtml(input.organizationName)}<br />
          <strong>Role :</strong> ${this.escapeHtml(input.membershipRole)}
        </p>
        <p>${this.escapeHtml(nextStep)}</p>
        <p>
          <a
            href="${this.escapeHtml(input.acceptUrl)}"
            style="display: inline-block; padding: 12px 18px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;"
          >
            Finaliser mon acces
          </a>
        </p>
        <p>
          Ce lien expire le <strong>${this.escapeHtml(expirationLabel)}</strong>.
        </p>
        <p style="color: #4b5563;">
          Documents juridiques :
          <a href="${this.escapeHtml(legalLinks.cgu)}">CGU</a>,
          <a href="${this.escapeHtml(legalLinks.cgv)}">CGV</a>,
          <a href="${this.escapeHtml(legalLinks.privacyPolicy)}">Politique de confidentialite</a>.
        </p>
        <p style="color: #4b5563;">
          Si vous n'etes pas concerne, ignorez simplement cet email.
        </p>
        <p style="color: #4b5563; word-break: break-all;">
          ${this.escapeHtml(input.acceptUrl)}
        </p>
      </div>
    `.trim();
  }

  private buildPasswordResetText(input: SendPasswordResetMailInput) {
    const expirationLabel = this.formatDate(input.expiresAt);

    return [
      'Une demande de réinitialisation de mot de passe Axelys a été reçue.',
      '',
      'Utilisez ce lien sécurisé pour choisir un nouveau mot de passe :',
      input.resetUrl,
      '',
      `Ce lien expire le ${expirationLabel}.`,
      '',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.",
    ].join('\n');
  }

  private buildPasswordResetHtml(input: SendPasswordResetMailInput) {
    const expirationLabel = this.formatDate(input.expiresAt);

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Une demande de réinitialisation de mot de passe Axelys a été reçue.</p>
        <p>Utilisez ce lien sécurisé pour choisir un nouveau mot de passe.</p>
        <p>
          <a
            href="${this.escapeHtml(input.resetUrl)}"
            style="display: inline-block; padding: 12px 18px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;"
          >
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p>
          Ce lien expire le <strong>${this.escapeHtml(expirationLabel)}</strong>.
        </p>
        <p style="color: #4b5563;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
        </p>
        <p style="color: #4b5563; word-break: break-all;">
          ${this.escapeHtml(input.resetUrl)}
        </p>
      </div>
    `.trim();
  }

  private buildPilotApplicationText(
    input: SendPilotApplicationNotificationInput,
  ) {
    const fullName = [input.application.firstname, input.application.lastname]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join(' ')
      .trim();

    return [
      'Nouvelle candidature client pilote',
      '',
      `ID : ${input.application.id ?? 'n/a'}`,
      `Prenom : ${input.application.firstname}`,
      `Nom : ${input.application.lastname ?? '-'}`,
      `Nom complet : ${fullName || '-'}`,
      `Email : ${input.application.email}`,
      `Projets en cours : ${input.application.projectCount}`,
      `Profil : ${input.application.profileType}`,
      '',
      'Probleme rencontre :',
      input.application.problemDescription,
      '',
      `Accepte le traitement de la demande : ${input.application.acknowledgement ? 'Oui' : 'Non'}`,
      '',
      `Repondre directement a : ${input.application.email}`,
    ].join('\n');
  }

  private buildPilotApplicationHtml(
    input: SendPilotApplicationNotificationInput,
  ) {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="color: #1f6feb;">Nouvelle candidature client pilote</h2>
        <p>
          <strong>ID :</strong> ${this.escapeHtml(input.application.id ?? 'n/a')}<br />
          <strong>Prenom :</strong> ${this.escapeHtml(input.application.firstname)}<br />
          <strong>Nom :</strong> ${this.escapeHtml(input.application.lastname ?? '-')}<br />
          <strong>Email :</strong> <a href="mailto:${this.escapeHtml(input.application.email)}">${this.escapeHtml(input.application.email)}</a><br />
          <strong>Projets en cours :</strong> ${this.escapeHtml(input.application.projectCount)}<br />
          <strong>Profil :</strong> ${this.escapeHtml(input.application.profileType)}
        </p>
        <div style="margin: 20px 0;">
          <strong>Probleme rencontre :</strong>
          <p style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-top: 8px;">
            ${this.escapeHtml(input.application.problemDescription).replaceAll('\n', '<br />')}
          </p>
        </div>
        <p>
          <strong>Accepte le traitement de la demande :</strong> ${input.application.acknowledgement ? 'Oui' : 'Non'}
        </p>
        <p style="margin-top: 24px;">
          <a
            href="mailto:${this.escapeHtml(input.application.email)}"
            style="display: inline-block; padding: 12px 18px; background: #1f6feb; color: #ffffff; text-decoration: none; border-radius: 8px;"
          >
            Repondre au candidat
          </a>
        </p>
      </div>
    `.trim();
  }

  private buildPilotApplicationApprovedText(
    input: SendPilotApplicationApprovedInput,
  ) {
    const expirationLabel = this.formatDate(input.expiresAt);

    return [
      `Bonjour ${input.firstName},`,
      '',
      'Votre candidature Axelys a ete approuvee.',
      `Vous pouvez maintenant lancer votre abonnement ${input.planLabel} (${input.priceLabel}) via Stripe Checkout.`,
      '',
      `Organisation preparee : ${input.organizationName}`,
      `Lien de souscription : ${input.checkoutUrl}`,
      '',
      `Ce lien expire le ${expirationLabel}.`,
      'Votre acces a la plateforme sera active uniquement apres confirmation Stripe du paiement.',
    ].join('\n');
  }

  private buildPilotApplicationApprovedHtml(
    input: SendPilotApplicationApprovedInput,
  ) {
    const expirationLabel = this.formatDate(input.expiresAt);

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Bonjour ${this.escapeHtml(input.firstName)},</p>
        <p>Votre candidature Axelys a ete approuvee.</p>
        <p>
          Vous pouvez maintenant lancer votre abonnement <strong>${this.escapeHtml(input.planLabel)}</strong>
          (${this.escapeHtml(input.priceLabel)}) via Stripe Checkout.
        </p>
        <p>
          <strong>Organisation preparee :</strong> ${this.escapeHtml(input.organizationName)}
        </p>
        <p>
          <a
            href="${this.escapeHtml(input.checkoutUrl)}"
            style="display: inline-block; padding: 12px 18px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;"
          >
            Demarrer mon abonnement
          </a>
        </p>
        <p>Ce lien expire le <strong>${this.escapeHtml(expirationLabel)}</strong>.</p>
        <p style="color: #4b5563;">
          Votre acces a la plateforme sera active uniquement apres confirmation Stripe du paiement.
        </p>
        <p style="color: #4b5563; word-break: break-all;">
          ${this.escapeHtml(input.checkoutUrl)}
        </p>
      </div>
    `.trim();
  }

  private buildPilotApplicationRejectedText(
    input: SendPilotApplicationRejectedInput,
  ) {
    return [
      `Bonjour ${input.firstName},`,
      '',
      'Merci pour votre candidature au programme pilote Axelys.',
      'Nous ne pouvons pas donner suite favorable a votre demande a ce stade.',
      '',
      'Nous vous recontacterons si le programme evolue ou si une nouvelle place se libere.',
    ].join('\n');
  }

  private buildPilotApplicationRejectedHtml(
    input: SendPilotApplicationRejectedInput,
  ) {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Bonjour ${this.escapeHtml(input.firstName)},</p>
        <p>Merci pour votre candidature au programme pilote Axelys.</p>
        <p>Nous ne pouvons pas donner suite favorable a votre demande a ce stade.</p>
        <p style="color: #4b5563;">
          Nous vous recontacterons si le programme evolue ou si une nouvelle place se libere.
        </p>
      </div>
    `.trim();
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(value);
  }

  private getLegalLinks() {
    const siteUrl = this.getPublicSiteUrl();

    return {
      cgu: `${siteUrl}/cgu`,
      cgv: `${siteUrl}/cgv`,
      privacyPolicy: `${siteUrl}/politique-de-confidentialite`,
    };
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
