import { NextRequest, NextResponse } from 'next/server';
import { firestore, usersCollection } from '@/lib/firestore';
import { auth } from '@/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.uid; // Adjust based on how your session stores the user ID
    const data = await request.json();
    console.log(data);

    const validFields = ['theme', 'language', 'font'];
    const updateData: { [key: string]: any } = {};

    for (const key of validFields) {
      if (key in data) {
        updateData[`preferences.appearance.${key}`] = data[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided' }, { status: 400 });
    }

    const userDoc = usersCollection(firestore).doc(userId);
    await userDoc.update(updateData);

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to update profile', error: error.message }, { status: 500 });
  }
}
