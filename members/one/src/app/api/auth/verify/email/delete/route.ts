import { NextRequest, NextResponse } from 'next/server';
import { firestore, usersCollection } from '@/lib/firestore';
import admin from 'firebase-admin';
import { auth } from '@/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { email }: { email: string } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Assuming your session contains user id
    const userId = session.user.uid;
    const userDoc = usersCollection(firestore).doc(userId);
    const userSnapshot = await userDoc.get();

    if (!userSnapshot.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userData = userSnapshot.data();

    if (!userData || !userData.verifiedEmails || !userData.verifiedEmails.includes(email)) {
      return NextResponse.json({ message: 'Email not found in verified emails' }, { status: 400 });
    }

    await userDoc.update({
      verifiedEmails: admin.firestore.FieldValue.arrayRemove(email)
    });

    return NextResponse.json({ message: 'Email deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to delete email', error: error.message }, { status: 500 });
  }
}
