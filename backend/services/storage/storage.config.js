import { app } from 'electron';

const CONFIGS = {
    filePath: app.getPath('userData'),
    folderName: 'PWHelper',
    accountsName: 'accounts.json',
    autoForjaName: 'auto-forja.json',
    serversName: 'servers.json',
    accountsGroupName: 'account-group.json',
    partiesName: 'parties.json',
    settingsName: 'settings.json',
    applicationName: 'pw-helper-settings.json'
}

export default CONFIGS;