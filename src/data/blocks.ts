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

const TOUCH_OPTS = ['toque 1', 'toque 2', 'toque 3'];
const LED_OPTS   = ['1', '2', '3'];
const SOUND_OPTS = ['meow!', 'bah!', 'cheer', 'erro', 'menu'];

export const BLOCK_TEMPLATES: Record<string, BlockPartDef[]> = {
  mov_1: ['mova ', { type: 'number', value: '10' }, ' passos'],
  mov_2: ['gire ', { type: 'number', value: '15' }, ' graus'],
  mov_3: ['mude x em ', { type: 'number', value: '10' }],
  mov_4: ['mude y em ', { type: 'number', value: '10' }],
  mov_5: ['vá para posição inicial'],
  luz_4: ['ligue LED ',    { type: 'dropdown', value: '1', options: LED_OPTS }],
  luz_5: ['desligue LED ', { type: 'dropdown', value: '1', options: LED_OPTS }],
  luz_6: ['pisque LED ',   { type: 'dropdown', value: '1', options: LED_OPTS }],
  luz_7: ['ligue motor'],
  luz_8: ['desligue motor'],
  som_1: ['toque som ',       { type: 'dropdown', value: 'meow!', options: SOUND_OPTS }],
  som_4: ['toque até parar ', { type: 'dropdown', value: 'meow!', options: SOUND_OPTS }],
  som_2: ['pare todos os sons'],
  som_3: ['grave som'],
  evt_touch_1: ['quando eu receber ', { type: 'dropdown', value: 'toque 1', options: TOUCH_OPTS }],
  evt_touch_2: ['quando eu receber ', { type: 'dropdown', value: 'toque 2', options: TOUCH_OPTS }],
  evt_touch_3: ['quando eu receber ', { type: 'dropdown', value: 'toque 3', options: TOUCH_OPTS }],
  // backward-compat
  luz_1: ['quando eu receber ', { type: 'dropdown', value: 'toque 1', options: TOUCH_OPTS }],
  luz_2: ['quando eu receber ', { type: 'dropdown', value: 'toque 2', options: TOUCH_OPTS }],
  luz_3: ['quando eu receber ', { type: 'dropdown', value: 'toque 3', options: TOUCH_OPTS }],
  evt_touch: ['quando eu receber ', { type: 'dropdown', value: 'toque 1', options: TOUCH_OPTS }],
  evt_1: ['quando iniciar'],
  evt_2: ['quando receber ', { type: 'dropdown', value: 'mensagem' }],
  evt_3: ['envie mensagem'],
  ctrl_1:  ['espere ', { type: 'number', value: '1' }, ' segundo'],
  ctrl_1b: ['espere ', { type: 'number', value: '0.2' }, ' segundo'],
  ctrl_2:  ['repita ', { type: 'number', value: '10' }, ' vezes'],
  ctrl_3:  ['sempre'],
  ctrl_4:  ['se ', { type: 'dropdown', value: 'então', options: ['então', 'senão'] }],
};

export interface WorkspaceBlock {
  id: string; defId: string; label: string; category: string; color: string;
  innerBlocks?: WorkspaceBlock[];
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
  { id: 'luz_7', label: 'ligue motor',              category: 'Movimento' },
  { id: 'luz_8', label: 'desligue motor',           category: 'Movimento' },
  { id: 'luz_4', label: 'ligue LED',                category: 'Luz' },
  { id: 'luz_5', label: 'desligue LED',             category: 'Luz' },
  { id: 'luz_6', label: 'pisque LED',               category: 'Luz' },
  { id: 'som_1', label: 'toque som',                category: 'Som' },
  { id: 'som_4', label: 'toque até parar',          category: 'Som' },
  { id: 'som_2', label: 'pare todos os sons',       category: 'Som' },
  { id: 'som_3', label: 'grave som',                category: 'Som' },
  { id: 'evt_touch_1', label: 'quando eu receber toque 1', category: 'Eventos' },
  { id: 'evt_1', label: 'quando iniciar',            category: 'Eventos' },
  { id: 'evt_2', label: 'quando receber mensagem',   category: 'Eventos' },
  { id: 'evt_3', label: 'envie mensagem',            category: 'Eventos' },
  { id: 'ctrl_1', label: 'espere',   category: 'Controle' },
  { id: 'ctrl_2', label: 'repita',   category: 'Controle' },
  { id: 'ctrl_3', label: 'sempre',   category: 'Controle' },
  { id: 'ctrl_4', label: 'se então', category: 'Controle' },
];
