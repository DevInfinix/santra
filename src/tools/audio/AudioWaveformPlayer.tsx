import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '../../common/ui/primitives';
import { Slider } from '../../common/ui/slider';
import './audio-waveform-player.css';

interface Props {
  src: string;
  waveformUrl?: string;
  waveformDuration?: number;
  duration?: number;
  sourceName?: string;
  seekTime?: number;
  onTimeChange?: (time: number) => void;
}
export function audioWaveformWindow(time: number) {
  return { start: Math.max(0, time - 5), playhead: Math.min(5, Math.max(0, time)) / 10 };
}
const clock = (time: number) => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

export default function AudioWaveformPlayer({ src, waveformUrl, waveformDuration, duration = 0, sourceName, seekTime, onTimeChange }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(duration);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [dragStart, setDragStart] = useState<number | null>(null);
  const notify = useRef(onTimeChange);
  notify.current = onTimeChange;
  const update = (next: number) => { setTime(next); notify.current?.(next); };
  const seek = (next: number) => {
    if (!audio.current) return;
    const target = Math.max(0, Math.min(length || 0, next));
    audio.current.currentTime = target;
    update(target);
  };
  useEffect(() => { setTime(0); setLength(duration); setPlaying(false); setError(''); }, [src, duration]);
  useEffect(() => { if (seekTime !== undefined && Number.isFinite(seekTime)) seek(seekTime); }, [seekTime]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => { if (audio.current) update(audio.current.currentTime); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const start = dragStart ?? audioWaveformWindow(time).start;
  const covered = waveformDuration || length;
  const end = Math.min(length || 10, start + 10);
  return <div className="audio-waveform-player" data-window-start={start.toFixed(2)} data-playhead={audioWaveformWindow(time).playhead.toFixed(2)}>
    <audio ref={audio} src={src} preload="metadata" aria-label={`Original audio preview${sourceName ? ` of ${sourceName}` : ''}`} onLoadedMetadata={() => { if (audio.current && Number.isFinite(audio.current.duration)) setLength(audio.current.duration); }} onTimeUpdate={() => { if (audio.current) update(audio.current.currentTime); }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setError('This audio preview could not be played.'); }}/>
    <div className="audio-waveform-viewport">
      {waveformUrl && covered > 0 && start < covered ? <svg viewBox="0 0 1000 140" preserveAspectRatio="none" role="img" aria-label={`Waveform of ${sourceName || 'source audio'}, ${clock(start)} to ${clock(end)}`}><image href={waveformUrl} x={-start * 100} y="0" width={covered * 100} height="140" preserveAspectRatio="none"/></svg> : <span className="audio-waveform-unavailable">{start >= covered && covered > 0 ? 'Waveform preview is available for the first five minutes.' : 'Waveform preview is unavailable.'}</span>}
      <Slider className="audio-waveform-playhead" aria-label="Audio preview timeline" aria-valuetext={`${clock(time)} of ${clock(length)}`} min={start} max={start + 10} step={.05} value={[Math.max(start, Math.min(end, time))]} disabled={!length} onPointerCancel={() => setDragStart(null)} onBlur={() => setDragStart(null)} onPointerDownCapture={() => setDragStart(start)} onValueChange={([next]) => seek(next)} onValueCommit={() => setDragStart(null)}/>
    </div>
    <div className="audio-waveform-ruler" aria-hidden="true"><span>{clock(start)}</span><span>{clock(start + 5)}</span><span>{clock(start + 10)}</span></div>
    <div className="audio-waveform-transport">
      <Button variant="ghost" size="icon" aria-label="Back 5 seconds" disabled={!length} onClick={() => seek(time - 5)}><RotateCcw size={16}/></Button>
      <Button variant="outline" size="icon" aria-label={playing ? 'Pause audio' : 'Play audio'} disabled={!src} onClick={() => { if (!audio.current) return; if (playing) audio.current.pause(); else void audio.current.play().catch(() => setError('This audio preview could not be played.')); }}>{playing ? <Pause size={17}/> : <Play size={17}/>}</Button>
      <Button variant="ghost" size="icon" aria-label="Forward 5 seconds" disabled={!length} onClick={() => seek(time + 5)}><RotateCw size={16}/></Button>
      <output aria-label="Audio playback time">{clock(time)} / {clock(length)}</output>
    </div>
    {error && <p role="status">{error}</p>}
  </div>;
}
