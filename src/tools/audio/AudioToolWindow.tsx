import { NativeSelect as UiNativeSelect } from '../../common/ui/primitives';
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
import Visualize from './Visualize';
import Compress from './Compress';
import StripMetadata from './StripMetadata';
import type { AudioControlsProps } from './controls';
import type { ComponentType } from 'react';
import './audio.css';
const controls: Record<string,ComponentType<AudioControlsProps>> = {normalize:Normalize,channels:Channels,trim:Trim,visualize:Visualize,compress:Compress,'strip-metadata':StripMetadata};
export const audioEditorOperations = Object.keys(controls);
interface Props { capability:Capability; files:LocalFile[]; format:string; initialOptions:Record<string,string>; onClose:()=>void; onApply:(format:string,values:Record<string,string>)=>Promise<void> }
export default function AudioToolWindow({capability,files,format:initialFormat,initialOptions,onClose,onApply}:Props) {
 const operation=capability.operation || capability.id.split(':').pop()!;
 const defaults={...initialOptions,...(operation==='visualize'?{waveColor:'#ff5a00',backgroundColor:'#ffffff'}:{})};
 const [values,setValues]=useState<Record<string,string>>(defaults);
 const [format,setFormat]=useState(initialFormat);
 const [preview,setPreview]=useState<Awaited<ReturnType<NonNullable<typeof api.preview>>>|null>(null);
 const [previewError,setPreviewError]=useState('');
 const [visualizationPreview,setVisualizationPreview]=useState<{url:string;width:number;height:number}|null>(null);
 const [visualizationPreviewError,setVisualizationPreviewError]=useState('');
 const [visualizationPreviewLoading,setVisualizationPreviewLoading]=useState(false);
 const playablePreview=usePlayableMediaUrl(preview?.url);
 const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 const file=files[0]; const Controls=controls[operation];
 const visualizationStyle=values.style??'line';
 const visualizationWidth=values.width??'1280';
 const visualizationHeight=values.height??'720';
 const visualizationOptions={...values,style:visualizationStyle,width:visualizationWidth,height:visualizationHeight};
 useEffect(()=>{let active=true; if(file && api.preview) void api.preview(file.path).then(v=>{if(active)setPreview(v)}).catch(e=>{if(active)setPreviewError(String(e))});return()=>{active=false}},[file?.path]);
 useEffect(()=>{
  if(operation!=='visualize'||!file?.path)return;
  if(!api.audioVisualizePreview){setVisualizationPreview(null);setVisualizationPreviewError('Live waveform previews are available in the Santra desktop app.');return;}
  let active=true;
  setVisualizationPreview(null);setVisualizationPreviewError('');setVisualizationPreviewLoading(true);
  const timer=window.setTimeout(()=>{
   void api.audioVisualizePreview!(file.path,visualizationOptions).then(result=>{if(active)setVisualizationPreview(result)}).catch(reason=>{if(active)setVisualizationPreviewError(reason instanceof Error?reason.message:String(reason))}).finally(()=>{if(active)setVisualizationPreviewLoading(false)});
  },200);
  return()=>{active=false;window.clearTimeout(timer)};
 },[operation,file?.path,visualizationStyle,visualizationWidth,visualizationHeight,values.waveColor,values.backgroundColor]);
 const submit=async()=>{if(busy)return;setBusy(true);setError('');try{await onApply(format,values);onClose()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
 const reset=()=>{setValues(defaults);setFormat(initialFormat);setError('')};
 return <ReferenceEditor title={operationLabels[operation] || capability.label} ariaLabel={capability.label} subtitle={<>{file?.name}{preview?.duration ? ` · ${Math.floor(preview.duration/60)}:${String(Math.floor(preview.duration%60)).padStart(2,'0')}` : ''} · Original audio</>} preview={<><span>{operation==='visualize'?'Visualization preview · first second':'Local preview · original audio'}</span><div className="audio-preview">{operation==='visualize'?visualizationPreview?.url?<img src={visualizationPreview.url} alt={`Waveform preview: ${visualizationStyle}, ${visualizationPreview.width} × ${visualizationPreview.height}`}/>:<p className="image-tool-hint" role="status">{visualizationPreviewLoading?'Updating waveform preview…':visualizationPreviewError||'Preparing waveform preview…'}</p>:preview?.waveform?<img src={preview.waveform} alt={`Waveform of ${file?.name}`}/>:<p className="image-tool-hint">{previewError||'Waveform preview is not available for this source.'}</p>}{playablePreview.url ? <audio controls src={playablePreview.url} aria-label="Original audio preview"/> : <p role="status">{playablePreview.error || previewError || 'Loading local preview…'}</p>}</div><p className="reference-preview-label">Output settings are applied to the saved copy.</p></>} settings={<><label className="image-tool-select">Output format<UiNativeSelect value={format} onChange={e=>setFormat(e.target.value)}>{capability.outputs.map(f=><option key={f} value={f}>{f.toUpperCase()}</option>)}</UiNativeSelect></label>{Controls ? <Controls values={values} set={(key,value)=>setValues(v=>({...v,[key]:value}))}/> : <OperationFields capability={capability} values={values} onChange={setValues}/>}</>} notice={error || capability.warning || 'Save a new copy. Your original audio stays untouched.'} error={Boolean(error)} output={`New ${format.toUpperCase()} copy · ${file?.name || 'selection'}`} busy={busy} disabled={!files.length} onClose={onClose} onReset={reset} onSubmit={submit}/>;
}
