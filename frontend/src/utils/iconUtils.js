// Icon utility to load all class icons from assets folder
import AndarilhoIcon from '../assets/Andarilho.ico';
import ArcanoIcon from '../assets/Arcano.ico';
import ArqueiroIcon from '../assets/Arqueiro.ico';
import AtiradoraIcon from '../assets/Atiradora.ico';
import BarbaroIcon from '../assets/Barbaro.ico';
import BardoIcon from '../assets/Bardo.ico';
import EspiritualistaIcon from '../assets/Espiritualista.ico';
import FeiticeiraIcon from '../assets/Feiticeira.ico';
import GuerreiroIcon from '../assets/Guerreiro.ico';
import MagoIcon from '../assets/Mago.ico';
import MercenarioIcon from '../assets/Mercenario.ico';
import MisticoIcon from '../assets/Mistico.ico';
import PaladinoIcon from '../assets/Paladino.ico';
import RetalhadorIcon from '../assets/Retalhador.ico';
import SacerdoteIcon from '../assets/Sacerdote.ico';
import TormentadorIcon from '../assets/Tormentador.ico';
import ClassIconArcher from '../assets/ClassIcon_Archer.ico';

export const CLASS_ICONS = [
    { name: 'Andarilho', path: AndarilhoIcon },
    { name: 'Arcano', path: ArcanoIcon },
    { name: 'Arqueiro', path: ArqueiroIcon },
    { name: 'Atiradora', path: AtiradoraIcon },
    { name: 'Bárbaro', path: BarbaroIcon },
    { name: 'Bardo', path: BardoIcon },
    { name: 'Espiritualista', path: EspiritualistaIcon },
    { name: 'Feiticeira', path: FeiticeiraIcon },
    { name: 'Guerreiro', path: GuerreiroIcon },
    { name: 'Mago', path: MagoIcon },
    { name: 'Mercenário', path: MercenarioIcon },
    { name: 'Místico', path: MisticoIcon },
    { name: 'Paladino', path: PaladinoIcon },
    { name: 'Retalhador', path: RetalhadorIcon },
    { name: 'Sacerdote', path: SacerdoteIcon },
    { name: 'Tormentador', path: TormentadorIcon },
    { name: 'Archer', path: ClassIconArcher }
];

// Get icon path by name
export const getIconPath = (iconName) => {
    const icon = CLASS_ICONS.find(i => i.name === iconName);
    return icon ? icon.path : null;
};

// Get icon name from path
export const getIconName = (iconPath) => {
    const icon = CLASS_ICONS.find(i => i.path === iconPath);
    return icon ? icon.name : null;
};
