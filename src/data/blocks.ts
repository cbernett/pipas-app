export type BlockCategory = 'Movimento' | 'Luz' | 'Som' | 'Eventos' | 'Controle';

export interface BlockDef {
  id: string;
  label: string;
  category: BlockCategory;
}

export const CATEGORY_COLORS: Record<BlockCategory, string> = {
  Movimento: '#5F95F7',
  Luz: '#9268F6',
  Som: '#C763D0',
  Eventos: '#F8D748',
  Controle: '#F3AF43',
};

export const BLOCKS: BlockDef[] = [
  // Movimento
  { id: 'mov_1', label: 'mova 10 passos', category: 'Movimento' },
  { id: 'mov_2', label: 'gire 15 graus', category: 'Movimento' },
  { id: 'mov_3', label: 'mude x em 10', category: 'Movimento' },
  { id: 'mov_4', label: 'mude y em 10', category: 'Movimento' },
  { id: 'mov_5', label: 'vá para posição inicial', category: 'Movimento' },
  // Luz
  { id: 'luz_1', label: 'quando toque 1', category: 'Luz' },
  { id: 'luz_2', label: 'quando toque 2', category: 'Luz' },
  { id: 'luz_3', label: 'quando toque 3', category: 'Luz' },
  { id: 'luz_4', label: 'ligue LED', category: 'Luz' },
  { id: 'luz_5', label: 'desligue LED', category: 'Luz' },
  { id: 'luz_6', label: 'pisque LED', category: 'Luz' },
  { id: 'luz_7', label: 'ligue motor', category: 'Luz' },
  { id: 'luz_8', label: 'desligue motor', category: 'Luz' },
  // Som
  { id: 'som_1', label: 'toque som', category: 'Som' },
  { id: 'som_2', label: 'pare todos os sons', category: 'Som' },
  { id: 'som_3', label: 'grave som', category: 'Som' },
  // Eventos
  { id: 'evt_1', label: 'quando iniciar', category: 'Eventos' },
  { id: 'evt_2', label: 'quando receber mensagem', category: 'Eventos' },
  { id: 'evt_3', label: 'envie mensagem', category: 'Eventos' },
  // Controle
  { id: 'ctrl_1', label: 'espere', category: 'Controle' },
  { id: 'ctrl_2', label: 'repita', category: 'Controle' },
  { id: 'ctrl_3', label: 'sempre', category: 'Controle' },
  { id: 'ctrl_4', label: 'se então', category: 'Controle' },
];
