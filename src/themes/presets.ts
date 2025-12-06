import type { Theme } from '../types';

export const espnTheme: Theme = {
  id: 'espn',
  name: 'ESPN',
  preset: 'espn',
  backgroundColor: '#1a1a1a',
  secondaryBackground: '#2a2a2a',
  accentColor: '#d00000',
  textColor: '#ffffff',
  textSecondary: '#888888',
  headerFont: 'Oswald',
  bodyFont: 'Source Sans 3',
  numberFont: 'Saira Condensed',
  borderRadius: '4px',
  scoreboardStyle: 'modern',
  layout: 'standard',
  baseScale: 1,
};

export const tntTheme: Theme = {
  id: 'tnt',
  name: 'TNT',
  preset: 'tnt',
  backgroundColor: '#0a0a1a',
  secondaryBackground: '#141428',
  accentColor: '#0077cc',
  textColor: '#ffffff',
  textSecondary: '#6688aa',
  headerFont: 'Oswald',
  bodyFont: 'Source Sans 3',
  numberFont: 'Barlow Condensed',
  borderRadius: '2px',
  scoreboardStyle: 'classic',
  layout: 'standard',
  baseScale: 1,
};

export const defaultTheme: Theme = {
  id: 'default',
  name: 'Default',
  preset: 'custom',
  backgroundColor: '#0f0f1a',
  secondaryBackground: '#1a1a2e',
  accentColor: '#ff6b35',
  textColor: '#ffffff',
  textSecondary: '#8888aa',
  headerFont: 'Oswald',
  bodyFont: 'Source Sans 3',
  numberFont: 'Teko',
  borderRadius: '8px',
  scoreboardStyle: 'modern',
  layout: 'standard',
  baseScale: 1,
};

export const presetThemes: Theme[] = [defaultTheme, espnTheme, tntTheme];

export function getThemeById(id: string, customThemes: Theme[] = []): Theme {
  const allThemes = [...presetThemes, ...customThemes];
  return allThemes.find(t => t.id === id) || defaultTheme;
}
