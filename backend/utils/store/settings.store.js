import { setKey, removeKey, getKey } from './store-wrapper.store.js';

const SETTINGS_KEY = 'settings';

export function set(settings) {
    setKey(SETTINGS_KEY, settings);
}

export function remove() {
    removeKey(SETTINGS_KEY);
}

export function get() {
    return getKey(SETTINGS_KEY);
}

export default {};
