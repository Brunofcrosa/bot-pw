/**
 * Constantes compartilhadas do backend
 */

// Nome do processo alvo
const TARGET_PROCESS_NAME = 'ElementClient_64.exe';

// Mapeamento de Virtual Keys do Windows
const VK_MAP = {
    // Teclas de função
    'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73,
    'F5': 0x74, 'F6': 0x75, 'F7': 0x76, 'F8': 0x77,
    'F9': 0x78, 'F10': 0x79, 'F11': 0x7A, 'F12': 0x7B,

    // Números
    '0': 0x30, '1': 0x31, '2': 0x32, '3': 0x33, '4': 0x34,
    '5': 0x35, '6': 0x36, '7': 0x37, '8': 0x38, '9': 0x39,

    // Teclas especiais
    'ENTER': 0x0D,
    'ESCAPE': 0x1B,
    'SPACE': 0x20,
    'TAB': 0x09,

    // Letras (A-Z)
    'A': 0x41, 'B': 0x42, 'C': 0x43, 'D': 0x44, 'E': 0x45,
    'F': 0x46, 'G': 0x47, 'H': 0x48, 'I': 0x49, 'J': 0x4A,
    'K': 0x4B, 'L': 0x4C, 'M': 0x4D, 'N': 0x4E, 'O': 0x4F,
    'P': 0x50, 'Q': 0x51, 'R': 0x52, 'S': 0x53, 'T': 0x54,
    'U': 0x55, 'V': 0x56, 'W': 0x57, 'X': 0x58, 'Y': 0x59, 'Z': 0x5A
};

// Hotkey padrão para ciclar janelas
const DEFAULT_CYCLE_HOTKEY = 'Control+Shift+T';

// Configurações de janela
const WINDOW_CONFIG = {
    WIDTH: 1000,
    HEIGHT: 720,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    BACKGROUND_COLOR: '#1e1e24'
};

// Mapeamento inverso: VK Code -> Key Name
const VK_TO_KEY = Object.fromEntries(
    Object.entries(VK_MAP).map(([key, vk]) => [vk, key])
);

module.exports = {
    TARGET_PROCESS_NAME,
    VK_MAP,
    VK_TO_KEY,
    DEFAULT_CYCLE_HOTKEY,
    WINDOW_CONFIG
};
