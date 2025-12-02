import * as store from '../../utils/store/playing-accounts.store.js';
import { getWebsocketMirror, getWindows } from '../../utils/shared-variables/shared-variables.js';

export function preventDuplicationPlayingAccounts(event, accounts) {
    const playingAccounts = store.get() ?? []
    const newAccounts = accounts.filter(account => {
        return !playingAccounts.some(playingAccount => playingAccount.id === account.id);
    });
    store.set([...playingAccounts, ...newAccounts]);
}

export function addPlayingAccounts(account) {
    const { partiesWindow, minimizedPartyWindow, toolsBarWindow, autoForjaWindow } = getWindows();
    const websocketMirror = getWebsocketMirror();
    const accounts = store.get() ?? [];
    if (accounts.some(existingAccount => existingAccount.id === account.id)) {
        return;
    }
    accounts.push(account);
    store.set(accounts);
    if (partiesWindow && partiesWindow.webContents) {
        partiesWindow.webContents.send('playing-accounts-updated', { code: 200, response: { type: 'add', account }, success: true });
    }
    if (toolsBarWindow && toolsBarWindow.webContents) {
        toolsBarWindow.webContents.send('playing-accounts-updated', { code: 200, response: { type: 'add', account }, success: true });
    }
    if (minimizedPartyWindow && minimizedPartyWindow.webContents) {
        minimizedPartyWindow.webContents.send('playing-accounts-updated', { code: 200, response: { type: 'add', account }, success: true });
    }
    if (autoForjaWindow && autoForjaWindow.webContents) {
        autoForjaWindow.webContents.send('playing-accounts-updated', { code: 200, response: { type: 'add', account }, success: true });
    }
    if (websocketMirror) {
        websocketMirror.send(JSON.stringify({ type: 'playing-accounts-updated', data: { code: 200, response: { type: 'add', account }, success: true } }));
    }
}

export function removePlayingAccounts(id) {
    const { partiesWindow, minimizedPartyWindow, toolsBarWindow, autoForjaWindow } = getWindows();
    const accounts = store.get() ?? [];
    const updatedAccounts = accounts.filter(account => account.id !== id);
    store.set(updatedAccounts);
    if (partiesWindow && partiesWindow.webContents) {
        partiesWindow.webContents.send('playing-accounts-updated', { code: 200, response: { type: 'remove', id }, success: true });
    }
    if (toolsBarWindow && toolsBarWindow.webContents) {
        toolsBarWindow.webContents.send('playing-accounts-updated', { code: 200, response: { type: 'remove', id }, success: true });
    }
    if (minimizedPartyWindow && minimizedPartyWindow.webContents) {
        minimizedPartyWindow.webContents.send('playing-accounts-updated', { code: 200, response: { type: 'remove', id }, success: true });
    }
    if (autoForjaWindow && autoForjaWindow.webContents) {
        autoForjaWindow.webContents.send('playing-accounts-updated', { code: 200, response: { type: 'remove', id }, success: true });
    }
}

export function updatePid(id, newPid) {
    const accounts = store.get() ?? [];
    const account = accounts.find(account => account.id === id);
    if (account) {
        account.pid = newPid;
        store.set(accounts);
    }
}

export function setCrashState(id, value) {
    const accounts = store.get() ?? [];
    const account = accounts.find(account => account.id === id);
    if (account) {
        account.crashState = value;
    }
    store.set(accounts);
}

export function getAccountPlayingById(event, id) {
    const accounts = store.get() ?? [];
    const account = accounts.find(e => e.id === id)
    if (account) {
        return { code: 200, response: account, success: true };
    } else {
        return { code: 404, response: { message: 'Account not found' }, success: false };
    }
}

export default {};