import type { Dispatch, SetStateAction } from 'react';
import SplitTracks, { clipError } from '../video/SplitTracks';
import type { SplitClip } from '../video/media';
import type { AudioControlsProps } from './controls';
import '../video/video-tool-window.css';
export function audioSplitClips(segments:string|undefined,duration=0):SplitClip[] {
 return (segments??`0-${Math.min(duration||10,10)}`).split(',').filter(Boolean).map((range,index)=>{const [start,end]=range.split('-');return {id:`audio-split-${index}`,start,end}});
}
export function audioSplitError(segments:string|undefined,duration=0) {
 const clips=audioSplitClips(segments,duration);
 if(!clips.length)return 'Add at least one split range.';
 if(clips.length>64)return 'Select at most 64 split ranges.';
 let end=0;
 for(const clip of clips){const error=clipError(clip,duration);if(error)return error;if(Number(clip.start)<end)return 'Split ranges must be ordered and must not overlap.';end=Number(clip.end)}
 return '';
}
export default function Split({values,set,duration=0,playhead=0}:AudioControlsProps){
 const clips=audioSplitClips(values.segments,duration);
 const setClips:Dispatch<SetStateAction<SplitClip[]>>=update=>{const next=typeof update==='function'?update(clips):update;set('segments',next.map(clip=>`${clip.start}-${clip.end}`).join(','))};
 return <div className="audio-fields"><SplitTracks clips={clips} setClips={setClips} duration={duration} playhead={playhead}/></div>;
}
