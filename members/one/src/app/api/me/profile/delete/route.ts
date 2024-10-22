import { NextRequest, NextResponse } from 'next/server';
import { firestore, usersCollection, authAccountsCollection } from '@/lib/firestore'; // Adjust based on your Firestore setup
import { auth } from '@/auth';

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { userId, confirmationText } = await req.json();

    if (!userId || confirmationText !== 'DELETE') {
      return NextResponse.json({ message: 'Invalid request or confirmation text' }, { status: 400 });
    }

    if (session.user.uid !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Deleting user profile from Firestore
    const userDocRef = usersCollection(firestore).doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    await userDocRef.delete();

    // Deleting associated authentication accounts
    const accountsQuery = authAccountsCollection(firestore).where('userId', '==', userId);
    const accountsSnapshot = await accountsQuery.get();

    const batch = firestore.batch();
    accountsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({ message: 'User account and data deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
