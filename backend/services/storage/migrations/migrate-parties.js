import * as partyStorage from '../parties.storage.js'

export function migratePartiesData() {
    const parties = partyStorage.get();
    if (!parties.success || !parties.response.length) {
        console.log("[MIGRAÇÃO] Nenhum dado de parties encontrado para migração.");
        return;
    }
    let isMigrated = false;
    parties.response.forEach((party) => {
        const presets = party.presets.presets.filter((preset) => preset.commands.some((e) => e.id));
        if (presets.length) {
            isMigrated = true;
            presets.forEach((preset) => {
                preset.commands = preset.commands.map((command) => {
                    return {
                        isGroup: false,
                        simpleCommand: {
                            id: command.id || UtilsService.guid,
                            characterId: command.characterId || '',
                            key: command.key || '',
                            delay: command.delay || 0,
                            enableFocus: command.enableFocus || false,
                            characterWarning: command.characterWarning || false,
                        }
                    };
                });
            });
            party.presets.mainPreset = party.presets.presets[0];
            party.presets.secondaryPreset = party.presets.presets.slice(1);
        }
    });
    partyStorage.set(parties.response);
    if (!isMigrated) {
        console.log("[MIGRAÇÃO] Nenhum dado de parties encontrado para migração.");
        return;
    }
    console.log("[MIGRAÇÃO] Dados de parties migrados com sucesso.");
}

export default {}