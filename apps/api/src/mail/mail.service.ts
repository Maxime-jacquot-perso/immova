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

  async sendUserInvitation(
    input: SendUserInvitationMailInput,
  ): Promise<MailDeliveryResult> {
    const subject = 'Votre acces a Immova';
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
    const nextStep = input.requiresPasswordSetup
      ? 'Utilisez ce lien pour definir votre mot de passe et finaliser votre acces.'
      : 'Utilisez ce lien pour confirmer votre acces, puis connectez-vous avec votre mot de passe habituel.';

    return [
      'Un administrateur a cree un acces Immova pour votre compte.',
      '',
      `Organisation : ${input.organizationName}`,
      `Role : ${input.membershipRole}`,
      '',
      nextStep,
      input.acceptUrl,
      '',
      `Ce lien expire le ${expirationLabel}.`,
      "Si vous n'etes pas concerne, ignorez simplement cet email.",
    ].join('\n');
  }

  private buildInvitationHtml(input: SendUserInvitationMailInput) {
    const expirationLabel = this.formatDate(input.expiresAt);
    const nextStep = input.requiresPasswordSetup
      ? 'Utilisez ce lien securise pour definir votre mot de passe et finaliser votre acces.'
      : 'Utilisez ce lien securise pour confirmer votre acces, puis connectez-vous avec votre mot de passe habituel.';

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Un administrateur a cree un acces Immova pour votre compte.</p>
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
          Si vous n'etes pas concerne, ignorez simplement cet email.
        </p>
        <p style="color: #4b5563; word-break: break-all;">
          ${this.escapeHtml(input.acceptUrl)}
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

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
