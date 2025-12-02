import { setKey, removeKey, getKey } from './store-wrapper.store.js';

const PARTY_KEY = 'party';

export function set(party) {
    setKey(PARTY_KEY, party);
}

export function remove() {
    removeKey(PARTY_KEY);
}

export function get() {
    return getKey(PARTY_KEY);
}

export default {};
