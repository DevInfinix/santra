import { Circle, Pencil, Square, Trash2, Triangle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { clock, maskShape, type Mask, type MaskShape } from './media';
import { Button } from '../../common/ui/primitives';

const shapes: { id: MaskShape; label: string; icon: typeof Square }[] = [
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'path', label: 'Freehand', icon: Pencil },
];

type Props = {
  masks: Mask[];
  setMasks: Dispatch<SetStateAction<Mask[]>>;
  duration: number;
  values: Record<string, string>;
  set: (key: string, value: string) => void;
  playhead: number;
};

const maskError = (mask: Mask, duration: number) => {
  if (mask.end <= mask.start || mask.start < 0) return 'From must be before To.';
  if (duration > 0 && mask.end > duration + 0.02) return `To must be within ${clock(duration)}.`;
  return '';
};

export default function RedactTracks({ masks, setMasks, duration, values, set, playhead }: Props) {
  const shape = (values.redactShape || 'rect') as MaskShape;
  const filled = values.maskFilled !== 'false';
  const total = duration || Math.max(1, ...masks.map(mask => mask.end));
  return <>
    <div className="video-shape-toolbar video-settings-wide" role="group" aria-label="Redaction shape">
      {shapes.map(item => {
        const Icon = item.icon;
        return <button key={item.id} type="button" aria-pressed={shape === item.id} className={shape === item.id ? 'selected' : ''} onClick={() => set('redactShape', item.id)}><Icon size={14}/> {item.label}</button>;
      })}
    </div>
    <label className="video-tool-field">Mask color
      <input aria-label="Redaction color" type="color" value={values.maskColor || '#000000'} onChange={event => set('maskColor', event.target.value)}/>
    </label>
    <label className="video-tool-check">Outline only
      <input type="checkbox" checked={!filled} onChange={event => set('maskFilled', String(!event.target.checked))}/>
    </label>
    {!filled && <label className="video-tool-field">Outline width (px)
      <input aria-label="Redaction outline width" type="number" min="1" max="64" value={values.maskStroke || '4'} onChange={event => set('maskStroke', event.target.value)}/>
    </label>}
    <p className="video-tool-empty video-settings-wide">Draw on the preview with {shapes.find(item => item.id === shape)?.label.toLowerCase()}.</p>
    <div className="video-tool-mask-list video-settings-wide">
      {masks.length === 0 && <p className="video-tool-empty">No masks yet. Choose a shape and draw on the video.</p>}
      {masks.map((mask, index) => {
        const error = maskError(mask, duration);
        const left = Math.max(0, Math.min(100, mask.start / total * 100));
        const width = Math.max(0.5, Math.min(100 - left, (Math.max(0, mask.end - mask.start)) / total * 100));
        return <div className="video-redact-track" key={`${index}-${mask.x}-${mask.y}-${mask.shape}`}>
          <div className="video-track-row">
            <span className="video-track-index">Mask {String(index + 1).padStart(2, '0')}</span>
            <div className="video-track-rail" aria-label={`Mask ${index + 1} active from ${clock(mask.start)} to ${clock(mask.end)}`}>
              <div className="video-track-clip" style={{ left: `${left}%`, width: `${width}%` }}/>
              <span className="video-track-playhead" style={{ left: `${Math.max(0, Math.min(100, playhead / total * 100))}%` }}/>
            </div>
            <span className="video-track-output">{maskShape(mask)} · {Math.round(mask.width)}×{Math.round(mask.height)}</span>
            <Button type="button" variant="ghost" size="icon" className="video-track-delete" aria-label={`Delete mask ${index + 1}`} onClick={() => setMasks(current => current.filter((_, position) => position !== index))}><Trash2 size={13}/></Button>
          </div>
          <div className="video-mask-range-actions">
            <span>Active {clock(mask.start)} – {clock(mask.end)}</span>
            <div>
              <Button type="button" variant="outline" size="sm" aria-label={`Set mask ${index + 1} start at playhead`} onClick={() => setMasks(current => current.map((item, position) => position === index ? { ...item, start: Math.min(playhead, item.end - 0.01) } : item))}>Set start at playhead</Button>
              <Button type="button" variant="outline" size="sm" aria-label={`Set mask ${index + 1} end at playhead`} onClick={() => setMasks(current => current.map((item, position) => position === index ? { ...item, end: Math.max(playhead, item.start + 0.01) } : item))}>Set end at playhead</Button>
            </div>
          </div>
          <span className="video-mask-title">{maskShape(mask)}{mask.filled === false ? ' · outline' : ''}</span>
          {error && <p className="video-field-error" role="alert">{error}</p>}
        </div>;
      })}
    </div>
  </>;
}

export { maskError };
