// Adjust the import path based on your Firestore setup
import { auth } from '@/auth';
import { authAccountsCollection, firestore } from '@/lib/firestore'; // Update this based on your actual Firestore setup
import { NextResponse } from 'next/server';

export async function GET(req: any) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = session.user.uid; // Adjust based on how your session stores the user ID

  try {
    const userAccountsRef = authAccountsCollection(firestore).where('userId', '==', id);
    const snapshot = await userAccountsRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'No accounts found for this user' }, { status: 404 });
    }

    const accounts: { id: string; provider: any; }[] = [];
    snapshot.forEach(doc => {
      const { id, provider } = doc.data();
      accounts.push({ id: doc.id, provider });
    });

    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
