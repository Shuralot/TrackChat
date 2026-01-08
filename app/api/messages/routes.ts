import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(messages);
}
