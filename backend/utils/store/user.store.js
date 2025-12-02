import { setKey, removeKey, getKey } from './store-wrapper.store.js';

const USER_KEY = 'user';

export function set(user) {
    setKey(USER_KEY, user);
}

export function remove() {
    removeKey(USER_KEY);
}

export function get() {
    return getKey(USER_KEY);
}

export default {}