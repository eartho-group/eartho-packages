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

    const validFields = {
      'preferences.notifications.generalSettings.notificationType': data.notificationType,
      'preferences.notifications.generalSettings.separateMobileSettings': data.separateMobileSettings,
      'preferences.notifications.channels.email.enabled': data.email?.enabled,
      'preferences.notifications.channels.email.frequency': data.email?.frequency,
      'preferences.notifications.channels.email.categories.communication': data.email?.categories?.communication,
      'preferences.notifications.channels.email.categories.social': data.email?.categories?.social,
      'preferences.notifications.channels.email.categories.marketing': data.email?.categories?.marketing,
      'preferences.notifications.channels.email.categories.security': data.email?.categories?.security,
      'preferences.notifications.channels.push.enabled': data.push?.enabled,
      'preferences.notifications.channels.push.sound': data.push?.sound,
      'preferences.notifications.channels.push.vibration': data.push?.vibration,
      'preferences.notifications.channels.push.categories.messages': data.push?.categories?.messages,
      'preferences.notifications.channels.push.categories.reminders': data.push?.categories?.reminders,
      'preferences.notifications.channels.push.categories.alerts': data.push?.categories?.alerts,
      'preferences.notifications.channels.sms.enabled': data.sms?.enabled,
      'preferences.notifications.channels.sms.frequency': data.sms?.frequency,
      'preferences.notifications.channels.sms.categories.security': data.sms?.categories?.security,
      'preferences.notifications.channels.sms.categories.promotions': data.sms?.categories?.promotions,
      'preferences.notifications.channels.inApp.enabled': data.inApp?.enabled,
      'preferences.notifications.channels.inApp.sound': data.inApp?.sound,
      'preferences.notifications.channels.inApp.vibration': data.inApp?.vibration,
      'preferences.notifications.channels.inApp.categories.messages': data.inApp?.categories?.messages,
      'preferences.notifications.channels.inApp.categories.reminders': data.inApp?.categories?.reminders,
      'preferences.notifications.channels.inApp.categories.system': data.inApp?.categories?.system,
    };

    const updateData: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(validFields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided' }, { status: 400 });
    }

    const userDoc = usersCollection(firestore).doc(userId);
    await userDoc.update({
      ...updateData,
      lastUpdated: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Notification preferences updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to update notification preferences', error: error.message }, { status: 500 });
  }
}
