import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint deprecie et desactive' },
    { status: 410 }
  );
}
