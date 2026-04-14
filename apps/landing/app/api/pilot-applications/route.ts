import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '../../site-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = {
      ...body,
      firstname: body.firstname?.trim(),
      email: body.email?.trim(),
      problemDescription: body.problemDescription?.trim(),
    };

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
        { error: 'Vous devez accepter les conditions de la phase pilote' },
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
      return NextResponse.json(
        { error: 'Erreur lors de l’envoi de la demande. Réessayez dans quelques instants.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing pilot application:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
