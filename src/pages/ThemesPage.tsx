import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Theme } from '../types';
import { presetThemes } from '../themes/presets';

export function ThemesPage() {
  const {
    currentTheme,
    allThemes,
    setCurrentTheme,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    settings,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [formData, setFormData] = useState<Partial<Theme>>({});

  const isPreset = (themeId: string) => presetThemes.some(t => t.id === themeId);

  const handleCreateNew = () => {
    setFormData({
      name: 'My Custom Theme',
      preset: 'custom',
      backgroundColor: '#0f0f1a',
      secondaryBackground: '#1a1a2e',
      accentColor: '#ff6b35',
      textColor: '#ffffff',
      textSecondary: '#8888aa',
      headerFont: 'Oswald',
      bodyFont: 'Source Sans 3',
      borderRadius: '8px',
      scoreboardStyle: 'modern',
    });
    setEditingTheme(null);
    setIsEditing(true);
  };

  const handleEditTheme = (theme: Theme) => {
    setFormData({ ...theme });
    setEditingTheme(theme);
    setIsEditing(true);
  };

  const handleSaveTheme = () => {
    if (!formData.name) return;

    if (editingTheme) {
      updateCustomTheme(editingTheme.id, formData);
    } else {
      addCustomTheme(formData as Omit<Theme, 'id'>);
    }
    setIsEditing(false);
    setEditingTheme(null);
  };

  const handleDeleteTheme = (themeId: string) => {
    deleteCustomTheme(themeId);
  };

  const ThemePreview = ({ theme, isActive }: { theme: Theme; isActive: boolean }) => (
    <div
      className={`rounded-xl overflow-hidden transition-all cursor-pointer ${
        isActive ? 'ring-2 ring-offset-2 ring-offset-transparent scale-[1.02]' : 'hover:scale-[1.02]'
      }`}
      style={{
        backgroundColor: theme.secondaryBackground,
        borderRadius: theme.borderRadius,
        ringColor: theme.accentColor,
      }}
      onClick={() => setCurrentTheme(theme.id)}
    >
      {/* Mini Scoreboard Preview */}
      <div className="p-4" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: theme.accentColor }}
            >
              24
            </div>
            <span className="text-xs font-bold" style={{ color: theme.textColor, fontFamily: theme.headerFont }}>
              HOME
            </span>
          </div>
          <span className="text-xs" style={{ color: theme.textSecondary }}>
            Q2
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: theme.textColor, fontFamily: theme.headerFont }}>
              AWAY
            </span>
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: '#2563eb' }}
            >
              21
            </div>
          </div>
        </div>
        <div
          className="h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          <div className="flex gap-2">
            {['PTS', 'REB', 'AST'].map(stat => (
              <span key={stat} className="text-[10px]" style={{ color: theme.textSecondary }}>
                {stat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Info */}
      <div className="p-4" style={{ backgroundColor: theme.secondaryBackground }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold" style={{ color: theme.textColor, fontFamily: theme.headerFont }}>
            {theme.name}
          </span>
          {isActive && (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: theme.accentColor, color: '#fff' }}
            >
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.backgroundColor }} title="Background" />
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondaryBackground }} title="Secondary" />
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accentColor }} title="Accent" />
          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: theme.textColor, borderColor: theme.textSecondary }} title="Text" />
        </div>

        {/* Actions for custom themes */}
        {!isPreset(theme.id) && (
          <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: theme.textSecondary + '20' }}>
            <button
              onClick={e => {
                e.stopPropagation();
                handleEditTheme(theme);
              }}
              className="flex-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: theme.accentColor + '20',
                color: theme.accentColor,
              }}
            >
              Edit
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                handleDeleteTheme(theme.id);
              }}
              className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 text-center sm:text-left">
        <div>
          <h1
            className="text-3xl font-bold tracking-wide mb-2"
            style={{ fontFamily: currentTheme.headerFont }}
          >
            THEMES
          </h1>
          <p style={{ color: currentTheme.textSecondary }}>
            Choose a broadcast style or create your own
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
          style={{
            backgroundColor: currentTheme.accentColor,
            color: '#fff',
            borderRadius: currentTheme.borderRadius,
            fontFamily: currentTheme.headerFont,
          }}
        >
          <span className="text-xl">+</span>
          NEW THEME
        </button>
      </div>

      {/* Preset Themes */}
      <div className="mb-10">
        <h2
          className="text-xl font-bold mb-4"
          style={{ fontFamily: currentTheme.headerFont, color: currentTheme.textSecondary }}
        >
          BROADCAST PRESETS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presetThemes.map(theme => (
            <ThemePreview
              key={theme.id}
              theme={theme}
              isActive={settings.currentTheme === theme.id}
            />
          ))}
        </div>
      </div>

      {/* Custom Themes */}
      {settings.customThemes.length > 0 && (
        <div>
          <h2
            className="text-xl font-bold mb-4"
            style={{ fontFamily: currentTheme.headerFont, color: currentTheme.textSecondary }}
          >
            CUSTOM THEMES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {settings.customThemes.map(theme => (
              <ThemePreview
                key={theme.id}
                theme={theme}
                isActive={settings.currentTheme === theme.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Theme Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditing(false)}
          />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6"
            style={{ backgroundColor: currentTheme.secondaryBackground }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{ fontFamily: currentTheme.headerFont }}
            >
              {editingTheme ? 'EDIT THEME' : 'CREATE THEME'}
            </h2>

            <div className="space-y-6">
              {/* Theme Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                  Theme Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                  style={{
                    backgroundColor: currentTheme.backgroundColor,
                    borderColor: currentTheme.textSecondary + '40',
                    color: currentTheme.textColor,
                  }}
                />
              </div>

              {/* Colors Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.backgroundColor || '#000000'}
                      onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-12 h-12"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor || ''}
                      onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      style={{
                        backgroundColor: currentTheme.backgroundColor,
                        borderColor: currentTheme.textSecondary + '40',
                        color: currentTheme.textColor,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                    Secondary Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.secondaryBackground || '#000000'}
                      onChange={e => setFormData({ ...formData, secondaryBackground: e.target.value })}
                      className="w-12 h-12"
                    />
                    <input
                      type="text"
                      value={formData.secondaryBackground || ''}
                      onChange={e => setFormData({ ...formData, secondaryBackground: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      style={{
                        backgroundColor: currentTheme.backgroundColor,
                        borderColor: currentTheme.textSecondary + '40',
                        color: currentTheme.textColor,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accentColor || '#000000'}
                      onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-12 h-12"
                    />
                    <input
                      type="text"
                      value={formData.accentColor || ''}
                      onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      style={{
                        backgroundColor: currentTheme.backgroundColor,
                        borderColor: currentTheme.textSecondary + '40',
                        color: currentTheme.textColor,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.textColor || '#ffffff'}
                      onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-12 h-12"
                    />
                    <input
                      type="text"
                      value={formData.textColor || ''}
                      onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      style={{
                        backgroundColor: currentTheme.backgroundColor,
                        borderColor: currentTheme.textSecondary + '40',
                        color: currentTheme.textColor,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                    Secondary Text
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.textSecondary || '#888888'}
                      onChange={e => setFormData({ ...formData, textSecondary: e.target.value })}
                      className="w-12 h-12"
                    />
                    <input
                      type="text"
                      value={formData.textSecondary || ''}
                      onChange={e => setFormData({ ...formData, textSecondary: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      style={{
                        backgroundColor: currentTheme.backgroundColor,
                        borderColor: currentTheme.textSecondary + '40',
                        color: currentTheme.textColor,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                    Border Radius
                  </label>
                  <select
                    value={formData.borderRadius || '8px'}
                    onChange={e => setFormData({ ...formData, borderRadius: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none cursor-pointer"
                    style={{
                      backgroundColor: currentTheme.backgroundColor,
                      borderColor: currentTheme.textSecondary + '40',
                      color: currentTheme.textColor,
                    }}
                  >
                    <option value="0px">Sharp (0px)</option>
                    <option value="2px">Subtle (2px)</option>
                    <option value="4px">Small (4px)</option>
                    <option value="8px">Medium (8px)</option>
                    <option value="12px">Large (12px)</option>
                    <option value="16px">Extra Large (16px)</option>
                  </select>
                </div>
              </div>

              {/* Font Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                    Header Font
                  </label>
                  <select
                    value={formData.headerFont || 'Oswald'}
                    onChange={e => setFormData({ ...formData, headerFont: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none cursor-pointer"
                    style={{
                      backgroundColor: currentTheme.backgroundColor,
                      borderColor: currentTheme.textSecondary + '40',
                      color: currentTheme.textColor,
                    }}
                  >
                    <option value="Oswald">Oswald</option>
                    <option value="Source Sans 3">Source Sans 3</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                    Body Font
                  </label>
                  <select
                    value={formData.bodyFont || 'Source Sans 3'}
                    onChange={e => setFormData({ ...formData, bodyFont: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none cursor-pointer"
                    style={{
                      backgroundColor: currentTheme.backgroundColor,
                      borderColor: currentTheme.textSecondary + '40',
                      color: currentTheme.textColor,
                    }}
                  >
                    <option value="Source Sans 3">Source Sans 3</option>
                    <option value="Oswald">Oswald</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                  </select>
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.textSecondary }}>
                  Preview
                </label>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: formData.backgroundColor,
                    borderRadius: formData.borderRadius,
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center font-bold"
                          style={{ backgroundColor: formData.accentColor }}
                        >
                          42
                        </div>
                        <span style={{ color: formData.textColor, fontFamily: formData.headerFont }}>
                          HOME
                        </span>
                      </div>
                      <span style={{ color: formData.textSecondary }}>Q3</span>
                      <div className="flex items-center gap-2">
                        <span style={{ color: formData.textColor, fontFamily: formData.headerFont }}>
                          AWAY
                        </span>
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center font-bold"
                          style={{ backgroundColor: '#2563eb' }}
                        >
                          38
                        </div>
                      </div>
                    </div>
                    <div
                      className="p-3 rounded"
                      style={{
                        backgroundColor: formData.secondaryBackground,
                        borderRadius: formData.borderRadius,
                      }}
                    >
                      <p style={{ color: formData.textColor, fontFamily: formData.bodyFont }}>
                        Player Stats Table
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t" style={{ borderColor: currentTheme.textSecondary + '20' }}>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium border"
                style={{
                  borderColor: currentTheme.textSecondary + '40',
                  color: currentTheme.textSecondary,
                  borderRadius: currentTheme.borderRadius,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTheme}
                className="flex-1 px-4 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: currentTheme.accentColor,
                  color: '#fff',
                  borderRadius: currentTheme.borderRadius,
                }}
              >
                Save Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

