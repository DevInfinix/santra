import { FormatSelect } from '../../common/ui/select';
import type { AudioControlsProps } from './controls';
export default function Visualize({values,set}: AudioControlsProps) {
 return <div className="audio-fields"><div className="image-tool-select"><span>Waveform style</span><FormatSelect label="Waveform style" value={values.style ?? 'line'} options={['line','point','p2p','cline']} optionLabels={{line:'Line',point:'Points',p2p:'Connected points',cline:'Centered line'}} onValueChange={value=>set('style',value)}/></div><p className="image-tool-hint">Exports an MP4 with the source audio. Playback buffers the full audio in 10-second sections for every waveform style.</p></div>;
}
