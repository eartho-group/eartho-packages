const handleRedirectCallback = jest.fn(() => ({ appState: {} }));
const buildLogoutUrl = jest.fn();
const buildAuthorizeUrl = jest.fn();
const checkSession = jest.fn();
const getTokenSilently = jest.fn();
const getTokenWithPopup = jest.fn();
const getUser = jest.fn();
const getIdToken = jest.fn();
const isConnected = jest.fn(() => false);
const connectWithPopup = jest.fn();
const connectWithRedirect = jest.fn();
const logout = jest.fn();

export const EarthoOne = jest.fn(() => {
  return {
    buildAuthorizeUrl,
    buildLogoutUrl,
    checkSession,
    handleRedirectCallback,
    getTokenSilently,
    getTokenWithPopup,
    getUser,
    getIdToken,
    isConnected,
    connectWithPopup,
    connectWithRedirect,
    logout,
  };
});
