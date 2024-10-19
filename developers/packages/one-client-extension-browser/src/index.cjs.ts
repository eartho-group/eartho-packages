import createEarthoOneExtensionBrowser, {
  EarthoOneExtensionBrowser,
  GenericError,
  AuthenticationError,
  TimeoutError,
  PopupTimeoutError,
  MfaRequiredError
} from './index';

/**
 * @ignore
 */
const wrapper = createEarthoOneExtensionBrowser as any;

wrapper.EarthoOneExtensionBrowser = EarthoOneExtensionBrowser;
wrapper.createEarthoOneExtensionBrowser = createEarthoOneExtensionBrowser;
wrapper.GenericError = GenericError;
wrapper.AuthenticationError = AuthenticationError;
wrapper.TimeoutError = TimeoutError;
wrapper.PopupTimeoutError = PopupTimeoutError;
wrapper.MfaRequiredError = MfaRequiredError;

export default wrapper;
