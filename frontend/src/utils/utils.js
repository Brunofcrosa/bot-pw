/**
 * Returns a 2-letter abbreviation for the character class or '?' if undefined.
 * @param {string} charClass 
 * @returns {string}
 */
export const getClassDisplay = (charClass) => {
    if (!charClass) return '?';
    return charClass.substring(0, 2).toUpperCase();
};
