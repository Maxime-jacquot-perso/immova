import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '../../site-config';
import { getPostHogClient } from '../../../lib/posthog-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const analyticsDistinctId =
      typeof body.analyticsDistinctId === 'string'
        ? body.analyticsDistinctId.trim()
        : '';
    const analyticsConsentGranted = body.analyticsConsentGranted === true;
    const payload = {
      ...body,
      firstname: body.firstname?.trim(),
      email: body.email?.trim(),
      problemDescription: body.problemDescription?.trim(),
    };
    delete payload.analyticsDistinctId;
    delete payload.analyticsConsentGranted;

    if (
      !payload.firstname ||
      !payload.email ||
      !payload.projectCount ||
      !payload.profileType ||
      !payload.problemDescription
    ) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    if (!payload.acknowledgement) {
      return NextResponse.json(
        {
          error:
            'Vous devez accepter la politique de confidentialité et le traitement de votre demande.',
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${apiUrl}/pilot-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API error:', error);
      if (analyticsConsentGranted && analyticsDistinctId) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: analyticsDistinctId,
          event: 'pilot_application_api_error',
          properties: {
            profile_type: payload.profileType,
            project_count: payload.projectCount,
            error_source: 'backend_api',
          },
        });
      }
      return NextResponse.json(
        {
          error:
            'Erreur lors de l’envoi de la demande. Réessayez dans quelques instants.',
        },
        { status: 500 },
      );
    }

    if (analyticsConsentGranted && analyticsDistinctId) {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: analyticsDistinctId,
        event: 'pilot_application_received',
        properties: {
          profile_type: payload.profileType,
          project_count: payload.projectCount,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing pilot application:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 },
    );
  }
}
