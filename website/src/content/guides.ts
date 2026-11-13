export type Guide = {
  slug: string;
  title: string;
  headline: string;
  description: string;
  category: string;
  family: 'images' | 'video' | 'documents' | 'spreadsheets' | 'subtitles' | 'archives';
  operation: string;
  pain: string;
  answer: string;
  source: string;
  outputs: string[];
  steps: { title: string; body: string }[];
  limits: string[];
  faq: { question: string; answer: string }[];
  related: string[];
};

// Examples illustrate a workflow; names and results depend on source and output settings.
export const guides: Guide[] = [
  {
    slug: 'xlsx-to-csv-offline',
    title: 'Convert XLSX to CSV offline on Windows and Linux',
    headline: 'Your workbook has three sheets. Your CSV should not lose two.',
    description: 'Convert XLSX to CSV locally with Santra. Export separate files for every worksheet, keep the workbook, and understand formula and formatting limits.',
    category: 'Spreadsheets', family: 'spreadsheets', operation: 'CSV',
    pain: 'A spreadsheet import wants CSV. Your workbook contains Sales, Costs, and Forecast, and exporting only the active tab leaves the job half done.',
    answer: 'Add the workbook to Santra desktop and choose CSV in Convert. Multi-sheet conversion creates a separate output for each worksheet. Processing stays on your Windows or Linux computer; the bundled worker needs no LibreOffice installation.',
    source: 'quarterly-report.xlsx',
    outputs: ['quarterly-report-Sales.csv', 'quarterly-report-Costs.csv', 'quarterly-report-Forecast.csv'],
    steps: [
      { title: 'Add one workbook', body: 'Open Santra desktop and add quarterly-report.xlsx in the workspace. Keep the source workbook available for comparison.' },
      { title: 'Choose CSV', body: 'Select the workbook, open Convert, and choose CSV. Santra uses the local spreadsheet worker rather than uploading the file.' },
      { title: 'Review the output files', body: 'Wait for the local job to complete. Locate the separate worksheet outputs through the job results; exact names follow your source and collision settings.' },
      { title: 'Check the receiving system', body: 'Open each CSV or import it into the destination system. Check headers, row counts, dates, identifiers, and values before replacing your existing data.' },
    ],
    limits: ['One workbook per operation; inputs are limited to 32 MB and 256 sheets.', 'Formulas are not recalculated. Refresh calculations in your spreadsheet application first if current values matter.', 'CSV stores a single table, not workbook formatting, charts, macros, or multiple sheets in one file.'],
    faq: [
      { question: 'Does XLSX-to-CSV conversion upload my workbook?', answer: 'No. The desktop app processes it locally in a bundled worker.' },
      { question: 'Can one CSV contain every worksheet?', answer: 'No. Santra writes separate worksheet outputs so that additional sheets are not silently skipped.' },
    ],
    related: ['split-excel-worksheets', 'markdown-to-docx-offline'],
  },
  {
    slug: 'split-excel-worksheets',
    title: 'Split Excel worksheets into separate files offline',
    headline: 'Stop copying tabs into new workbooks by hand.',
    description: 'Split selected Excel worksheets into separate local files with Santra. Choose an output format and keep the original workbook on Windows or Linux.',
    category: 'Spreadsheets', family: 'spreadsheets', operation: 'Split worksheets',
    pain: 'Finance needs one tab. Operations needs another. Repeating Save As and deleting the wrong tabs turns a simple handoff into a cleanup job.',
    answer: 'Use Split worksheets in Santra desktop to select the sheets you need and write one output per selected worksheet. Choose a supported spreadsheet format while leaving the source workbook unchanged.',
    source: 'team-budget.xlsx', outputs: ['team-budget-Finance.xlsx', 'team-budget-Operations.xlsx'],
    steps: [
      { title: 'Add the source workbook', body: 'Open Santra on Windows or Linux and add team-budget.xlsx in the workspace. Select this workbook before opening Tools.' },
      { title: 'Open Split worksheets', body: 'Choose the spreadsheet split tool. Review the detected worksheet names instead of relying on the active tab in another application.' },
      { title: 'Choose sheets and format', body: 'Select Finance and Operations, for example, then choose the supported output format needed by the recipients.' },
      { title: 'Save and inspect each copy', body: 'Run the operation and review the resulting files. Confirm the selected worksheets and inspect formulas or references that originally pointed to other tabs.' },
    ],
    limits: ['The bundled worker accepts one workbook at a time, up to 32 MB and 256 sheets.', 'Formulas are not recalculated; references to omitted worksheets may not behave as they did in the original workbook.', 'Rewriting can lose unsupported parts, macros, charts, external links, and formatting. Keep the original as the authoritative copy.'],
    faq: [
      { question: 'Do I need LibreOffice to split worksheets?', answer: 'No. Spreadsheet processing uses the worker bundled with Santra desktop.' },
      { question: 'Does splitting remove confidential information automatically?', answer: 'No. Review every output for cell contents, formulas, comments, and other information before sharing it.' },
    ],
    related: ['xlsx-to-csv-offline', 'extract-zip-safely'],
  },
  {
    slug: 'webp-to-png-offline',
    title: 'Convert WebP to PNG offline on Windows and Linux',
    headline: 'The upload form wants PNG. Your image is WebP. Fix it locally.',
    description: 'Turn a WebP image into a PNG copy with Santra on Windows or Linux. No conversion upload, no renamed extension, and no change to the original.',
    category: 'Images', family: 'images', operation: 'PNG',
    pain: 'You have the right image, but the portal rejects its format. Renaming .webp to .png only hides the problem; it does not convert the image bytes.',
    answer: 'Select PNG in Santra desktop’s Convert picker. The bundled raster processor decodes the supported WebP source and writes a real PNG copy locally, preserving the original file.',
    source: 'product-hero.webp', outputs: ['product-hero.png'],
    steps: [
      { title: 'Add the WebP image', body: 'Open Santra on Windows or Linux and add product-hero.webp in the workspace. Santra validates the input instead of trusting the filename alone.' },
      { title: 'Choose PNG in Convert', body: 'Select the image and open Convert. Choose the available PNG route; no additional media engine is needed for the bundled raster processor.' },
      { title: 'Open the saved copy', body: 'Wait for the local job to finish and open the PNG result. Compare dimensions and transparency, then use this new file in the upload form.' },
    ],
    limits: ['Raster processing is limited to 128 MiB source files and 40 megapixels.', 'Animated images use the first frame; this workflow does not preserve a WebP animation.', 'Conversion removes copied metadata and cannot recover image detail already lost in the source. A PNG can be larger than its WebP source.'],
    faq: [
      { question: 'Will changing the file extension convert WebP to PNG?', answer: 'No. Use an actual conversion so that the saved bytes match the PNG format.' },
      { question: 'Does Santra overwrite the WebP?', answer: 'The normal workflow saves a new output and uses configured collision handling. Keep the original if you may need to convert again.' },
    ],
    related: ['remove-photo-metadata', 'trim-video-offline'],
  },
  {
    slug: 'remove-photo-metadata',
    title: 'Remove copied photo metadata locally before sharing',
    headline: 'Share the photo. Check what travels with it.',
    description: 'Create a local photo copy without copied metadata in Santra. Understand what raster rewriting removes and what it cannot hide in the picture itself.',
    category: 'Images', family: 'images', operation: 'PNG',
    pain: 'A photo can contain more than pixels: camera details, author fields, or location tags may travel with a file you intended to share casually.',
    answer: 'Convert the photo to PNG in Santra desktop to save a new raster copy without copied source metadata. Then inspect the output and the visible picture before sharing it.',
    source: 'weekend-photo.jpg', outputs: ['weekend-photo.png'],
    steps: [
      { title: 'Add the photo', body: 'Open the Windows or Linux desktop app, add weekend-photo.jpg, and select the image in the workspace.' },
      { title: 'Choose a PNG copy', body: 'Open Convert and choose PNG for the supported raster photo. This creates a new raster file rather than modifying the source JPEG.' },
      { title: 'Save a separate copy', body: 'Run the job and locate the new output. The bundled raster processor rewrites the image without copying source metadata; ExifTool is not needed for this conversion.' },
      { title: 'Review before sharing', body: 'Inspect the saved file using a metadata viewer if privacy matters. Also check visible street signs, faces, screens, and other identifying details inside the image.' },
    ],
    limits: ['This is a raster rewrite, not a forensic sanitization guarantee. Newly encoded files can still contain technical format information.', 'Deleting metadata does not redact text, faces, addresses, or other content visible in the pixels.', 'Raster limits apply, and animated inputs use only the first frame. A PNG can be larger than the source JPEG.'],
    faq: [
      { question: 'Does deleting metadata remove information visible in the image?', answer: 'No. Visible information remains in the pixels; review or edit it separately before sharing.' },
      { question: 'Is metadata editing the same operation?', answer: 'No. Editing supported JPEG EXIF fields is a separate optional ExifTool route. This guide covers raster conversion without copied source metadata.' },
    ],
    related: ['webp-to-png-offline', 'extract-zip-safely'],
  },
  {
    slug: 'trim-video-offline',
    title: 'Trim a video offline on Windows and Linux',
    headline: 'Keep the useful moment. Cut the waiting around.',
    description: 'Trim a local video in Santra with detected FFmpeg support. Set a start and end time, export a new clip, and keep the complete source recording.',
    category: 'Video', family: 'video', operation: 'Trim',
    pain: 'The useful demonstration starts halfway through a recording. Sending the whole file makes everyone scrub through the setup again.',
    answer: 'Open Trim in Santra desktop, choose the start and end of the useful section, and save a new clip. Video tools appear only when local FFmpeg and FFprobe detection confirms a compatible route.',
    source: 'product-demo.mp4', outputs: ['product-demo-trimmed.mp4'],
    steps: [
      { title: 'Check the video engine', body: 'In desktop Settings, check Engines for local FFmpeg support. Install or configure the required local tools if the compatible Trim route is unavailable; Santra has no cloud fallback.' },
      { title: 'Add the recording', body: 'Add product-demo.mp4 to the workspace and select it. Open Tools and choose Trim when the file and engine support it.' },
      { title: 'Mark the useful range', body: 'Use the timeline and trim controls to set a start and end. For example, a demonstration might run from 00:12 to 00:28; choose times from your own recording.' },
      { title: 'Export and play it back', body: 'Choose an available output and save a new clip. Play the result to check the opening frame, ending frame, and audio before sending it.' },
    ],
    limits: ['The desktop app supports Windows and Linux; FFmpeg, FFprobe, codecs, and file validation gate availability.', 'Re-encoding can change image quality or increase size. Trimming is not a promise of a smaller file or a lossless cut.', 'The workflow uses the supported primary streams. Check the output if the source has multiple audio tracks or unusual timing.'],
    faq: [
      { question: 'Why is Trim missing for my file?', answer: 'The app only exposes compatible detected routes. Check Engines and the source format; an extension alone does not prove that decoding and output are supported.' },
      { question: 'Is the full recording changed?', answer: 'The normal workflow writes a new clip and preserves the source, using your configured destination and collision handling.' },
    ],
    related: ['webp-to-png-offline', 'srt-to-vtt-offline'],
  },
  {
    slug: 'markdown-to-docx-offline',
    title: 'Convert Markdown to DOCX offline with Santra',
    headline: 'They need a Word file. You already wrote the Markdown.',
    description: 'Convert a Markdown draft to DOCX locally on Windows or Linux using Santra and a verified Pandoc route. Keep the source and review layout changes.',
    category: 'Documents', family: 'documents', operation: 'DOCX',
    pain: 'Your draft is finished in Markdown, but the review process requires DOCX. Rebuilding headings and lists by hand introduces work and mistakes.',
    answer: 'Use Santra desktop’s verified Markdown-to-DOCX conversion route when a compatible local Pandoc installation is detected. Export a new document, then check its structure and layout in your document editor.',
    source: 'project-brief.md', outputs: ['project-brief.docx'],
    steps: [
      { title: 'Check Pandoc detection', body: 'Open Settings and check Engines in Santra on Windows or Linux. The app enables a document route only after local reader/writer and sandbox checks succeed.' },
      { title: 'Add the Markdown draft', body: 'Add project-brief.md in the desktop workspace. Select the file and open Convert.' },
      { title: 'Choose the available DOCX route', body: 'Select DOCX if it appears for this input. Santra performs the conversion locally; a missing route is not replaced by an online converter.' },
      { title: 'Review the document', body: 'Open the output in a DOCX-capable editor. Check headings, lists, tables, links, and page breaks against the Markdown source before sending it for review.' },
    ],
    limits: ['A compatible optional Pandoc installation and a successful local conversion probe are required.', 'Layout, fonts, images, and metadata can change; this is document conversion, not guaranteed page-for-page reproduction.', 'External resources are blocked by the document conversion sandbox. Do not assume remotely linked images or other resources will be fetched.'],
    faq: [
      { question: 'Does Santra require Microsoft Word for this conversion?', answer: 'The conversion uses detected local Pandoc. A DOCX-capable editor is useful for reviewing the saved result.' },
      { question: 'Why is DOCX absent from Convert?', answer: 'Santra shows only locally verified input/output pairs. Check the Pandoc engine and the capability warning for the selected file.' },
    ],
    related: ['xlsx-to-csv-offline', 'srt-to-vtt-offline'],
  },
  {
    slug: 'srt-to-vtt-offline',
    title: 'Convert SRT subtitles to WebVTT offline',
    headline: 'Your player wants VTT. Keep the words and their timing.',
    description: 'Convert SRT captions to WebVTT locally in Santra. Preserve cue text and timing, keep the SRT original, and review styling limits before publishing.',
    category: 'Subtitles', family: 'subtitles', operation: 'VTT',
    pain: 'The captions are ready, but your player expects a .vtt file. Hand-editing every timestamp separator is a tedious way to introduce subtitle errors.',
    answer: 'Add the SRT file to Santra desktop and choose VTT in Convert. The built-in subtitle processor validates cue timing and writes WebVTT locally without requiring FFmpeg or a conversion service.',
    source: 'interview-captions.srt', outputs: ['interview-captions.vtt'],
    steps: [
      { title: 'Add the subtitle source', body: 'Open Santra on Windows or Linux and add interview-captions.srt in the workspace. Keep the associated video available for checking synchronization.' },
      { title: 'Convert to VTT', body: 'Select the SRT file, open Convert, and choose VTT. The built-in route converts cue text and timing into the WebVTT format.' },
      { title: 'Test with the actual video', body: 'Open the resulting VTT in your target player or publishing workflow. Check captions near the beginning, middle, and end before publishing.' },
    ],
    limits: ['Styling and format-specific cue settings are not preserved.', 'Timing validation can reject malformed cues. Conversion does not automatically repair transcription or synchronize captions to a different video edit.', 'TXT output is a separate option that removes timestamps and markup; use VTT when you need timed captions.'],
    faq: [
      { question: 'Do I need FFmpeg to convert SRT to VTT?', answer: 'No. This subtitle conversion route is built into Santra desktop.' },
      { question: 'Will conversion fix captions that are out of sync?', answer: 'No. It preserves valid cue times rather than measuring them against the video. Review synchronization in the target player.' },
    ],
    related: ['trim-video-offline', 'markdown-to-docx-offline'],
  },
  {
    slug: 'extract-zip-safely',
    title: 'Extract a ZIP locally with bounded path checks',
    headline: 'Unpack the files. Keep archive paths inside the destination.',
    description: 'Extract supported ZIP entries locally with Santra. Understand path checks, rejected links, extraction size limits, and why extracted files still need care.',
    category: 'Archives', family: 'archives', operation: 'Extract archive',
    pain: 'You need the documents inside an archive, not unexpected files written elsewhere on your computer. Archive entry names deserve validation before extraction.',
    answer: 'Use Santra desktop’s Extract archive tool for supported ZIP files. The built-in extractor rejects unsafe paths, links, encrypted entries, and outputs beyond its limits. It does not execute the extracted files.',
    source: 'project-assets.zip', outputs: ['project-assets-extracted/'],
    steps: [
      { title: 'Add the ZIP', body: 'Open Santra on Windows or Linux and add project-assets.zip in the workspace. Select the archive without opening or executing any enclosed file.' },
      { title: 'Choose Extract archive', body: 'Open Tools and choose Extract archive. Review the output destination and collision handling before starting the local job.' },
      { title: 'Let validation finish', body: 'Run the extraction. If Santra rejects a path, link, encrypted entry, or limit violation, review the error rather than renaming the archive to bypass it.' },
      { title: 'Review the extracted folder', body: 'Locate the resulting folder through the job results. Open only files you intend to use; extraction checks do not establish that an unknown document or program is trustworthy.' },
    ],
    limits: ['ZIP extraction supports STORE and DEFLATE. RAR and 7z are unsupported, and encrypted entries are rejected.', 'Limits include 64 MiB per entry, 128 MiB total, and 10,000 entries; unsafe paths and links are rejected.', 'Path and size checks are not antivirus scanning or a guarantee that extracted contents are harmless.'],
    faq: [
      { question: 'Will Santra run a program inside the ZIP?', answer: 'No. Archive extraction writes supported entries; it never executes input files.' },
      { question: 'Why is my archive rejected?', answer: 'It may use an unsupported format or compression method, encrypted entries, unsafe paths, links, or contents exceeding extraction limits. Read the job error for the specific reason.' },
    ],
    related: ['split-excel-worksheets', 'remove-photo-metadata'],
  },
];
