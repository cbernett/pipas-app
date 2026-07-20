export type BlockCategory = 'Movimento' | 'Luz' | 'Som' | 'Eventos' | 'Controle';

export interface BlockDef {
  id: string;
  label: string;
  category: BlockCategory;
}

export const CATEGORY_COLORS: Record<BlockCategory, string> = {
  Movimento: '#5F95F7',
  Luz:       '#9268F6',
  Som:       '#C763D0',
  Eventos:   '#F8A030',
  Controle:  '#F3AF43',
};

export const CATEGORY_DARK: Record<BlockCategory, string> = {
  Movimento: '#4A7FE0',
  Luz:       '#7A52DB',
  Som:       '#A94DB8',
  Eventos:   '#D4821A',
  Controle:  '#D4922A',
};

export interface BlockParamDef {
  type: 'number' | 'dropdown';
  value: string;
  options?: string[];
}
export type BlockPartDef = string | BlockParamDef;

const TOUCH_OPTS  = ['toque 1', 'toque 2', 'toque 3'];
const LED_OPTS    = ['1', '2'];
const MOTOR_OPTS  = ['1', '2'];
const SOUND_OPTS  = ['meow!', 'bah!', 'cheer', 'erro', 'menu', 'laser', 'boing', 'tambor', 'sino', 'foguete', 'moeda', 'alarme', 'vitoria', 'splash', 'buzzer'];
const STATE_OPTS  = ['ligado', 'desligado'];
const DEVICE_OPTS = ['LED 1', 'LED 2', 'motor 1', 'motor 2'];

export const BLOCK_TEMPLATES: Record<string, BlockPartDef[]> = {
  mov_1: ['mova ', { type: 'number', value: '10' }, ' passos'],
  mov_2: ['gire ', { type: 'number', value: '15' }, ' graus'],
  mov_3: ['mude x em ', { type: 'number', value: '10' }],
  mov_4: ['mude y em ', { type: 'number', value: '10' }],
  mov_5: ['vá para posição inicial'],
  luz_4: ['ligue LED ',    { type: 'dropdown', value: '1', options: LED_OPTS }],
  luz_5: ['desligue LED ', { type: 'dropdown', value: '1', options: LED_OPTS }],
  luz_6: ['pisque LED ',   { type: 'dropdown', value: '1', options: LED_OPTS }],
  luz_9:  ['defina LED ', { type: 'dropdown', value: '1', options: LED_OPTS }, ' velocidade ', { type: 'number', value: '100' }, ' %'],
  luz_10: ['mude a velocidade do LED ', { type: 'dropdown', value: '1', options: LED_OPTS }, ' por ', { type: 'number', value: '10' }],
  luz_11: ['pulse LED ', { type: 'dropdown', value: '1', options: LED_OPTS }, ' por ', { type: 'number', value: '3' }, ' vezes'],
  luz_12: ['mude o brilho do LED ', { type: 'dropdown', value: '1', options: LED_OPTS }, ' para ', { type: 'number', value: '100' }, ' %'],
  luz_7: ['ligue motor ',    { type: 'dropdown', value: '1', options: MOTOR_OPTS }],
  luz_8: ['desligue motor ', { type: 'dropdown', value: '1', options: MOTOR_OPTS }],
  mov_6: ['defina motor ', { type: 'dropdown', value: '1', options: MOTOR_OPTS }, ' velocidade ', { type: 'number', value: '100' }, ' %'],
  mov_7: ['ligue motor ', { type: 'dropdown', value: '1', options: MOTOR_OPTS }, ' por ', { type: 'number', value: '1' }, ' segundo(s)'],
  mov_8: ['pulse motor ', { type: 'dropdown', value: '1', options: MOTOR_OPTS }],
  som_1: ['toque som ',       { type: 'dropdown', value: 'meow!', options: SOUND_OPTS }],
  som_4: ['toque até parar ', { type: 'dropdown', value: 'meow!', options: SOUND_OPTS }],
  som_2: ['pare todos os sons'],
  som_5: ['mude volume em ',    { type: 'number', value: '-10' }],
  som_6: ['mude o volume para ', { type: 'number', value: '100' }, ' %'],
  evt_touch_1: ['quando eu receber ', { type: 'dropdown', value: 'toque 1', options: TOUCH_OPTS }],
  evt_touch_2: ['quando eu receber ', { type: 'dropdown', value: 'toque 2', options: TOUCH_OPTS }],
  evt_touch_3: ['quando eu receber ', { type: 'dropdown', value: 'toque 3', options: TOUCH_OPTS }],
  // backward-compat
  luz_1: ['quando eu receber ', { type: 'dropdown', value: 'toque 1', options: TOUCH_OPTS }],
  luz_2: ['quando eu receber ', { type: 'dropdown', value: 'toque 2', options: TOUCH_OPTS }],
  luz_3: ['quando eu receber ', { type: 'dropdown', value: 'toque 3', options: TOUCH_OPTS }],
  evt_touch: ['quando eu receber ', { type: 'dropdown', value: 'toque 1', options: TOUCH_OPTS }],
  evt_1: ['quando iniciar'],
  ctrl_1:  ['espere ', { type: 'number', value: '1' }, ' segundo'],
  ctrl_1b: ['espere ', { type: 'number', value: '0.2' }, ' segundo'],
  ctrl_2:  ['repita ', { type: 'number', value: '10' }, ' vezes'],
  ctrl_3:  ['sempre'],
  ctrl_4:  ['se ', { type: 'dropdown', value: 'LED 1', options: DEVICE_OPTS }, ' está ', { type: 'dropdown', value: 'ligado', options: STATE_OPTS }, ' então'],
  ctrl_5:  ['se ', { type: 'dropdown', value: 'LED 1', options: DEVICE_OPTS }, ' está ', { type: 'dropdown', value: 'ligado', options: STATE_OPTS }, ' então'],
};

export interface WorkspaceBlock {
  id: string; defId: string; label: string; category: string; color: string;
  innerBlocks?: WorkspaceBlock[];
  elseBlocks?: WorkspaceBlock[];
}

/** A stack is a group of connected blocks at a position on the canvas */
export interface BlockStack {
  id: string;
  x: number;
  y: number;
  blocks: WorkspaceBlock[];
}

export const EXAMPLE_STACKS: BlockStack[] = [
  {
    id: 'example_stack',
    x: 32,
    y: 32,
    blocks: [
      { id: 'ex_1', defId: 'evt_touch_1', category: 'Eventos',  color: CATEGORY_COLORS['Eventos'],  label: 'quando eu receber toque 1' },
      { id: 'ex_2', defId: 'som_1',       category: 'Som',      color: CATEGORY_COLORS['Som'],      label: 'toque som meow!' },
      { id: 'ex_3', defId: 'ctrl_1',      category: 'Controle', color: CATEGORY_COLORS['Controle'], label: 'espere 1 segundo' },
      { id: 'ex_4', defId: 'luz_4',       category: 'Luz',      color: CATEGORY_COLORS['Luz'],      label: 'ligue LED 1' },
    ],
  },
];

// Keep EXAMPLE_PROGRAM for backward compat with RunButton / AppContext
export const EXAMPLE_PROGRAM = EXAMPLE_STACKS[0].blocks;

export const BLOCKS: BlockDef[] = [
  { id: 'luz_7', label: 'ligue motor 1',              category: 'Movimento' },
  { id: 'luz_8', label: 'desligue motor 1',           category: 'Movimento' },
  { id: 'mov_6', label: 'defina velocidade do motor', category: 'Movimento' },
  { id: 'mov_7', label: 'ligue motor por segundos',   category: 'Movimento' },
  { id: 'mov_8', label: 'pulse motor',                category: 'Movimento' },
  { id: 'luz_4', label: 'ligue LED',                category: 'Luz' },
  { id: 'luz_5', label: 'desligue LED',             category: 'Luz' },
  { id: 'luz_6', label: 'pisque LED',               category: 'Luz' },
  { id: 'luz_9',  label: 'defina velocidade do LED',  category: 'Luz' },
  { id: 'luz_10', label: 'mude velocidade do LED',   category: 'Luz' },
  { id: 'luz_11', label: 'pulse LED',                category: 'Luz' },
  { id: 'luz_12', label: 'mude o brilho do LED',    category: 'Luz' },
  { id: 'som_1', label: 'toque som',                category: 'Som' },
  { id: 'som_4', label: 'toque até parar',          category: 'Som' },
  { id: 'som_2', label: 'pare todos os sons',       category: 'Som' },
  { id: 'som_5', label: 'mude volume em',           category: 'Som' },
  { id: 'som_6', label: 'mude o volume para',       category: 'Som' },
  { id: 'evt_touch_1', label: 'quando eu receber toque 1', category: 'Eventos' },
  { id: 'evt_1', label: 'quando iniciar',            category: 'Eventos' },
  { id: 'ctrl_1', label: 'espere',   category: 'Controle' },
  { id: 'ctrl_2', label: 'repita',   category: 'Controle' },
  { id: 'ctrl_3', label: 'sempre',   category: 'Controle' },
  { id: 'ctrl_4', label: 'se … então',        category: 'Controle' },
  { id: 'ctrl_5', label: 'se … então / senão', category: 'Controle' },
];
