export interface AudioControlsProps { values: Record<string,string>; set: (key:string,value:string)=>void; duration?:number; playhead?:number; onSeek?:(time:number)=>void }
