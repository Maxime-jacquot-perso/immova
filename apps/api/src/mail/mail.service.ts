import { Injectable, Logger } from '@nestjs/common';

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
  mode: 'console' | 'resend';
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resendApiKey = process.env.RESEND_API_KEY?.trim();
  private readonly mailFrom = process.env.MAIL_FROM?.trim();

  async sendUserInvitation(
    input: SendUserInvitationMailInput,
  ): Promise<MailDeliveryResult> {
    const subject = 'Votre acces a Immova';
    const text = this.buildInvitationText(input);
    const html = this.buildInvitationHtml(input);

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
