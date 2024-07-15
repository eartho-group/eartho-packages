import 'core-js/es/string/starts-with';
import 'core-js/es/symbol';
import 'core-js/es/array/from';
import 'core-js/es/typed-array/slice';
import 'core-js/es/array/includes';
import 'core-js/es/string/includes';
import 'core-js/es/set';
import 'promise-polyfill/src/polyfill';
import 'fast-text-encoding';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';
import $ from "jquery";

import EarthoOneExtensionBrowser from './EarthoOneExtensionBrowser';
import { EarthoOneExtensionBrowserOptions } from './global';

import './global';
import createEarthoOne from '@eartho/one-client-js';

export * from './global';


export default async function createEarthoOneExtensionBrowser(options: EarthoOneExtensionBrowserOptions) {
  const eartho = new EarthoOneExtensionBrowser(options);
  return eartho;
}

export { EarthoOneExtensionBrowser as EarthoOneExtensionBrowser };

export {
  GenericError,
  AuthenticationError,
  TimeoutError,
  PopupTimeoutError,
  PopupCancelledError,
  MfaRequiredError
} from './errors';