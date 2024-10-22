import { NextRequest, NextResponse } from 'next/server';
import { firestore, usersCollection } from '@/lib/firestore';
import { auth } from '@/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.uid; // Adjust based on how your session stores the user ID

    const userDoc = await usersCollection(firestore).doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userPreferences = userDoc.data()?.preferences;

    return NextResponse.json({ preferences: userPreferences }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to get preferences', error: error.message }, { status: 500 });
  }
}
