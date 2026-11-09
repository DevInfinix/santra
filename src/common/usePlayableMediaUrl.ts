import { useEffect, useState } from 'react';

type PlayableMedia = { source: string; url: string; error: string };

function inlineMediaBlob(source: string) {
  const comma = source.indexOf(',');
  const header = comma >= 0 ? source.slice(5, comma) : '';
  if (!source.startsWith('data:') || comma < 0 || !header.endsWith(';base64')) {
    throw new Error('The local media preview has an invalid inline format.');
  }
  const mime = header.slice(0, -';base64'.length);
  if (!mime.startsWith('audio/') && !mime.startsWith('video/')) {
    throw new Error('The local media preview has an invalid content type.');
  }
  const decoded = atob(source.slice(comma + 1));
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export function usePlayableMediaUrl(source = '') {
  const [media, setMedia] = useState<PlayableMedia>({ source: '', url: '', error: '' });

  useEffect(() => {
    if (!source) {
      setMedia({ source, url: '', error: '' });
      return;
    }
    if (!source.startsWith('data:')) {
      setMedia({ source, url: source, error: '' });
      return;
    }
    try {
      const url = inlineMediaBlob(source);
      setMedia({ source, url, error: '' });
      return () => URL.revokeObjectURL(url);
    } catch (error) {
      setMedia({ source, url: '', error: error instanceof Error ? error.message : String(error) });
    }
  }, [source]);

  return media.source === source ? media : { source, url: '', error: '' };
}
