/**
 * Constantes centralizadas do projeto bot-pw
 * Evita duplicação e facilita manutenção
 */

// Cores do tema
export const COLORS = {
    SUCCESS: '#2dce89',
    DANGER: '#f5365c',
    WARNING: '#fb6340',
    INFO: '#11cdef',
    PRIMARY: '#5e72e4',
    SECONDARY: '#11cdef',

    // Status
    RUNNING: '#43b581',
    STARTING: '#5e72e4',
    OFFLINE: '#747f8d'
};

// Canais IPC permitidos
export const IPC_CHANNELS = {
    // Servidores
    LOAD_SERVERS: 'load-servers',
    SAVE_SERVERS: 'save-servers',

    // Contas
    LOAD_ACCOUNTS: 'load-accounts',
    SAVE_ACCOUNTS: 'save-accounts',
    DELETE_ACCOUNTS: 'delete-accounts-file',

    // Jogo
    OPEN_ELEMENT: 'open-element',
    CLOSE_ELEMENT: 'close-element',
    FOCUS_WINDOW: 'focus-window',
    FIND_PW_WINDOWS: 'find-pw-windows',

    // Grupos
    LOAD_GROUPS: 'load-groups',
    SAVE_GROUPS: 'save-groups',
    OPEN_GROUP_OVERLAY: 'open-group-overlay',

    // Configurações
    SET_CYCLE_HOTKEY: 'set-cycle-hotkey',
    REGISTER_MACRO: 'register-macro',
    SELECT_EXE_FILE: 'select-exe-file',
    GET_APP_VERSION: 'get-app-version'
};

// Eventos que podem ser recebidos do main process
export const IPC_EVENTS = {
    ELEMENT_OPENED: 'element-opened',
    ELEMENT_CLOSED: 'element-closed'
};

// Classes de personagem comuns
export const CHARACTER_CLASSES = [
    'Guerreiro',
    'Mago',
    'Clérigo',
    'Arqueiro',
    'Mercenário',
    'Feiticeiro',
    'Bárbaro',
    'Espiritualista',
    'Místico',
    'Ceifador'
];

// Configurações padrão
export const DEFAULTS = {
    SERVER_NAME: 'Servidor Padrão',
    CYCLE_HOTKEY: 'Control+Shift+T',
    WINDOW_WIDTH: 1000,
    WINDOW_HEIGHT: 720,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600
};

// Mensagens de confirmação
export const CONFIRM_MESSAGES = {
    DELETE_ACCOUNT: 'Tem certeza que deseja deletar esta conta? Esta ação não pode ser desfeita.',
    DELETE_GROUP: 'Tem certeza que deseja deletar este grupo?',
    DELETE_SERVER: 'Tem certeza que deseja deletar este servidor? Todas as contas associadas serão perdidas.'
};
