import { setKey, removeKey, getKey } from './store-wrapper.store.js';

const SUBSCRIPTION_KEY = 'subscription';

export function set(subscription) {
    setKey(SUBSCRIPTION_KEY, subscription);
}

export function remove() {
    removeKey(SUBSCRIPTION_KEY);
}

export function get() {
    return getKey(SUBSCRIPTION_KEY);
}

export default {};
