import { useState } from 'react';

interface Props {
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function SettingsPanel({ value, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(value);

  function handleSave() {
    onSave(draft);
    onClose();
  }

  function handleUseDefault() {
    onSave('');
    onClose();
  }

  return (
    <div className="settings-overlay" onMouseDown={onClose} onTouchStart={onClose}>
      <div
        className="settings-panel"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="settings-panel__header">
          <span className="settings-panel__title">Review Server</span>
          <button className="settings-panel__close" onMouseDown={onClose} onTouchStart={onClose}>✕</button>
        </div>

        <div className="settings-panel__hint">
          IP or hostname of the Mac running the review server. Leave blank to use the default
          (camerons-macbook-pro.local). Port and path are added automatically unless you enter a full URL.
        </div>

        <input
          className="settings-panel__input"
          type="text"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="e.g. 192.168.1.42"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        <div className="settings-panel__actions">
          <button className="settings-panel__default-btn" onMouseDown={handleUseDefault}>Use Default</button>
          <button className="settings-panel__save-btn" onMouseDown={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
