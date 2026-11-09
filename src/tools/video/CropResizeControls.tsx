const ratios: Record<string, number> = { '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9, '3:2': 3 / 2 };
const presets = ['Free', '1:1', '4:3', '16:9', '3:2'];

type Props = {
  ratio: string;
  setCropRatio: (value: string) => void;
};

export default function CropResizeControls({ ratio, setCropRatio }: Props) {
  return <>
    <div className="video-settings-wide">
      <span className="video-field-label">Aspect ratio</span>
      <div className="video-tool-presets">{presets.map(item => <button key={item} type="button" aria-pressed={ratio === item} className={ratio === item ? 'selected' : ''} onClick={() => setCropRatio(item)}>{item}</button>)}</div>
    </div>
  </>;
}

export { ratios };
