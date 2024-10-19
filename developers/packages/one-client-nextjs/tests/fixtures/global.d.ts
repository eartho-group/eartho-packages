declare global {
  var getSession: Function | undefined;
  var touchSession: Function | undefined;
  var updateSession: Function | undefined;
  var handleAccess: Function | undefined;
  var withServerAccessRequired: Function | undefined;
  var withClientAccessRequired: Function | undefined;
  var withClientAccessRequiredCSR: Function | undefined;
  var getAccessToken: Function | undefined;
  var asyncProps: boolean | undefined;
  var onError: Function | undefined;
}

export {};
