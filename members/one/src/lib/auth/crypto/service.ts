import { signIn } from "next-auth/react";
const ethers = require("ethers")

export const handleMetaMaskLogin = async (onSuccess:Function) => {
  if (typeof window.ethereum !== "undefined") {
    try {
      let provider;
      let signer = null;

      if (window.ethereum == null) {

        console.log("MetaMask not installed; using read-only defaults")
        provider = ethers.getDefaultProvider()

      } else {

        provider = new ethers.BrowserProvider(window.ethereum)
        signer = await provider.getSigner();
      }
      await provider.send("eth_requestAccounts", []);
      const publicAddress = await signer.getAddress();

      const response = await fetch("/api/auth/signin/crypto/nonce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicAddress }),
      });

      const { nonce } = await response.json();
      const signedNonce = await signer.signMessage(nonce);

      await signIn("cryptowallet", {
        redirect: false,
        publicAddress,
        signedNonce,
      });
      onSuccess()
    } catch (error) {
      console.error("MetaMask login error:", error);
    }
  } else {
    console.error("MetaMask is not installed");
  }
};