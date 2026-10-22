import { useState } from 'react';
import { useEditorContext } from './EditorContext';

export const ColorPalette = () => {
  const { palette, nowColorID, setNowColorID, UpdataPaletteID, addColor, deleteColor } = useEditorContext();
  const [showRequiredColorsDialog, setShowRequiredColorsDialog] = useState(false);
  const [pendingDeleteColorID, setPendingDeleteColorID] = useState<number | null>(null);

  return (
    <>
                <section className="editor-palette" aria-label="使用する色">
                    <div className="editor-palette-heading">使用する色</div>
                    <div className="editor-color-list">
                    {palette.map((color, id) => (
                        <div key={id} className="editor-color-row">
                            <input
                                className="editor-color-input"
                                aria-label={`${id + 1}色目を変更`}
                                type="color"
                                value={color}
                                onChange={(e) => UpdataPaletteID(id, e.target.value)}
                            />
                            <button
                                className={`editor-color-select ${nowColorID === id ? 'is-selected' : ''}`}
                                type="button"
                                aria-label={`${color.toUpperCase()}を描画色に選択`}
                                title={`${color.toUpperCase()}を描画色に選択`}
                                onClick={() => setNowColorID(id)}
                            >{color.toUpperCase()}</button>
                            <button
                                type="button"
                                className="editor-color-delete"
                                onClick={() => palette.length <= 2 ? setShowRequiredColorsDialog(true) : setPendingDeleteColorID(id)}
                                aria-label={`${color.toUpperCase()}を削除`}
                                title="この色を削除"
                            >×</button>
                        </div>
                    ))}
                    </div>
                    <button className="editor-color-add" type="button" aria-label="色を追加" title="色を追加" onClick={addColor}>＋</button>
                </section>


            {showRequiredColorsDialog && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'grid',
                    placeItems: 'center',
                    padding: '20px',
                    background: 'rgba(42, 29, 27, 0.38)',
                }}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="required-colors-title"
                        style={{
                            position: 'relative',
                            width: 'min(360px, 100%)',
                            boxSizing: 'border-box',
                            padding: '28px 24px 24px',
                            border: '3px solid var(--border-color)',
                            borderRadius: '14px',
                            background: 'var(--folder-bg)',
                            boxShadow: '0 12px 36px rgba(42, 29, 27, 0.24)',
                            textAlign: 'center',
                        }}
                    >
                        <button
                            type="button"
                            aria-label="ダイアログを閉じる"
                            onClick={() => setShowRequiredColorsDialog(false)}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '30px',
                                height: '30px',
                                padding: 0,
                                border: '1px solid rgba(189, 98, 91, 0.35)',
                                borderRadius: '50%',
                                background: '#fff',
                                color: 'var(--text-color)',
                                fontSize: '20px',
                                lineHeight: 1,
                                cursor: 'pointer',
                            }}
                        >
                            ×
                        </button>
                        <div id="required-colors-title" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                            この色は削除できません
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: 1.7 }}>
                            背景色と線の色を残すため、パレットには最低2色が必要です。
                        </div>
                    </div>
                </div>
            )}

            {pendingDeleteColorID !== null && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'grid',
                    placeItems: 'center',
                    padding: '20px',
                    background: 'rgba(42, 29, 27, 0.38)',
                }}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-color-title"
                        style={{
                            position: 'relative',
                            width: 'min(360px, 100%)',
                            boxSizing: 'border-box',
                            padding: '28px 24px 24px',
                            border: '3px solid var(--border-color)',
                            borderRadius: '14px',
                            background: 'var(--folder-bg)',
                            boxShadow: '0 12px 36px rgba(42, 29, 27, 0.24)',
                            textAlign: 'center',
                        }}
                    >
                        <button
                            type="button"
                            aria-label="ダイアログを閉じる"
                            onClick={() => setPendingDeleteColorID(null)}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '30px',
                                height: '30px',
                                padding: 0,
                                border: '1px solid rgba(189, 98, 91, 0.35)',
                                borderRadius: '50%',
                                background: '#fff',
                                color: 'var(--text-color)',
                                fontSize: '20px',
                                lineHeight: 1,
                                cursor: 'pointer',
                            }}
                        >
                            ×
                        </button>
                        <div id="delete-color-title" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                            カラー {palette[pendingDeleteColorID]?.toUpperCase()} を削除しますか？
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>
                            この色で塗ったマスは、パレットの先頭色に置き換わります。
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setPendingDeleteColorID(null)}
                                style={{
                                    minWidth: '100px',
                                    padding: '9px 14px',
                                    border: '1px solid rgba(189, 98, 91, 0.45)',
                                    borderRadius: '8px',
                                    background: '#fff',
                                    color: 'var(--text-color)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    deleteColor(pendingDeleteColorID);
                                    setPendingDeleteColorID(null);
                                }}
                                style={{
                                    minWidth: '100px',
                                    padding: '9px 14px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--border-color)',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}
                            >
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </>
  );
};
