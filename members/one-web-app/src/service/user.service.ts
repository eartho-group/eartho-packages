import { getSession } from 'next-auth/react';
import apiService from './api.service';
import { Session } from 'next-auth';

export default function UserService() {

  async function getUserProfile() {
    const session = await getSession();
    const data = await apiService.get('/me/profile', {
      accessToken: session?.accessToken,
    });
    return data;
  }

  async function updateUserProfile(payload: any) {
    const session = await getSession();
    const data = await apiService.put(
      '/me/profile',
      payload,
      {
        accessToken: session?.accessToken,
      }
    );
    return data;
  }

  async function getUserStatistics(session: Session | null) {
    const s = session //|| await getSession();
    const data = await apiService.get('/me/statistics', {
      accessToken: session?.accessToken,
    });
    return data;
  }

  return { getUserProfile, updateUserProfile, getUserStatistics };
}
