import { setKey, removeKey, getKey } from './store-wrapper.store.js';

const AUTH_USER_KEY = 'authUser';

export function set(data) {
    setKey(AUTH_USER_KEY, data);
}

export function get() {
    return getKey(AUTH_USER_KEY);
}

export function remove() {
    return removeKey(AUTH_USER_KEY);
}

export default {}