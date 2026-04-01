import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.firstname || !body.email || !body.projectCount || !body.profileType || !body.problemDescription) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    if (!body.acknowledgement) {
      return NextResponse.json(
        { error: 'Vous devez accepter les conditions de la phase pilote' },
        { status: 400 }
      );
    }

    // Forward to NestJS API
    const response = await fetch(`${API_URL}/pilot-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de la candidature' },
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
