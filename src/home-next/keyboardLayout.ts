export type KeyLegend = {
  id: string; label: string; shifted?: string; symbol?: string; icon?: string;
  width?: number; kind?: 'touch-id' | 'space' | 'arrow'; align?: 'left' | 'right';
};
const letters = (row: string): KeyLegend[] => [...row].map(label => ({ id: label, label }));
const pair = (label: string, shifted: string): KeyLegend => ({ id: label, label, shifted });
const functions = ['brightness-low', 'brightness-high', 'mission', 'search', 'microphone', 'moon', 'rewind', 'play', 'forward', 'mute', 'volume-low', 'volume-high'];

// ANSI MacBook layout, including the secondary symbols and full-height F row.
// Kept local: the earlier homepage's keyboard remains unchanged.
export const keyboardRows: KeyLegend[][] = [
  [{ id: 'escape', label: 'esc', width: 1.5, align: 'left' },
    ...functions.map((icon, i) => ({ id: `F${i + 1}`, label: `F${i + 1}`, icon })),
    { id: 'touch-id', label: '', kind: 'touch-id' }],
  [pair('`', '~'), ...[... '1234567890'].map((label, i) => pair(label, '!@#$%^&*()'[i])), pair('-', '_'), pair('=', '+'),
    { id: 'delete', label: '⌫', width: 1.5, align: 'right' }],
  [{ id: 'tab', label: '⇥', width: 1.5, align: 'left' }, ...letters('QWERTYUIOP'), pair('[', '{'), pair(']', '}'), pair('\\', '|')],
  [{ id: 'caps-lock', label: '⇪', width: 1.75, align: 'left' }, ...letters('ASDFGHJKL'), pair(';', ':'), pair("'", '"'),
    { id: 'return', label: '↩', width: 1.75, align: 'right' }],
  [{ id: 'shift-left', label: '⇧', width: 2.25, align: 'left' }, ...letters('ZXCVBNM'), pair(',', '<'), pair('.', '>'), pair('/', '?'),
    { id: 'shift-right', label: '⇧', width: 2.25, align: 'right' }],
  [{ id: 'fn', label: 'fn', icon: 'globe', align: 'left' },
    { id: 'control', label: 'control', symbol: '⌃', align: 'left' },
    { id: 'option-left', label: 'option', symbol: '⌥', align: 'left' },
    { id: 'command-left', label: 'command', symbol: '⌘', width: 1.25, align: 'left' },
    { id: 'space', label: '', width: 5, kind: 'space' },
    { id: 'command-right', label: 'command', symbol: '⌘', width: 1.25, align: 'right' },
    { id: 'option-right', label: 'option', symbol: '⌥', align: 'right' },
    { id: 'arrow-left', label: '◀', kind: 'arrow' }, { id: 'arrow-up', label: '▲', kind: 'arrow' },
    { id: 'arrow-down', label: '▼', kind: 'arrow' }, { id: 'arrow-right', label: '▶', kind: 'arrow' }],
];
export const keyLegends = new Map(keyboardRows.flat().map(key => [key.id, key]));
