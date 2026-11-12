import type { Dispatch, SetStateAction } from 'react';
import SplitTracks from '../video/SplitTracks';
import { decimal, type SplitClip } from '../video/media';
import type { AudioControlsProps } from './controls';
import '../video/video-tool-window.css';
export default function Trim({values,set,duration=0,playhead=0}: AudioControlsProps) {
 const start=Number(values.start??'0')||0;
 const selectedDuration=Number(values.duration??'10')||0;
 const clips:SplitClip[]=[{id:'audio-trim',start:values.start??'0',end:values.end??decimal(Math.min(duration||604800,start+selectedDuration))}];
 const setClips:Dispatch<SetStateAction<SplitClip[]>>=update=>{
  const next=(typeof update==='function'?update(clips):update)[0];
  if(!next)return;
  set('start',next.start);set('end',next.end);set('duration',decimal(Number(next.end)-Number(next.start)));
 };
 return <div className="audio-fields"><SplitTracks clips={clips} setClips={setClips} duration={duration} playhead={playhead} singleRange/></div>;
}
