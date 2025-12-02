let partiesWindow = null;
let mainWindow = null;
let authWindow = null;
let autoForjaWindow = null;
let autoForjaPlayerWindow = null;
let autoForjaConfig = null;
let minimizedPartyWindow = null;
let updateWindow = null;
let toolsBarWindow = null;
let websocketMirror = null;
let runningFocusBatchProcess = null;
let runningBackgroundFocusBatchProcess = null;
let runningFocusByPidProcess = null;
let runningAutoForjaProccess = null;
let crashWindows = [];
let listenKeyEvent = null;
let alwaysOnTopTimerMinimizedPartyWindow = null;
let alwaysOnTopTimerToolsBar = null;
let hwid = null;
let oldHwid = null;
let pixWindow = null;
let paypalWindow = null;
let checkProSubscriptionInterval = null;
let scriptClickMirror = null;

export let dirname = null;

export function setPartiesWindow(main) {
    partiesWindow = main;
}

export function setMinimizedPartiesWindow(minimized) {
    minimizedPartyWindow = minimized;
}

export function setAlwaysOnTopTimerMinimizedPartyWindow(timer) {
    alwaysOnTopTimerMinimizedPartyWindow = timer;
}

export function getAlwaysOnTopTimerMinimizedPartyWindow() {
    return alwaysOnTopTimerMinimizedPartyWindow;
}

export function setAuthWindow(window) {
    authWindow = window;
}

export function setDirName(name) {
    dirname = name;
}

export function setPixWindow(window) {
    pixWindow = window;
}

export function setPaypalWindow(window) {
    paypalWindow = window;
}

export function setAlwaysOnTopTimerToolsBar(timer) {
    alwaysOnTopTimerToolsBar = timer;
}

export function getAlwaysOnTopTimerToolsBar() {
    return alwaysOnTopTimerToolsBar;
}

export function setToolsBarWindow(window) {
    toolsBarWindow = window;
}

export function setUpdateWindow(update) {
    updateWindow = update;
}

export function setMainWindow(update) {
    mainWindow = update;
}

export function setAutoForjaWindow(window) {
    autoForjaWindow = window;
}

export function setAutoForjaPlayWindow(window) {
    autoForjaPlayerWindow = window;
}

export function addCrashWindow(window) {
    crashWindows.push(window);
}

export function removeCrashWindow(window) {
    crashWindows = crashWindows.filter((w) => w.id !== Number(window.id));
}

export function getWindows() {
    return { partiesWindow, minimizedPartyWindow, updateWindow, mainWindow, crashWindows, toolsBarWindow, authWindow, pixWindow, paypalWindow, autoForjaWindow, autoForjaPlayWindow: autoForjaPlayerWindow };
}

export function getCurrentWindows() {
    return { partiesWindow, minimizedPartyWindow };
}

export function setWebsocketMirror(websocket) {
    websocketMirror = websocket;
}

export function getWebsocketMirror(websocket) {
    return websocketMirror;
}

export function setRunningProccessBatch(proccess) {
    runningFocusBatchProcess = proccess;
}

export function getRunningProccessBatch() {
    return runningFocusBatchProcess;
}

export function setRunningAutoForjaProccess(proccess) {
    runningAutoForjaProccess = proccess;
}

export function getRunningAutoForjaProccess() {
    return runningAutoForjaProccess;
}

export function setRunningBackgroundProccessBatch(proccess) {
    runningBackgroundFocusBatchProcess = proccess;
}

export function getRunningBackgroundProccessBatch() {
    return runningBackgroundFocusBatchProcess;
}

export function setRunningFocusByPidProccess(proccess) {
    runningFocusByPidProcess = proccess;
}

export function getRunningFocusByPidProccess() {
    return runningFocusByPidProcess;
}

export function setListenKeyEvent(event) {
    listenKeyEvent = event;
}

export function getListenKeyEvent() {
    return listenKeyEvent;
}

export function setSharedHwid(data) {
    hwid = data;
}

export function getSharedHwid() {
    return hwid;
}

export function setSharedOldHwid(data) {
    oldHwid = data;
}

export function getSharedOldHwid() {
    return oldHwid;
}

export function setCheckProSubscriptionInterval(event) {
    checkProSubscriptionInterval = event;
}

export function getCheckProSubscriptionInterval() {
    return checkProSubscriptionInterval;
}

export function setScriptClickMirror(script) {
    scriptClickMirror = script;
}

export function getScriptClickMirror() {
    return scriptClickMirror;
}