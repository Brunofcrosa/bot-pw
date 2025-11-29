// backend/services/MacroService.js

// Mapa reverso de VK Code (Numérico) para Nomes de Teclas (String) para facilitar configuração
// Ex: 123 -> 'F12'
const VK_TO_KEY = {
    112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6',
    118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
    49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 
    54: '6', 55: '7', 56: '8', 57: '9', 48: '0'
    // Adicione mais conforme necessário
};

// Mapa Reverso para input (String -> VK)
const KEY_TO_VK = Object.fromEntries(Object.entries(VK_TO_KEY).map(([k, v]) => [v, parseInt(k)]));

class MacroService {
    constructor(windowService, keyListenerService) {
        this.windowService = windowService;
        this.keyListenerService = keyListenerService;
        this.activeMacros = new Map(); // PID -> { triggerVk: 123, sequence: [...], interval: 200 }
        
        this.initListener();
    }

    initListener() {
        // Escuta os eventos brutos do executável
        this.keyListenerService.on('key-event', (event) => {
            // Só nos importamos quando a tecla é pressionada ('down')
            if (event.state === 'down') {
                this.checkAndExecute(event.vk);
            }
        });
    }

    registerMacro(pid, triggerKeyName, sequence, interval = 200) {
        const triggerVk = KEY_TO_VK[triggerKeyName.toUpperCase()];

        if (!triggerVk) {
            console.error(`[MacroService] Tecla desconhecida: ${triggerKeyName}`);
            return { success: false, error: 'Tecla inválida' };
        }

        this.activeMacros.set(pid, { triggerVk, sequence, interval });
        console.log(`[MacroService] Macro registrado via KeyListener: ${triggerKeyName}(${triggerVk}) -> PID ${pid}`);
        
        return { success: true };
    }

    async checkAndExecute(pressedVk) {
        // Verifica se alguma conta ativa tem esse VK configurado como gatilho
        for (const [pid, config] of this.activeMacros.entries()) {
            if (config.triggerVk === pressedVk) {
                console.log(`[MacroService] Gatilho detectado (${pressedVk}) para PID ${pid}`);
                // Executa a sequência (sem await para não bloquear o listener)
                this.windowService.sendKeySequence(pid, config.sequence, config.interval).catch(console.error);
            }
        }
    }

    unregisterAll() {
        this.activeMacros.clear();
    }
}

module.exports = MacroService;