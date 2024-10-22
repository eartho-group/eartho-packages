import { getSession } from 'next-auth/react';
import apiService from './api.service';

export default function FinanceService() {

  async function getPaymentToken() {
    const session = await getSession()
    const data = await apiService.get('/me/finance/method/token', {
      accessToken: session?.accessToken,
    });
    return data.token;
  }

  async function addPaymentMethod(paymentMethod: any) {
    const session = await getSession()
    const data = await apiService.post('/me/finance/method', {
      paymentMethod,
    }, {
      accessToken: session?.accessToken,
    });
    return data;
  }

  async function deletePaymentMethod(paymentMethod: any) {
    const session = await getSession()
    const data = await apiService.delete('/me/finance/method', {
      paymentMethod,
    }, {
      accessToken: session?.accessToken,
    });
    return data;
  }

  async function updateDefaultPaymentMethod(paymentMethod: any) {
    const session = await getSession()
    const data = await apiService.post('/me/finance/method/default', {
      paymentMethod,
    }, {
      accessToken: session?.accessToken,
    });
    return data;
  }

  async function getWallet() {
    const session = await getSession()
    const data = await apiService.get('/me/finance/wallet', {
      accessToken: session?.accessToken,
    });
    return data;
  }
  
  async function getPaymentMethods() {
    const session = await getSession()
    const data = await apiService.get('/me/finance/method', {
      accessToken: session?.accessToken,
    });
    return data;
  }

  async function getBalance() {
    const session = await getSession()
    const data = await apiService.get('/me/finance/balance', {
      accessToken: session?.accessToken,
    });
    return data;
  }

  async function connect(accessId: any) {
    const session = await getSession()
    const data = await apiService.post(`/access/${accessId}/connection`, {
      accessToken: session?.accessToken,
    });
    return data;
  }

  return {
    getPaymentToken,
    addPaymentMethod,
    deletePaymentMethod,
    updateDefaultPaymentMethod,
    getPaymentMethods,
    connect,
    getWallet,
    getBalance,
  };
}
