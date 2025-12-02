import Store from 'electron-store';

const store = new Store();

/**
 * Salva um valor com a chave informada
 * @param {string} key
 * @param {*} value
 */
export function setKey(key, value) {
    store.set(key, value);
}

/**
 * Retorna o valor da chave informada
 * @param {string} key
 * @returns {*}
 */
export function getKey(key) {
    return store.get(key);
}

/**
 * Verifica se a chave existe
 * @param {string} key
 * @returns {boolean}
 */
export function hasKey(key) {
    return store.has(key);
}

/**
 * Remove a chave do store
 * @param {string} key
 */
export function removeKey(key) {
    store.delete(key);
}

/**
 * Retorna todas as chaves/valores
 * @returns {object}
 */
export function getAll() {
    return store.store;
}

/**
 * Limpa todo o store (cuidado!)
 */
export function clearAll() {
    store.clear();
}

export default {};
