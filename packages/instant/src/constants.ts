import { BigNumber } from '@0x/utils';

import { AccountNotReady, AccountState, Network, ProviderType } from './types';
import { EnvironmentToDomain } from './util/script_environment';

export const BIG_NUMBER_ZERO = new BigNumber(0);
export const ETH_DECIMALS = 18;
export const DEFAULT_ZERO_EX_CONTAINER_SELECTOR = '#zeroExInstantContainer';
export const INJECTED_DIV_CLASS = 'zeroExInstantResetRoot';
export const INJECTED_DIV_ID = 'zeroExInstant';
export const WEB_3_WRAPPER_TRANSACTION_FAILED_ERROR_MSG_PREFIX = 'Transaction failed';
export const GWEI_IN_WEI = new BigNumber(1000000000);
export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
export const ACCOUNT_UPDATE_INTERVAL_TIME_MS = ONE_SECOND_MS * 5;
export const BUY_QUOTE_UPDATE_INTERVAL_TIME_MS = ONE_SECOND_MS * 15;
export const DEFAULT_GAS_PRICE = GWEI_IN_WEI.mul(6);
export const DEFAULT_ESTIMATED_TRANSACTION_TIME_MS = ONE_MINUTE_MS * 2;
export const ETH_GAS_STATION_API_BASE_URL = 'https://ethgasstation.info';
export const COINBASE_API_BASE_URL = 'https://api.coinbase.com/v2';
export const PROGRESS_STALL_AT_WIDTH = '95%';
export const PROGRESS_FINISH_ANIMATION_TIME_MS = 200;
export const ROLLBAR_ACCESS_TOKEN = '61aed26a8c4d49aa9d10509a31a843d4';
export const ENVIRONMENTS_TO_DOMAINS: EnvironmentToDomain = {
    PRODUCTION: ['unpkg.com', 'jsdelivr.com'],
    STAGING: ['0x-instant-staging.s3-website-us-east-1.amazonaws.com'],
    DOGFOOD: ['0x-instant-dogfood.s3-website-us-east-1.amazonaws.com'],
    DEVELOPMENT: ['0.0.0.0', '127.0.0.1', 'localhost', 'ngrok.io'],
};
export const COINBASE_WALLET_IOS_APP_STORE_URL = 'https://itunes.apple.com/us/app/coinbase-wallet/id1278383455?mt=8';
export const COINBASE_WALLET_ANDROID_APP_STORE_URL = 'https://play.google.com/store/apps/details?id=org.toshi&hl=en';
export const COINBASE_WALLET_SITE_URL = 'https://wallet.coinbase.com/';
export const META_MASK_FIREFOX_STORE_URL = 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/';
export const META_MASK_CHROME_STORE_URL =
    'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en';
export const META_MASK_OPERA_STORE_URL = 'https://addons.opera.com/en/extensions/details/metamask/';
export const META_MASK_SITE_URL = 'https://metamask.io/';
export const ETHEREUM_NODE_URL_BY_NETWORK = {
    [Network.Mainnet]: 'https://mainnet.infura.io/',
    [Network.Kovan]: 'https://kovan.infura.io/',
};
export const BLOCK_POLLING_INTERVAL_MS = 10000; // 10s
export const NO_ACCOUNT: AccountNotReady = {
    state: AccountState.None,
};
export const LOADING_ACCOUNT: AccountNotReady = {
    state: AccountState.Loading,
};
export const LOCKED_ACCOUNT: AccountNotReady = {
    state: AccountState.Locked,
};
export const PROVIDER_TYPE_TO_NAME: { [key in ProviderType]: string } = {
    [ProviderType.Cipher]: 'Cipher',
    [ProviderType.MetaMask]: 'MetaMask',
    [ProviderType.Mist]: 'Mist',
    [ProviderType.CoinbaseWallet]: 'Coinbase Wallet',
    [ProviderType.Parity]: 'Parity',
};
