import { setKey, removeKey, getKey } from './store-wrapper.store.js';

const AUTO_FORJA_KEY = 'auto-forja';

export function set(party) {
    setKey(AUTO_FORJA_KEY, party);
}

export function remove() {
    removeKey(AUTO_FORJA_KEY);
}

export function get() {
    return getKey(AUTO_FORJA_KEY);
}

export default {};
