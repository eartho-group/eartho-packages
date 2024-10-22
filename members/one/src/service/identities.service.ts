import { getSession, useSession } from 'next-auth/react';
import apiService from './api.service';

export default function VirtualIdentitYService() {

  async function get() {
    const session = await getSession();
    const data = await apiService.get('/me/identities', {
      accessToken: session?.accessToken,
    });
    return data;
  }

  async function update(payload: any) {
    const session = await getSession();
    const data = await apiService.put(
      '/me/identities',
      payload,
      {
        accessToken: session?.accessToken,
      }
    );
    return data;
  }

  async function create(payload: any) {
    const session = await getSession();
    const data = await apiService.post(
      '/me/identities',
      payload,
      {
        accessToken: session?.accessToken,
      }
    );
    return data;
  }

  async function deleteIdentity(id: string) {
    const session = await getSession();
    const data = await apiService.delete('/me/identities/' + id, {}, {
      accessToken: session?.accessToken,
    });
    return data;
  }


  return { get, update, create, deleteIdentity };
}
