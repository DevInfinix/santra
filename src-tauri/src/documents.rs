use std::{
    collections::HashMap,
    fs::{self, File},
    io::Read,
    path::{Path, PathBuf},
    process::Command,
    time::Duration,
};

use serde_json::{json, Value};
use std::io::{self, Cursor};

const MAX_DOCX_BYTES: u64 = 16 * 1024 * 1024;
const MAX_DOCX_EXPANDED_BYTES: u64 = 128 * 1024 * 1024;
const MAX_DOCX_ENTRIES: usize = 2_000;

#[derive(Clone, Default)]
pub struct DocumentBackend {
    path: Option<PathBuf>,
    libreoffice_path: Option<PathBuf>,
    libreoffice_version: Option<String>,
    openoffice_path: Option<PathBuf>,
    openoffice_version: Option<String>,
    office_paths: HashMap<String, PathBuf>,
    dxpdf_path: Option<PathBuf>,
    dxpdf_version: Option<String>,
    readers: Vec<String>,
    writers: Vec<String>,
    pairs: Vec<(String, String)>,
}

const INPUTS: &[(&str, &str)] = &[
    ("txt", "markdown+hard_line_breaks-raw_html-raw_tex"),
    ("md", "markdown-raw_html-raw_tex"),
    ("html", "html-raw_html"),
    ("docx", "docx"),
    ("epub", "epub"),
];
const OUTPUTS: &[(&str, &str)] = &[
    ("txt", "plain"),
    ("md", "commonmark"),
    ("html", "html5"),
    ("docx", "docx"),
    ("epub", "epub"),
];

fn probe(path: &Path, args: &[&str]) -> Option<String> {
    let mut command = Command::new(path);
    command.args(args);
    crate::media::captured(command, Duration::from_secs(10), || false).ok()
}

/// Find office applications installed locally. Detection is separate from conversion support:
/// a discovered executable is not advertised as a converter until its route is implemented.
pub fn detect_office_suites(overrides: &HashMap<String, String>) -> HashMap<String, Option<PathBuf>> {
    let mut suites = HashMap::new();
    suites.insert(
        "libreoffice".into(),
        find_office_executable(
            overrides.get("libreoffice").map(String::as_str),
            if cfg!(windows) { &["soffice.com", "soffice.exe"] } else { &["libreoffice", "soffice"] },
            &[],
        ),
    );
    suites.insert("openoffice".into(), find_openoffice(overrides.get("openoffice").map(String::as_str)));
    suites.insert("freeoffice".into(), find_freeoffice(overrides.get("freeoffice").map(String::as_str), "textmaker"));
    suites.insert("freeoffice-presentation".into(), find_freeoffice(None, "presentations"));
    suites.insert(
        "microsoft-word".into(),
        find_office_executable(
            overrides.get("microsoft-word").map(String::as_str),
            &["WINWORD.EXE", "winword.exe"],
            &["Microsoft Office/root/Office16/WINWORD.EXE", "Microsoft Office/Office16/WINWORD.EXE", "Microsoft Office/root/Office15/WINWORD.EXE"],
        ),
    );
    suites.insert(
        "microsoft-powerpoint".into(),
        find_office_executable(
            overrides.get("microsoft-powerpoint").map(String::as_str),
            &["POWERPNT.EXE", "powerpnt.exe"],
            &["Microsoft Office/root/Office16/POWERPNT.EXE", "Microsoft Office/Office16/POWERPNT.EXE", "Microsoft Office/root/Office15/POWERPNT.EXE"],
        ),
    );
    suites.insert(
        "wps-office".into(),
        find_office_executable(
            overrides.get("wps-office").map(String::as_str),
            if cfg!(windows) { &["wps.exe", "wps.com"] } else { &["wps", "wps-office"] },
            &["WPS Office/office6/wps.exe", "WPS Office/12.2.0.0/office6/wps.exe", "Kingsoft/WPS Office/office6/wps.exe", ".local/bin/wps"],
        ),
    );
    suites.insert(
        "wps-presentation".into(),
        find_office_executable(
            overrides.get("wps-presentation").map(String::as_str),
            if cfg!(windows) { &["wpp.exe"] } else { &["wpp"] },
            &["WPS Office/office6/wpp.exe", "Kingsoft/WPS Office/office6/wpp.exe"],
        ),
    );
    suites
}

fn find_openoffice(override_path: Option<&str>) -> Option<PathBuf> {
    if let Some(path) = override_path.filter(|value| !value.is_empty()).map(PathBuf::from) {
        return path.is_file().then_some(path);
    }
    if cfg!(target_os = "linux") {
        if let Some(path) = find_office_executable(None, &["soffice", "openoffice", "openoffice4"], &[]) {
            return Some(path);
        }
        for path in ["/opt/openoffice4/program/soffice", "/usr/lib/openoffice/program/soffice"] {
            let path = PathBuf::from(path);
            if path.is_file() { return Some(path); }
        }
    }
    None
}

fn find_freeoffice(override_path: Option<&str>, prefix: &str) -> Option<PathBuf> {
    if let Some(path) = override_path.filter(|value| !value.is_empty()).map(PathBuf::from) {
        return path.is_file().then_some(path);
    }
    for directory in std::env::var_os("PATH").map(|paths| std::env::split_paths(&paths).collect::<Vec<_>>()).unwrap_or_default() {
        let Ok(entries) = fs::read_dir(directory) else { continue };
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_ascii_lowercase();
            if name.starts_with(prefix) && (name.ends_with("free") || name.ends_with("free.exe")) {
                let path = entry.path();
                if path.is_file() { return Some(path); }
            }
        }
    }
    None
}

fn find_office_executable(
    override_path: Option<&str>,
    names: &[&str],
    relative_paths: &[&str],
) -> Option<PathBuf> {
    if let Some(path) = override_path.filter(|path| !path.is_empty()).map(PathBuf::from) {
        return path.is_file().then_some(path);
    }
    if let Some(paths) = std::env::var_os("PATH") {
        for directory in std::env::split_paths(&paths) {
            for name in names {
                let candidate = directory.join(name);
                if candidate.is_file() { return Some(candidate); }
            }
        }
    }
    for root in ["ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA", "HOME"] {
        if let Some(directory) = std::env::var_os(root) {
            for relative in relative_paths {
                let candidate = PathBuf::from(&directory).join(relative);
                if candidate.is_file() { return Some(candidate); }
            }
            if names.iter().any(|name| name.eq_ignore_ascii_case("wps.exe")) {
                for suite_dir in ["WPS Office", "Kingsoft/WPS Office"] {
                    let suite_dir = PathBuf::from(&directory).join(suite_dir);
                    if let Ok(versions) = fs::read_dir(suite_dir) {
                        for version in versions.flatten() {
                            let candidate = version.path().join("office6/wps.exe");
                            if candidate.is_file() { return Some(candidate); }
                        }
                    }
                }
            }
        }
    }
    None
}

pub fn detect(overrides: &HashMap<String, String>) -> DocumentBackend {
    let mut office_suites = detect_office_suites(overrides);
    let libreoffice_path = office_suites.get("libreoffice").cloned().flatten();
    let (libreoffice_path, libreoffice_version) = libreoffice_path
        .and_then(|path| {
            let version = probe(&path, &["--headless", "--version"])
                .filter(|version| version.to_ascii_lowercase().contains("libreoffice"))?;
            Some((Some(path), Some(version)))
        })
        .unwrap_or((None, None));
    let openoffice_candidate = office_suites.get("openoffice").cloned().flatten();
    let (openoffice_path, openoffice_version) = openoffice_candidate
        .and_then(|path| {
            let version = probe(&path, &["--headless", "--version"])
                .filter(|version| version.to_ascii_lowercase().contains("openoffice"))?;
            Some((Some(path), Some(version)))
        })
        .unwrap_or((None, None));
    office_suites.insert("openoffice".into(), openoffice_path.clone());
    let office_paths = office_suites.iter().filter_map(|(key, path)| path.clone().map(|path| (key.clone(), path))).collect::<HashMap<_, _>>();
    let dxpdf_path = overrides
        .get("dxpdf")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("dxpdf"));
    let dxpdf_version = probe(&dxpdf_path, &["--version"])
        .filter(|version| version.to_ascii_lowercase().contains("dxpdf"));
    let dxpdf_path = dxpdf_version.as_ref().map(|_| dxpdf_path);
    let path = overrides
        .get("pandoc")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("pandoc"));
    let Some(version) = probe(&path, &["--version"]) else {
        return DocumentBackend {
            libreoffice_path,
            libreoffice_version,
            openoffice_path,
            openoffice_version,
            office_paths,
            dxpdf_path,
            dxpdf_version,
            ..Default::default()
        };
    };
    if !version.contains("pandoc")
        || !probe(&path, &["--help"]).is_some_and(|help| help.contains("--sandbox"))
    {
        return DocumentBackend {
            libreoffice_path,
            libreoffice_version,
            openoffice_path,
            openoffice_version,
            office_paths,
            dxpdf_path,
            dxpdf_version,
            ..Default::default()
        };
    }
    let readers = probe(&path, &["--list-input-formats"]).unwrap_or_default();
    let writers = probe(&path, &["--list-output-formats"]).unwrap_or_default();
    let directory =
        std::env::temp_dir().join(format!("santra-pandoc-probe-{}", uuid::Uuid::new_v4()));
    if fs::create_dir(&directory).is_err() {
        return DocumentBackend {
            libreoffice_path,
            libreoffice_version,
            openoffice_path,
            openoffice_version,
            office_paths,
            dxpdf_path,
            dxpdf_version,
            ..Default::default()
        };
    }
    let result = (|| {
        let source = directory.join("input.txt");
        fs::write(&source, "Santra local format probe\n").ok()?;
        let mut supported_writers = Vec::new();
        for &(extension, writer) in OUTPUTS {
            if !writers.lines().any(|line| line.trim() == writer) {
                continue;
            }
            let output = directory.join(format!("output.{extension}"));
            let mut command = Command::new(&path);
            command
                .args([
                    "--sandbox",
                    "--from=markdown-raw_html-raw_tex",
                    &format!("--to={writer}"),
                    "--output",
                ])
                .arg(&output)
                .arg("--")
                .arg(&source);
            if crate::media::captured(command, Duration::from_secs(15), || false).is_ok()
                && output.is_file()
            {
                supported_writers.push(extension.into());
            }
        }
        // Generate controlled probe fixtures when sandboxed binary writers are
        // unavailable. Only the fixed local probe text is passed to this step;
        // all conversions of user documents still require --sandbox.
        for (extension, writer) in [("docx", "docx"), ("epub", "epub")] {
            let fixture = directory.join(format!("output.{extension}"));
            if !fixture.is_file() && writers.lines().any(|line| line.trim() == writer) {
                let mut command = Command::new(&path);
                command
                    .args([
                        "--from=markdown-raw_html-raw_tex",
                        &format!("--to={writer}"),
                        "--output",
                    ])
                    .arg(&fixture)
                    .arg("--")
                    .arg(&source);
                let _ = crate::media::captured(command, Duration::from_secs(15), || false);
            }
        }
        let mut supported_readers = Vec::new();
        for &(extension, reader) in INPUTS {
            let base = reader.split(['+', '-']).next().unwrap_or(reader);
            if !readers.lines().any(|line| line.trim() == base) {
                continue;
            }
            let input = match extension {
                "docx" | "epub" if directory.join(format!("output.{extension}")).is_file() => {
                    directory.join(format!("output.{extension}"))
                }
                "docx" | "epub" => continue,
                _ => source.clone(),
            };
            let mut command = Command::new(&path);
            command
                .args(["--sandbox", &format!("--from={reader}"), "--to=plain", "--"])
                .arg(&input);
            if crate::media::captured(command, Duration::from_secs(15), || false).is_ok() {
                supported_readers.push(extension.into());
            }
        }
        fs::write(
            directory.join("input.html"),
            "<p>Santra local format probe</p>",
        )
        .ok()?;
        let mut pairs = Vec::new();
        for &(input_ext, reader) in INPUTS {
            if !supported_readers.iter().any(|value| value == input_ext) {
                continue;
            }
            let input = match input_ext {
                "docx" | "epub" => directory.join(format!("output.{input_ext}")),
                "html" => directory.join("input.html"),
                _ => source.clone(),
            };
            if !input.is_file() {
                continue;
            }
            for &(output_ext, writer) in OUTPUTS {
                if input_ext == output_ext
                    || !supported_writers.iter().any(|value| value == output_ext)
                {
                    continue;
                }
                let output = directory.join(format!("pair-{input_ext}-{output_ext}"));
                let mut command = Command::new(&path);
                command
                    .args([
                        "--sandbox",
                        &format!("--from={reader}"),
                        &format!("--to={writer}"),
                        "--output",
                    ])
                    .arg(&output)
                    .arg("--")
                    .arg(&input);
                if crate::media::captured(command, Duration::from_secs(15), || false).is_ok()
                    && fs::metadata(&output).is_ok_and(|m| m.is_file() && m.len() > 0)
                {
                    pairs.push((input_ext.into(), output_ext.into()));
                }
            }
        }
        Some(DocumentBackend {
            path: Some(path),
            libreoffice_path: libreoffice_path.clone(),
            libreoffice_version: libreoffice_version.clone(),
            openoffice_path: openoffice_path.clone(),
            openoffice_version: openoffice_version.clone(),
            office_paths: office_paths.clone(),
            dxpdf_path: dxpdf_path.clone(),
            dxpdf_version: dxpdf_version.clone(),
            readers: supported_readers,
            writers: supported_writers,
            pairs,
        })
    })()
    .unwrap_or_else(|| DocumentBackend {
        libreoffice_path,
        libreoffice_version,
        openoffice_path,
        openoffice_version,
        office_paths,
        dxpdf_path,
        dxpdf_version,
        ..Default::default()
    });
    let _ = fs::remove_dir_all(directory);
    result
}

impl DocumentBackend {
    pub fn info(&self) -> Value {
        json!({ "available": self.path.is_some() && !self.pairs.is_empty(),
            "readers": self.readers, "writers": self.writers })
    }

    pub fn dxpdf_info(&self) -> Value {
        json!({ "available": self.dxpdf_path.is_some(), "path": self.dxpdf_path,
            "version": self.dxpdf_version, "bundled": false })
    }

    pub fn libreoffice_info(&self) -> Value {
        json!({ "available": self.libreoffice_path.is_some(), "path": self.libreoffice_path,
            "version": self.libreoffice_version, "bundled": false })
    }

    pub fn openoffice_info(&self) -> Value {
        json!({ "available": self.openoffice_path.is_some(), "path": self.openoffice_path,
            "version": self.openoffice_version, "bundled": false })
    }

    pub fn freeoffice_info(&self, path: Option<PathBuf>) -> Value {
        json!({ "available": path.is_some(), "path": path, "bundled": false,
            "conversionSupported": false, "reason": "FreeOffice does not provide quiet PDF conversion." })
    }

    pub fn detected_office_path(&self, suite: &str) -> Option<PathBuf> {
        self.office_paths.get(suite).cloned()
    }

    pub fn supports(&self, input: &str, output: &str) -> bool {
        (output == "pdf" && self.office_pdf_backend(input).is_some())
            || (self.path.is_some()
                && self
                    .pairs
                    .iter()
                    .any(|(reader, writer)| reader == input && writer == output))
    }

    fn office_pdf_backend(&self, input: &str) -> Option<&'static str> {
        if cfg!(windows) {
            match input {
                "docx" if self.office_paths.contains_key("microsoft-word") => return Some("microsoft-word"),
                "docx" if self.office_paths.contains_key("wps-office") => return Some("wps-office"),
                "ppt" | "pptx" if self.office_paths.contains_key("microsoft-powerpoint") => return Some("microsoft-powerpoint"),
                _ => {}
            }
        }
        if matches!(input, "docx" | "ppt" | "pptx") && self.libreoffice_path.is_some() {
            return Some("libreoffice");
        }
        if cfg!(target_os = "linux")
            && matches!(input, "docx" | "ppt" | "pptx")
            && self.openoffice_path.is_some()
        {
            return Some("openoffice");
        }
        if input == "docx" && self.dxpdf_path.is_some() { return Some("dxpdf"); }
        None
    }

    pub fn capabilities(&self) -> Vec<Value> {
        let mut capabilities: Vec<Value> = Vec::new();
        for (input, category, label) in [
            ("docx", "document", "Convert DOCX to PDF"),
            ("ppt", "presentation", "Convert PPT to PDF"),
            ("pptx", "presentation", "Convert PPTX to PDF"),
        ] {
            if let Some(engine) = self.office_pdf_backend(input) {
                let name = match engine {
                    "microsoft-word" | "microsoft-powerpoint" => "Microsoft Office",
                    "wps-office" | "wps-presentation" => "WPS Office",
                    "libreoffice" => "LibreOffice",
                    "openoffice" => "Apache OpenOffice",
                    _ => "dxpdf",
                };
                capabilities.push(json!({
                    "id": format!("{category}:convert:{input}:pdf"), "operation": "convert",
                    "label": label, "category": category,
                    "inputs": [input], "outputs": ["pdf"], "backend": engine,
                    "available": true, "batch": true, "preservesMetadata": false,
                    "options": {},
                    "warning": format!("Rendered with detected {name}; layout may vary with fonts and supported Office features.")
                }));
            }
        }
        capabilities.extend(INPUTS.iter().filter_map(|(input, _)| {
            let outputs: Vec<&str> = self.pairs.iter().filter(|(reader, _)| reader == input)
                .map(|(_, writer)| writer.as_str()).collect();
            if outputs.is_empty() { return None; }
            Some(json!({ "id": format!("document:convert:{input}"), "operation": "convert", "label": "Convert documents", "category": "document",
                "inputs": [input], "outputs": outputs, "backend": "pandoc", "available": true,
                "batch": true, "preservesMetadata": false, "options": {},
                "warning": "Conversion may lose page layout, fonts, images and metadata; TXT retains text only." }))
        }));
        capabilities
    }

    pub fn run(
        &self,
        input: &Path,
        output: &Path,
        format: &str,
        cancelled: impl Fn() -> bool,
    ) -> Result<(), String> {
        let extension = input
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_ascii_lowercase();
        if !self.supports(&extension, format) {
            return Err("Document route is unavailable".into());
        }
        let info = fs::metadata(input).map_err(|error| error.to_string())?;
        if !info.is_file() || info.len() > MAX_DOCX_BYTES {
            return Err("Document exceeds 16 MiB".into());
        }
        let mut signature = [0_u8; 8];
        let count = File::open(input)
            .map_err(|error| error.to_string())?
            .read(&mut signature)
            .map_err(|error| error.to_string())?;
        if ["docx", "epub", "pptx"].contains(&extension.as_str())
            && !signature[..count].starts_with(b"PK\x03\x04")
        {
            return Err("Document signature does not match its extension".into());
        }
        if matches!(extension.as_str(), "docx" | "pptx") {
            validate_ooxml(input, &extension)?;
        }
        if extension == "ppt" && !signature[..count].starts_with(b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1") {
            return Err("PPT signature does not match its extension".into());
        }
        if format == "pdf" {
            match self.office_pdf_backend(&extension) {
                Some("libreoffice") => return self.run_office_cli(self.libreoffice_path.as_deref().ok_or("LibreOffice unavailable")?, input, output, &extension, cancelled),
                Some("openoffice") => return self.run_office_cli(self.openoffice_path.as_deref().ok_or("OpenOffice unavailable")?, input, output, &extension, cancelled),
                Some("microsoft-word") => return self.run_windows_office(input, output, "word", cancelled),
                Some("microsoft-powerpoint") => return self.run_windows_office(input, output, "powerpoint", cancelled),
                Some("wps-office") => return self.run_windows_office(input, output, "wps-word", cancelled),
                Some("wps-presentation") => return self.run_windows_office(input, output, "wps-powerpoint", cancelled),
                _ => {}
            }
        }
        if extension == "docx" && format == "pdf" && self.office_pdf_backend(&extension) == Some("dxpdf") {
            if cancelled() {
                return Err("Cancelled".into());
            }
            let dxpdf_path = self.dxpdf_path.as_ref().ok_or("dxpdf is unavailable")?;
            let mut command = Command::new(dxpdf_path);
            command.arg(input).args(["-o"]).arg(output);
            crate::media::captured(command, Duration::from_secs(120), &cancelled).map_err(
                |error| {
                    if error == "Cancelled" || error == "Local media backend timed out" {
                        error
                    } else {
                        "dxpdf could not render this DOCX file".into()
                    }
                },
            )?;
            if cancelled() {
                return Err("Cancelled".into());
            }
            let mut pdf_signature = [0_u8; 5];
            let count = File::open(output)
                .and_then(|mut file| file.read(&mut pdf_signature))
                .map_err(|_| "dxpdf did not create a PDF".to_string())?;
            if !pdf_signature[..count].starts_with(b"%PDF-") {
                return Err("dxpdf output is not a valid PDF".into());
            }
            return Ok(());
        }
        let reader = INPUTS
            .iter()
            .find(|entry| entry.0 == extension)
            .ok_or("Unsupported document input")?
            .1;
        let writer = OUTPUTS
            .iter()
            .find(|entry| entry.0 == format)
            .ok_or("Unsupported document output")?
            .1;
        let mut command = Command::new(self.path.as_ref().ok_or("Pandoc is unavailable")?);
        command
            .args([
                "--sandbox",
                &format!("--from={reader}"),
                &format!("--to={writer}"),
                "--output",
            ])
            .arg(output)
            .arg("--")
            .arg(input);
        crate::media::captured(command, Duration::from_secs(120), cancelled).map_err(|error| {
            if error == "Cancelled" || error == "Local media backend timed out" {
                error
            } else {
                "Local document backend failed; check the input and format".into()
            }
        })?;
        Ok(())
    }

    fn run_office_cli(
        &self,
        executable: &Path,
        input: &Path,
        output: &Path,
        extension: &str,
        cancelled: impl Fn() -> bool,
    ) -> Result<(), String> {
        let directory = std::env::temp_dir().join(format!("santra-office-{}", uuid::Uuid::new_v4()));
        let source_dir = directory.join("source");
        let output_dir = directory.join("output");
        let profile_dir = directory.join("profile");
        fs::create_dir_all(&source_dir).map_err(|_| "Could not prepare local conversion".to_string())?;
        fs::create_dir_all(&output_dir).map_err(|_| "Could not prepare local conversion".to_string())?;
        fs::create_dir_all(&profile_dir).map_err(|_| "Could not prepare local conversion".to_string())?;
        let source = source_dir.join(format!("input.{extension}"));
        fs::copy(input, &source).map_err(|_| "Could not stage document for conversion".to_string())?;
        let profile_url = file_url(&profile_dir);
        let filter = if extension == "ppt" || extension == "pptx" {
            "impress_pdf_Export"
        } else {
            "writer_pdf_Export"
        };
        let mut command = Command::new(executable);
        command
            .arg("--headless")
            .arg("--nologo")
            .arg("--nodefault")
            .arg("--nolockcheck")
            .arg("--nofirststartwizard")
            .arg(format!("-env:UserInstallation={profile_url}"))
            .args(["--convert-to", &format!("pdf:{filter}"), "--outdir"])
            .arg(&output_dir)
            .arg(&source);
        let result = crate::media::captured(command, Duration::from_secs(180), &cancelled)
            .map_err(|error| if error == "Cancelled" || error == "Local media backend timed out" {
                error
            } else {
                "Local office suite could not convert this document".into()
            });
        if let Err(error) = result {
            let _ = fs::remove_dir_all(&directory);
            return Err(error);
        }
        if cancelled() {
            let _ = fs::remove_dir_all(&directory);
            return Err("Cancelled".into());
        }
        let generated = output_dir.join("input.pdf");
        let result = (|| {
            let mut signature = [0_u8; 5];
            let count = File::open(&generated)
                .and_then(|mut file| file.read(&mut signature))
                .map_err(|_| "Office suite did not create a PDF".to_string())?;
            if !signature[..count].starts_with(b"%PDF-") {
                return Err("Office suite output is not a valid PDF".into());
            }
            fs::copy(&generated, output).map_err(|_| "Could not save converted PDF".to_string())?;
            Ok(())
        })();
        let _ = fs::remove_dir_all(&directory);
        result
    }

    fn run_windows_office(
        &self,
        input: &Path,
        output: &Path,
        engine: &str,
        cancelled: impl Fn() -> bool,
    ) -> Result<(), String> {
        if !cfg!(windows) { return Err("Microsoft Office and WPS automation is only available on Windows".into()); }
        let directory = std::env::temp_dir().join(format!("santra-com-{}", uuid::Uuid::new_v4()));
        let source_dir = directory.join("source");
        let output_dir = directory.join("output");
        fs::create_dir_all(&source_dir).map_err(|_| "Could not prepare local conversion".to_string())?;
        fs::create_dir_all(&output_dir).map_err(|_| "Could not prepare local conversion".to_string())?;
        let source = source_dir.join(format!("input.{}", input.extension().and_then(|e| e.to_str()).unwrap_or("docx")));
        let generated = output_dir.join("input.pdf");
        fs::copy(input, &source).map_err(|_| "Could not stage document for conversion".to_string())?;
        let script = directory.join("convert.ps1");
        fs::write(&script, WINDOWS_OFFICE_SCRIPT).map_err(|_| "Could not prepare Office conversion".to_string())?;
        let mut command = Command::new("powershell.exe");
        command.args(["-NoLogo", "-NoProfile", "-NonInteractive", "-STA", "-ExecutionPolicy", "Bypass", "-File"])
            .arg(&script).arg("-Engine").arg(engine).arg("-Source").arg(&source).arg("-Output").arg(&generated);
        let result = crate::media::captured(command, Duration::from_secs(180), &cancelled)
            .map_err(|error| if error == "Cancelled" || error == "Local media backend timed out" { error } else { "Office suite could not convert this file".into() });
        let outcome = result.and_then(|_| {
            let mut signature = [0_u8; 5];
            let count = File::open(&generated).and_then(|mut file| file.read(&mut signature))
                .map_err(|_| "Office suite did not create a PDF".to_string())?;
            if !signature[..count].starts_with(b"%PDF-") { return Err("Office suite output is not a valid PDF".into()); }
            fs::copy(&generated, output).map_err(|_| "Could not save converted PDF".to_string())?;
            Ok(())
        });
        let _ = fs::remove_dir_all(&directory);
        outcome
    }
}

const WINDOWS_OFFICE_SCRIPT: &str = r#"
param([string]$Engine, [string]$Source, [string]$Output)
$ErrorActionPreference = 'Stop'
$app = $null; $document = $null
try {
  switch ($Engine) {
    'word' { $app = New-Object -ComObject Word.Application }
    'wps-word' { $app = New-Object -ComObject KWPS.Application }
    'powerpoint' { $app = New-Object -ComObject PowerPoint.Application }
    'wps-powerpoint' { $app = New-Object -ComObject KWPP.Application }
    default { throw 'Unknown office engine' }
  }
  try { $app.AutomationSecurity = 3 } catch {}
  try { $app.AskToUpdateLinks = $false } catch {}
  try { $app.Options.UpdateLinksAtOpen = $false } catch {}
  try { $app.Visible = $false } catch {}
  try { $app.DisplayAlerts = 0 } catch {}
  if ($Engine -like '*powerpoint') {
    $document = $app.Presentations.Open($Source, $true, $false, $false)
    $document.SaveAs($Output, 32)
    $document.Close()
  } else {
    $document = $app.Documents.Open($Source, $false, $true, $false, '', '', $false, '', '', 0, 0, $false, $true, 0, $true, '')
    $document.ExportAsFixedFormat($Output, 17)
    $document.Close(0)
  }
  exit 0
} finally {
  if ($document -ne $null) { try { $document.Close(0) } catch {} }
  if ($app -ne $null) { try { $app.Quit() } catch {} }
}
"#;

fn file_url(path: &Path) -> String {
    let path = path.to_string_lossy().replace('\\', "/");
    let path = path.bytes().map(|byte| match byte {
        b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'/' | b':' | b'-' | b'_' | b'.' | b'~' => (byte as char).to_string(),
        _ => format!("%{byte:02X}"),
    }).collect::<String>();
    if cfg!(windows) { format!("file:///{path}") } else { format!("file://{path}") }
}

fn validate_ooxml(input: &Path, extension: &str) -> Result<(), String> {
    let bytes = fs::read(input).map_err(|error| error.to_string())?;
    let mut archive = zip::ZipArchive::new(Cursor::new(&bytes))
        .map_err(|_| "Office package is invalid".to_string())?;
    if archive.len() > MAX_DOCX_ENTRIES {
        return Err("Office package contains too many entries".into());
    }
    let required = if extension == "pptx" { "ppt/presentation.xml" } else { "word/document.xml" };
    let mut found = false;
    let mut expanded = 0_u64;
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|_| "Office package is invalid".to_string())?;
        if entry.name() == required { found = true; }
        if entry.size() > MAX_DOCX_EXPANDED_BYTES.saturating_sub(expanded) {
            return Err("Office package expands beyond 128 MiB".into());
        }
        let remaining = MAX_DOCX_EXPANDED_BYTES.saturating_sub(expanded);
        let actual = io::copy(&mut entry.by_ref().take(remaining + 1), &mut io::sink())
            .map_err(|_| "Office package is invalid".to_string())?;
        if actual > remaining { return Err("Office package expands beyond 128 MiB".into()); }
        expanded = expanded.saturating_add(actual);
    }
    if !found { return Err("Office package is missing its main document".into()); }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn advertised_document_routes_are_pairwise_probed() {
        let backend = detect(&HashMap::new());
        if backend.path.is_some() {
            assert!(
                backend.supports("md", "txt"),
                "the local sandbox must convert the Markdown fixture to text"
            );
        }
        for capability in backend.capabilities() {
            let input = capability["inputs"][0].as_str().unwrap();
            for output in capability["outputs"].as_array().unwrap() {
                assert!(backend.supports(input, output.as_str().unwrap()));
                assert_ne!(input, output.as_str().unwrap());
            }
            assert!(!backend.supports(input, "rtf"));
        }
        assert!(!backend.supports("rtf", "txt"));
    }
}
