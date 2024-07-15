import { EarthoOneExtensionBrowserOptions } from "./global";
import { EarthoOne, PopupConnectOptions } from '@eartho/one-client-js';
import $ from "jquery";

export default class EarthoOneExtensionBrowser {
  private earthoOneClient: EarthoOne;

  constructor(options: EarthoOneExtensionBrowserOptions) {
    this.earthoOneClient = options.earthoOne;
  }

  async isConnected() {
    return await this.earthoOneClient.isConnected();
  }

  async getIdToken() {
    return await this.earthoOneClient.getIdToken();
  }

  async getUser() {
    return await this.earthoOneClient.getUser();
  }

  async disconnect() {
    return await this.earthoOneClient.logout();
  }

  async connectWithPopup(options?: PopupConnectOptions) {
    await this.earthoOneClient.connectWithPopup(options, { manualMode: true });
    var popupPlayer = window.open('', 'earthoOne:authorize:popup', 'status=1,width=1,height=1');
    popupPlayer.focus();
    popupPlayer.close();
  }
}
