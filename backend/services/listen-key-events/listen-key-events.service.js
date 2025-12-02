import { spawn } from 'child_process'; // Add exec here
import * as settingsStore from '../../utils/store/settings.store.js';
import * as partyStore from '../../utils/store/party.store.js';
import path from 'path';
import { getWindows, dirname } from '../../utils/shared-variables/shared-variables.js';

function startListenKeyEvents(minimizedPartyWindow = null, websocketMirror = null, toolsBarWindow = null, autoForjaPlayerWindow = null) {
    const __dirname = dirname;
    const exe = process.env.NODE_ENV === 'development' ?
        path.join(__dirname, 'electron/v2/shared/exe/key-listener.exe') :
        path.join(process.resourcesPath, 'key-listener.exe');

    const proc = spawn(exe);

    proc.stdout.on('data', (data) => {
        try {
            const str = data.toString().trim(); // transforma Buffer em string
            const keyEvent = JSON.parse(str); // converte JSON
            console.log('Key Event:', keyEvent);
            const numPadVKey = [97, 98, 99, 100, 101, 102, 103, 104, 105, 96]
            const settings = settingsStore.get();
            const parties = partyStore.get();
            const { autoForjaPlayWindow } = getWindows();
            if (autoForjaPlayWindow) {
                if (keyEvent.state === 'down' && keyEvent.vk === 121) sendEvent('toggle-auto-forja', keyEvent);
                return;
            }
            if (keyEvent.state === 'down' && parties) {
                const preset = checkPresetShortcuts(parties, keyEvent);
                sendEvent('start-preset-by-shortcut', { preset: preset?.id });
                if (preset) return;
            }
            if (!settings.party) return;
            if (keyEvent.state === 'down' && settings.party.numPadEnable && numPadVKey.includes(keyEvent.vk)) {
                sendEvent('change-character-by-position', { position: numPadVKey.indexOf(keyEvent.vk) })
                return;
            }
            if (keyEvent.state === 'down' && keyEvent.vk === settings.party.alternateCharacterShortcut?.code) {
                sendEvent('alternate-character');
            }
            if (keyEvent.state === 'down' && keyEvent.vk === settings.party.nextPartyShortcut?.code) {
                sendEvent('next-party');
            }
            if (keyEvent.state === 'down' && keyEvent.vk === settings.party.previousPartyShortcut?.code) {
                sendEvent('previous-party');
            }
            if (keyEvent.state === 'down' && keyEvent.vk === settings.party.previousCharacterShortcut?.code) {
                sendEvent('previous-character');
            }
            if (keyEvent.state === 'down' && keyEvent.vk === settings.party.nextCharacterShortcut?.code) {
                sendEvent('next-character');
            }
            if (keyEvent.state === 'down' && keyEvent.vk === settings.party.activeClickMirror?.code) {
                sendEvent('mirror-click-by-shortcut');
            }
        } catch (error) {
            console.log(error)
        }
    });

    return proc;
}

function checkPresetShortcuts(parties, keyEvent) {
    let preset = null
    for (const party of parties) {
        preset = party.presets.presets.find(e => {
            return (e.shortcut?.shift ?? false) === keyEvent.shift &&
                (e.shortcut?.ctrl ?? false) === keyEvent.ctrl &&
                (e.shortcut?.alt ?? false) === keyEvent.alt &&
                keyEvent.vk === e.shortcut?.id
        });
        if (preset) break;
    }
    return preset;
}

function sendEvent(eventName, data) {
    const { minimizedPartyWindow, toolsBarWindow, autoForjaPlayWindow } = getWindows();
    if (autoForjaPlayWindow) {
        autoForjaPlayWindow.webContents.send(eventName, data);
        return;
    }
    if (minimizedPartyWindow) {
        minimizedPartyWindow.webContents.send(eventName, data);
    } else if (toolsBarWindow) {
        toolsBarWindow.webContents.send(eventName, data);
    }
    // if (websocketMirror) {
    //     websocketMirror.send(JSON.stringify({ type: eventName, data }));
    // }
}


export default startListenKeyEvents;
