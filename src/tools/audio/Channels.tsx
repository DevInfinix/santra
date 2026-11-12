import { FormatSelect } from '../../common/ui/select';
import type { AudioControlsProps } from './controls';
export default function Channels({values,set}: AudioControlsProps) {
 return <div className="image-tool-select"><span>Output channels</span><FormatSelect label="Output channels" value={values.channels ?? '1'} options={['1','2']} optionLabels={{'1':'Mono','2':'Stereo'}} onValueChange={value=>set('channels',value)}/><span className="image-tool-hint">The local encoder determines channel mapping.</span></div>;
}
