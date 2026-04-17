import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type SendUserInvitationMailInput = {
  to: string;
  organizationName: string;
  organizationSlug: string;
  membershipRole: string;
  acceptUrl: string;
  expiresAt: Date;
  requiresPasswordSetup: boolean;
};

export type MailDeliveryResult = {
  mode: 'console' | 'smtp' | 'resend';
};

export type SendPilotApplicationNotificationInput = {
  to: string;
  application: {
    firstname: string;
    email: string;
    projectCount: string;
    profileType: string;
    problemDescription: string;
    acknowledgement: boolean;
  };
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
    const subject = 'Votre acces Axelys';
    const text = this.buildInvitationText(input);
    const html = this.buildInvitationHtml(input);
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
        subject,
        text,
        html,
      });

      return { mode: 'smtp' };
    }

    if (this.resendApiKey && this.mailFrom) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.mailFrom,
          to: [input.to],
          subject,
          text,
          html,
        }),
      });

      if (!response.ok) {
        const payload = await response.text();

        throw new Error(
          `Resend invitation delivery failed with status ${response.status}: ${payload}`,
        );
      }

      return { mode: 'resend' };
    }

    this.logger.log(
      [
        'Invitation email logged locally.',
        `To: ${input.to}`,
        `Subject: ${subject}`,
        `Organization: ${input.organizationName} (${input.organizationSlug})`,
        `Role: ${input.membershipRole}`,
        `Accept URL: ${input.acceptUrl}`,
        `Expires at: ${input.expiresAt.toISOString()}`,
        `Requires password setup: ${input.requiresPasswordSetup}`,
      ].join('\n'),
    );

    return { mode: 'console' };
  }

  async sendPilotApplicationNotification(
    input: SendPilotApplicationNotificationInput,
  ): Promise<MailDeliveryResult> {
    const subject = 'Nouvelle candidature client pilote';
    const text = this.buildPilotApplicationText(input);
    const html = this.buildPilotApplicationHtml(input);
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
        subject,
        text,
        html,
        replyTo: input.application.email,
      });

      return { mode: 'smtp' };
    }

    if (this.resendApiKey && this.mailFrom) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.mailFrom,
          to: [input.to],
          subject,
          text,
          html,
          reply_to: input.application.email,
        }),
      });

      if (!response.ok) {
        const payload = await response.text();

        throw new Error(
          `Resend pilot notification delivery failed with status ${response.status}: ${payload}`,
        );
      }

      return { mode: 'resend' };
    }

    this.logger.log(
      [
        'Pilot application notification logged locally.',
        `From: ${input.application.firstname} <${input.application.email}>`,
        `Subject: ${subject}`,
        `Project count: ${input.application.projectCount}`,
        `Profile: ${input.application.profileType}`,
        `Problem: ${input.application.problemDescription}`,
        `Acknowledgement: ${input.application.acknowledgement}`,
      ].join('\n'),
    );

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
    const nextStep = input.requiresPasswordSetup
      ? 'Utilisez ce lien pour definir votre mot de passe et finaliser votre acces.'
      : 'Utilisez ce lien pour confirmer votre acces, puis connectez-vous avec votre mot de passe habituel.';

    return [
      'Un administrateur a cree votre acces Axelys.',
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
    const nextStep = input.requiresPasswordSetup
      ? 'Utilisez ce lien securise pour definir votre mot de passe et finaliser votre acces.'
      : 'Utilisez ce lien securise pour confirmer votre acces, puis connectez-vous avec votre mot de passe habituel.';

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Un administrateur a cree votre acces Axelys.</p>
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

  private buildPilotApplicationText(
    input: SendPilotApplicationNotificationInput,
  ) {
    return [
      'Nouvelle candidature client pilote',
      '',
      `Prenom : ${input.application.firstname}`,
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
          <strong>Prenom :</strong> ${this.escapeHtml(input.application.firstname)}<br />
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
