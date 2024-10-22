import { getSession, useSession } from 'next-auth/react';
import apiService from './api.service';

const AccessService = () => {

  const get = async (accessId: any) => {
    const session = await getSession();
    return await apiService.get(`/access/${accessId}`);
  };

  const account = async (accessId: any) => {
    const session = await getSession();
    return await apiService.get(`/access/${accessId}/connection/account`);
  };

  const disconnect = async (accessId: any) => {
    const session = await getSession();
    return await apiService.get(`/access/${accessId}/connection`, {
      method: 'DELETE',
    });
  };

  const connect = async (accessId: any, selectedPaymentMethod: any) => {
    const session = await getSession();
    return await apiService.post(`/access/${accessId}/connection`, {
      selectedPaymentMethod: JSON.stringify({ selectedPaymentMethod })
    }, {
      accessToken: session?.accessToken
    });
  };

  const approveInvite = async (clientId: string , inviteToken: string) => {
    const session = await getSession();
    return await apiService.post(`/access/invite/connection`, {
      clientId: clientId,
      inviteToken: inviteToken
    }, {
      accessToken: session?.accessToken
    });
  };

  const getCode = async (entityId: any, accessId: any, nonce: any, state: any, responseMode: any, redirectUri: any) => {
    const session = await getSession();
    const params = {
      entity_id: entityId,
      client_id: entityId,
      access_id: accessId,
      nonce: nonce,
      state: state,
      response_mode: responseMode,
      redirect_uri: redirectUri
    };

    try {
      const response = await apiService.get('/access/oauth/code', {
        accessToken: session?.accessToken
      }, params);
      return response;
    } catch (error) {
      console.error("Error fetching code:", error);
      throw error;
    }
  };

  const userConnections = async () => {
    const session = await getSession();
    if (!session?.user) throw new Error('Not authenticated');
    return await apiService.get(`/access/connection/?account=${session.user.uid}`);
  };

  const getLicense = async (accessId: any) => {
    return await apiService.get(`/access/${accessId}/license`);
  };

  function publishCode(responseMode: string, data: any, redirectUri: string) {
    if (responseMode === 'web_message') {
      window.opener.postMessage(data, redirectUri);
    } else {
      const searchParams = new URLSearchParams();
      searchParams.append("state", data.response.state);
      searchParams.append("code", data.response.code);
      let a = searchParams.toString();
      let b = redirectUri + "?" + a;
      b = b.replace("/?", "?");
      window.location.replace(b);
      setTimeout("window.location.href = '" + b + "';", 1000);
      setTimeout("window.location = '" + b + "';", 1000);
      setTimeout("window.location.replace('" + b + "')", 1000);
    }
  }

  return { get, connect, disconnect, getCode, userConnections, account, getLicense, publishCode, approveInvite };
};

export default AccessService;
