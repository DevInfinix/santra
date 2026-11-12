import { FormatSelect } from '../../common/ui/select';
import { useEffect, useState } from 'react';
import type { Capability, LocalFile } from '../../common/types';
import { api } from '../../common/bridge';
import { usePlayableMediaUrl } from '../../common/usePlayableMediaUrl';
import ReferenceEditor from '../../common/ReferenceEditor';
import { operationLabels } from '../../common/wheel-profiles';
import OperationFields from '../../common/OperationFields';
import Normalize from './Normalize';
import Channels from './Channels';
import Trim from './Trim';
import Split, { audioSplitError } from './Split';
import AudioWaveformPlayer from './AudioWaveformPlayer';
import Visualize from './Visualize';
import VisualizeVideoPreview from './VisualizeVideoPreview';
import Compress from './Compress';
import StripMetadata from './StripMetadata';
import type { AudioControlsProps } from './controls';
import type { ComponentType } from 'react';
import './audio.css';
const controls: Record<string,ComponentType<AudioControlsProps>> = {normalize:Normalize,channels:Channels,trim:Trim,split:Split,visualize:Visualize,compress:Compress,'strip-metadata':StripMetadata};
export const audioEditorOperations = Object.keys(controls);
interface Props { capability:Capability; files:LocalFile[]; format:string; initialOptions:Record<string,string>; onClose:()=>void; onApply:(format:string,values:Record<string,string>)=>Promise<void> }
export default function AudioToolWindow({capability,files,format:initialFormat,initialOptions,onClose,onApply}:Props) {
 const operation=capability.operation || capability.id.split(':').pop()!;
 const defaults:Record<string,string>={...initialOptions,...(operation==='visualize'?{waveColor:'#ff5a00',backgroundColor:'#ffffff',width:'1280',height:'720'}:{})};
 const [values,setValues]=useState<Record<string,string>>(defaults);
 const [format,setFormat]=useState(initialFormat);
 const [preview,setPreview]=useState<Awaited<ReturnType<NonNullable<typeof api.preview>>>|null>(null);
 const [previewError,setPreviewError]=useState('');
 const [playhead,setPlayhead]=useState(0);
 const [seekTime,setSeekTime]=useState<number>();
 const playablePreview=usePlayableMediaUrl(preview?.url);
 const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 const file=files[0]; const Controls=controls[operation];
 const visualizationStyle=values.style??'line';
 useEffect(()=>{let active=true; if(file && api.preview) void api.preview(file.path).then(v=>{if(active)setPreview(v)}).catch(e=>{if(active)setPreviewError(String(e))});return()=>{active=false}},[file?.path]);
 useEffect(()=>{if(operation==='trim'&&preview?.duration)setValues(current=>current.end?current:{...current,duration:String(Math.min(Number(current.duration??10),Math.max(0,preview.duration!-(Number(current.start)||0))))})},[operation,preview?.duration]);
 const submit=async()=>{if(busy)return;if(operation==='split'){const splitError=audioSplitError(values.segments,preview?.duration);if(splitError){setError(splitError);return;}}if(operation==='trim'){const start=Number(values.start??0),duration=Number(values.duration??Math.min(10,preview?.duration||10));if(!Number.isFinite(start)||!Number.isFinite(duration)||start<0||duration<=0||(preview?.duration&&start+duration>preview.duration+.02)){setError('Choose a valid trim range within the audio duration.');return;}}setBusy(true);setError('');try{await onApply(operation==='visualize'?'mp4':format,operation==='split'?{...values,segments:values.segments??`0-${Math.min(preview?.duration||10,10)}`}:values);onClose()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
 const reset=()=>{setValues(operation==='trim'&&preview?.duration?{...defaults,duration:String(Math.min(Number(defaults.duration??10),preview.duration))}:defaults);setFormat(initialFormat);setError('')};
 return <ReferenceEditor layout={operation==='split'?'stacked':'split'}
  title={operationLabels[operation] || capability.label} ariaLabel={capability.label}
  subtitle={<>{file?.name}{preview?.duration ? ` · ${Math.floor(preview.duration/60)}:${String(Math.floor(preview.duration%60)).padStart(2,'0')}` : ''} · Original audio</>}
  preview={<><span>{operation==='visualize'?'Video preview':'Local audio preview · 10-second window'}</span><div className={`audio-preview ${operation==='visualize'?'audio-preview--visualize':''}`}>
   {operation==='visualize' && file && <div className="audio-output-preview"><VisualizeVideoPreview path={file.path} style={visualizationStyle} duration={preview?.duration||0} options={{waveColor:values.waveColor,backgroundColor:values.backgroundColor}}/></div>}
   {operation!=='visualize' && (playablePreview.url ? <AudioWaveformPlayer src={playablePreview.url} waveformUrl={preview?.waveform} waveformDuration={preview?.waveformDuration} duration={preview?.duration} sourceName={file?.name} seekTime={seekTime} onTimeChange={setPlayhead}/>
    : <p role="status">{playablePreview.error || previewError || 'Loading local preview…'}</p>)}
  </div></>}
  settings={<><div className="audio-select-field"><span>Output format</span><FormatSelect value={operation==='visualize'?'mp4':format} options={operation==='visualize'?['mp4']:capability.outputs} onValueChange={setFormat}/></div>
   {Controls ? <Controls values={values} set={(key,value)=>setValues(v=>({...v,[key]:value}))} duration={preview?.duration} playhead={playhead} onSeek={setSeekTime}/>
    : <OperationFields capability={capability} values={values} onChange={setValues}/>}</>}
  notice={error || capability.warning || ''} error={Boolean(error)}
  output={`New ${(operation==='visualize'?'mp4':format).toUpperCase()} copy · ${file?.name || 'selection'}`} busy={busy} disabled={!files.length}
  onClose={onClose} onReset={reset} onSubmit={submit}/>;
}
