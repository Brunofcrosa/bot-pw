const { VK_MAP, VK_TO_KEY } = require('../constants');

// Mapeamento de Key Name -> VK Code (gerado a partir do VK_MAP)
const KEY_TO_VK = Object.fromEntries(
    Object.entries(VK_MAP).map(([key, vk]) => [key, vk])
);


class MacroService {
    constructor(windowService, keyListenerService) {
        this.windowService = windowService;
        this.keyListenerService = keyListenerService;
        this.activeMacros = new Map();

        this.initListener();
    }

    initListener() {
        this.keyListenerService.on('key-event', (event) => {
            if (event.state === 'down') {
                this.checkAndExecute(event.vk);
            }
        });
    }

    registerMacro(pid, triggerKeyName, sequence, interval = 200) {
        const triggerVk = KEY_TO_VK[triggerKeyName.toUpperCase()];

        if (!triggerVk) {
            console.error(`Tecla desconhecida: ${triggerKeyName}`);
            return { success: false, error: 'Tecla inválida' };
        }

        this.activeMacros.set(pid, { triggerVk, sequence, interval });
        console.log(`Macro registrado via KeyListener: ${triggerKeyName}(${triggerVk}) -> PID ${pid}`);

        return { success: true };
    }

    async checkAndExecute(pressedVk) {
        for (const [pid, config] of this.activeMacros.entries()) {
            if (config.triggerVk === pressedVk) {
                console.log(`Gatilho detectado (${pressedVk}) para PID ${pid}`);
                this.windowService.sendKeySequence(pid, config.sequence, config.interval).catch(console.error);
            }
        }
    }

    listMacros() {
        const list = [];
        for (const [pid, config] of this.activeMacros.entries()) {
            list.push({
                pid,
                triggerVk: config.triggerVk,
                sequence: config.sequence,
                interval: config.interval
            });
        }
        return list;
    }

    unregisterAll() {
        this.activeMacros.clear();
        console.log('Todas as macros foram removidas.');
        return { success: true };
    }
}

module.exports = MacroService;
