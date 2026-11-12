import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { api } from '../../common/bridge';
import { Button } from '../../common/ui/primitives';
import { Slider } from '../../common/ui/slider';

const CHUNK_SECONDS = 10;
const STYLES = ['line', 'point', 'p2p', 'cline'];
type CachedPreview = { url: string; owned: boolean };
type PreviewTask = { key:string; index:number; mode:string; generation:number; path:string; optionKey:string };
type Props = { path: string; style: string; duration: number; options?: Record<string, string> };

function playable(source: string): CachedPreview {
 if (!source.startsWith('data:')) return { url: source, owned: false };
 const match = /^data:(video\/[^;,]+);base64,(.*)$/s.exec(source);
 if (!match) throw new Error('The visualization preview has an invalid video format.');
 const decoded = atob(match[2]);
 const bytes = Uint8Array.from(decoded, character => character.charCodeAt(0));
 return { url: URL.createObjectURL(new Blob([bytes], { type: match[1] })), owned: true };
}
function dispose(entry: CachedPreview) { if (entry.owned) URL.revokeObjectURL(entry.url); }

export default function VisualizeVideoPreview({ path, style, duration, options = {} }: Props) {
 const video = useRef<HTMLVideoElement>(null);
 const cache = useRef(new Map<string, CachedPreview>());
 const pending = useRef(new Set<string>());
 const tasks = useRef<PreviewTask[]>([]);
 const running = useRef(0);
 const pump = useRef<() => void>(() => {});
 const epoch = useRef(0);
 const globalTime = useRef(0);
 const desiredPlaying = useRef(false);
 const readyKey = useRef('');
 const restoring = useRef(false);
 const previousVideoKey = useRef('');
 const previousPath = useRef(path);
 const [time, setTime] = useState(0);
 const [chunk, setChunk] = useState(0);
 const chunkRef = useRef(chunk); chunkRef.current = chunk;
 const [playing, setPlaying] = useState(false);
 const [error, setError] = useState('');
 const [, refresh] = useState(0);
 const [retry, setRetry] = useState(0);
 const optionKey = JSON.stringify(Object.entries(options).sort(([a], [b]) => a.localeCompare(b)));
 const selectedStyle = STYLES.includes(style) ? style : 'line';
 const key = `${chunk}:${selectedStyle}`;
 if(previousVideoKey.current&&previousVideoKey.current!==key&&video.current&&readyKey.current===previousVideoKey.current){
  const previousChunk=Number(previousVideoKey.current.split(':')[0]);
  if(previousChunk===chunk)globalTime.current=previousChunk*CHUNK_SECONDS+video.current.currentTime;
 }
 previousVideoKey.current=key;
 const segmentReady = STYLES.every(mode=>cache.current.has(`${chunk}:${mode}`));
 const source = segmentReady ? cache.current.get(key)?.url : undefined;
 const total = Number.isFinite(duration) && duration > 0 ? duration : CHUNK_SECONDS;
 const hasNext = duration <= 0 || (chunk + 1) * CHUNK_SECONDS < duration;

 useEffect(() => {
  epoch.current++;
  cache.current.forEach(dispose); cache.current.clear(); pending.current.clear(); tasks.current=[]; readyKey.current = '';
  setError('');
  if (previousPath.current !== path) {
   previousPath.current = path; globalTime.current = 0; desiredPlaying.current = false;
   setTime(0); setChunk(0); setPlaying(false);
  }
  refresh(value => value + 1);
  return () => { epoch.current++; cache.current.forEach(dispose); cache.current.clear(); pending.current.clear(); tasks.current=[]; pump.current=()=>{}; };
 }, [path, optionKey]);

 useEffect(() => {
  const generation = epoch.current;
  const indices = playing && hasNext ? [chunk, chunk + 1] : [chunk];
  for (const [cachedKey, entry] of cache.current) {
   const index = Number(cachedKey.split(':')[0]);
   if (index < chunk || index > chunk + 1) { dispose(entry); cache.current.delete(cachedKey); }
  }
  tasks.current=tasks.current.filter(task=>{
   const keep=task.generation===generation&&task.index>=chunk&&task.index<=chunk+1;
   if(!keep)pending.current.delete(task.key);
   return keep;
  });
  const modes=[selectedStyle,...STYLES.filter(mode=>mode!==selectedStyle)];
  for (const index of indices) for (const mode of modes) {
   const cacheKey = `${index}:${mode}`;
   if (cache.current.has(cacheKey) || pending.current.has(cacheKey)) continue;
   pending.current.add(cacheKey);
   tasks.current.push({key:cacheKey,index,mode,generation,path,optionKey});
  }
  tasks.current.sort((a,b)=>a.index-b.index||Number(b.mode===selectedStyle)-Number(a.mode===selectedStyle));
  pump.current=()=>{
   while(running.current<2&&tasks.current.length){
    const task=tasks.current.shift()!;
    if(task.generation!==epoch.current||task.index<chunkRef.current||task.index>chunkRef.current+1){pending.current.delete(task.key);continue;}
    if(!api.audioVisualizePreview){setError('Visualization playback requires the Santra desktop app.');pending.current.delete(task.key);continue;}
    running.current++;
    void api.audioVisualizePreview(task.path,{...JSON.parse(task.optionKey),style:task.mode,start:String(task.index*CHUNK_SECONDS),width:'1280',height:'720'}).then(result=>{
     if(epoch.current!==task.generation)return;
     const entry=playable(result.url);
     if(task.index<chunkRef.current||task.index>chunkRef.current+1){dispose(entry);return;}
     cache.current.set(task.key,entry);
     if(STYLES.every(mode=>cache.current.has(`${chunkRef.current}:${mode}`)))setError('');
     refresh(value=>value+1);
    }).catch(reason=>{
     if(epoch.current===task.generation&&task.index===chunkRef.current)setError(reason instanceof Error?reason.message:String(reason));
    }).finally(()=>{
     running.current--;
     if(epoch.current===task.generation)pending.current.delete(task.key);
     pump.current();
    });
   }
  };
  pump.current();
 }, [path, optionKey, chunk, selectedStyle, playing, hasNext, retry]);

 useLayoutEffect(() => { readyKey.current = ''; restoring.current=false; }, [key, source]);
 function seek(next: number) {
  const bounded = Math.max(0, Math.min(total, next));
  globalTime.current = bounded; setTime(bounded);
  const nextChunk = Math.min(Math.floor(bounded / CHUNK_SECONDS), Math.max(0, Math.ceil(total / CHUNK_SECONDS) - 1));
  if (nextChunk !== chunk) setChunk(nextChunk);
  else if (video.current && readyKey.current === key) video.current.currentTime = Math.min(video.current.duration || CHUNK_SECONDS, bounded - chunk * CHUNK_SECONDS);
 }
 function startPlayback() {
  const element = video.current;
  if (!element || !source || readyKey.current !== key) return;
  void element.play().catch(() => { desiredPlaying.current = false; setPlaying(false); setError('The visualization video could not be played.'); });
 }
 return <div className="visualize-video-preview" data-preview-style={selectedStyle} data-chunk-start={chunk * CHUNK_SECONDS} data-cache-size={cache.current.size} data-segment-ready={segmentReady}>
  <video key={key} ref={video} src={source} playsInline preload="auto" aria-label="Live waveform video preview" style={{aspectRatio:'1280 / 720'}} onLoadedMetadata={event => {
   const element = event.currentTarget;
   const target=Math.max(0,Math.min(element.duration||CHUNK_SECONDS,globalTime.current-chunk*CHUNK_SECONDS));
   if(Math.abs(element.currentTime-target)>.005){restoring.current=true;element.currentTime=target;}
   else {readyKey.current=key;if(desiredPlaying.current)startPlayback();}
  }} onSeeked={event=>{
   if(!restoring.current)return;
   restoring.current=false;readyKey.current=key;
   globalTime.current=chunk*CHUNK_SECONDS+event.currentTarget.currentTime;
   setTime(globalTime.current);
   if(desiredPlaying.current)startPlayback();
  }} onTimeUpdate={event => {
   if (readyKey.current !== key||restoring.current) return;
   const next = Math.min(total, chunk * CHUNK_SECONDS + event.currentTarget.currentTime);
   globalTime.current = next; setTime(next);
  }} onEnded={() => {
   if (duration > 0 && (chunk + 1) * CHUNK_SECONDS >= duration) { desiredPlaying.current = false; setPlaying(false); seek(duration); return; }
   const next = (chunk + 1) * CHUNK_SECONDS;
   globalTime.current = next; setTime(next); setChunk(chunk + 1);
  }} onError={() => { if (source) setError('The visualization video could not be played.'); }}/>
  {!source && !error && <p role="status">{playing ? 'Buffering the next visualization segment…' : 'Preparing visualization previews…'}</p>}
  <Slider aria-label="Visualization preview timeline" min={0} max={total} step={.01} value={[time]} onValueChange={([next]) => seek(next)}/>
  <div className="audio-waveform-transport"><Button variant="outline" size="icon" aria-label={playing?'Pause visualization':'Play visualization'} onClick={() => {
   if (playing) { desiredPlaying.current = false; setPlaying(false); video.current?.pause(); }
   else { if (duration > 0 && time >= duration) seek(0); desiredPlaying.current = true; setPlaying(true); startPlayback(); }
  }}>{playing?<Pause size={17}/>:<Play size={17}/>}</Button><output>{time.toFixed(1)} / {duration > 0 ? duration.toFixed(1) : '…'} s</output></div>
  {error && <div role="alert"><p>{error}</p><Button variant="outline" size="sm" onClick={() => { setError(''); setRetry(value=>value+1); }}>Retry preview</Button></div>}
 </div>;
}
