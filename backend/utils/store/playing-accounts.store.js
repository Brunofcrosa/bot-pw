import { setKey, removeKey, getKey } from './store-wrapper.store.js';

const PLAYING_ACCOUNTS_KEY = 'playing-accounts';

export function set(settings) {
    setKey(PLAYING_ACCOUNTS_KEY, settings);
}

export function remove() {
    removeKey(PLAYING_ACCOUNTS_KEY);
}

export function get() {
    return getKey(PLAYING_ACCOUNTS_KEY);
}

export default {};
