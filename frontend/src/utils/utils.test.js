import { getClassDisplay } from './utils';

describe('getClassDisplay', () => {
    test('returns first 2 letters capitalized for valid class', () => {
        expect(getClassDisplay('Mercenary')).toBe('ME');
        expect(getClassDisplay('archer')).toBe('AR');
    });

    test('returns ? for null/undefined/empty', () => {
        expect(getClassDisplay(null)).toBe('?');
        expect(getClassDisplay(undefined)).toBe('?');
        expect(getClassDisplay('')).toBe('?');
    });

    test('handles short strings', () => {
        expect(getClassDisplay('A')).toBe('A');
    });
});
