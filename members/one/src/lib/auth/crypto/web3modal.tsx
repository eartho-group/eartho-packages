'use client'

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import { ReactNode } from 'react'

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = '83d72544c914ac57288cf5cff143c370'

// 2. Set chains
const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
}

// 3. Create a metadata object
const metadata = {
  name: 'Eartho',
  description: '',
  url: 'https://eartho.io',
  icons: ['https://avatars.mywebsite.com/']
}
// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: '...', // used for the Coinbase SDK
  defaultChainId: 1 // used for the Coinbase SDK
})

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true // Optional - false as default
})

interface Web3ModalProps {
  children: ReactNode;
}

export function Web3Modal({ children }: Web3ModalProps) {
  return <>{children}</>;
}
