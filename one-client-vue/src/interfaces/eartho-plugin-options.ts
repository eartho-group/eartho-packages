/**
 * Additional Configuration for the Eartho Vue plugin
 */
export interface EarthoPluginOptions {
  /**
   * By default, if the page URL has code and state parameters, the SDK will assume it should handle it and attempt to exchange the code for a token.
   *
   * In situations where you are combining our SDK with other libraries that use the same `code` and `state` parameters,
   * you will need to ensure our SDK can differentiate between requests it should and should not handle.
   *
   * In these cases you can instruct the client to ignore certain URLs by setting `skipRedirectCallback`.
   *
   * ```js
   * createEarthoOne({}, {
   *   skipRedirectCallback: window.location.pathname === '/other-callback'
   * })
   * ```
   *
   * **Note**: In the above example, `/other-callback` is an existing route, with a `code` (or `error` in case when something went wrong) and `state`, that will be handled
   * by any other SDK.
   *
   */
  skipRedirectCallback?: boolean;

  /**
   * Path in your application to redirect to when the Authorization server
   * returns an error. Defaults to `/`
   */
  errorPath?: string;
}
