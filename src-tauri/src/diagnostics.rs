use std::{collections::VecDeque, fs, io::Write, path::PathBuf, sync::{Mutex, OnceLock}};
use time::OffsetDateTime;

static DIAGNOSTICS: OnceLock<Diagnostics> = OnceLock::new();

struct Diagnostics {
    directory: PathBuf,
    session_file: PathBuf,
    events: Mutex<VecDeque<String>>,
}

pub fn init(directory: PathBuf) -> Result<(), String> {
    fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&directory, fs::Permissions::from_mode(0o700))
            .map_err(|e| e.to_string())?;
    }
    let session_file = directory.join(format!("{}.txt", timestamp(OffsetDateTime::now_utc())));
    let session = fs::OpenOptions::new().create(true).append(true).open(&session_file)
        .map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        session.set_permissions(fs::Permissions::from_mode(0o600))
            .map_err(|e| e.to_string())?;
    }
    DIAGNOSTICS.set(Diagnostics { directory, session_file, events: Mutex::new(VecDeque::new()) })
        .map_err(|_| "Diagnostics already initialized".to_string())?;
    event("application started");
    std::panic::set_hook(Box::new(|info| {
        // Panic payloads and locations may contain private paths or content.
        failure("rust-panic", "The Rust host panicked");
        eprintln!("Santra panic: {info}");
    }));
    Ok(())
}

pub fn logs_directory(home: PathBuf) -> PathBuf {
    home.join(".santra").join("logs")
}

pub fn event(message: &str) {
    let Some(state) = DIAGNOSTICS.get() else { return };
    let Ok(mut events) = state.events.lock() else { return };
    if events.len() == 200 { events.pop_front(); }
    let line = format!("{} {message}", OffsetDateTime::now_utc());
    events.push_back(line.clone());
    if let Ok(mut file) = fs::OpenOptions::new().append(true).open(&state.session_file) {
        let _ = writeln!(file, "{line}");
    }
}

pub fn failure(kind: &str, summary: &str) {
    write_report(kind, summary);
}

fn write_report(kind: &str, summary: &str) {
    let Some(state) = DIAGNOSTICS.get() else { return };
    let now = OffsetDateTime::now_utc();
    let filename = format!("{}.txt", timestamp(now));
    let path = state.directory.join(filename);
    let Ok(mut file) = fs::OpenOptions::new().create(true).append(true).open(path) else { return };
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = file.set_permissions(fs::Permissions::from_mode(0o600));
    }
    let _ = writeln!(file, "Santra diagnostic\nVersion: {}\nPlatform: {}\nTime (UTC): {now}\nFailure: {kind}\nSummary: {summary}\nRecent events:",
        env!("CARGO_PKG_VERSION"), std::env::consts::OS);
    if let Ok(events) = state.events.try_lock() {
        for event in events.iter() { let _ = writeln!(file, "{event}"); }
    }
    let _ = writeln!(file);
}

fn timestamp(now: OffsetDateTime) -> String {
    format!("{:02}{:02}{:02}{:02}{:02}{:02}",
        now.day(), now.month() as u8, now.year() % 100, now.hour(), now.minute(), now.second())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn writes_timestamped_failure_file() {
        let home = std::env::temp_dir().join(format!("santra-diagnostic-test-{}", uuid::Uuid::new_v4()));
        let directory = logs_directory(home.clone());
        assert!(!directory.exists());
        init(directory.clone()).unwrap();
        assert!(directory.is_dir());
        event("test job: processing");
        let session = DIAGNOSTICS.get().unwrap().session_file.clone();
        assert!(fs::read_to_string(&session).unwrap().contains("test job: processing"));
        failure("job-failed", "Test job failed");
        let files: Vec<_> = fs::read_dir(&directory).unwrap().map(|entry| entry.unwrap().path()).collect();
        assert!(!files.is_empty());
        let report = files.iter().find(|path| fs::read_to_string(path).unwrap().contains("Failure: job-failed")).unwrap();
        let name = report.file_name().unwrap().to_string_lossy();
        assert_eq!(name.len(), 16);
        assert!(name.ends_with(".txt"));
        assert!(name[..12].bytes().all(|byte| byte.is_ascii_digit()));
        let contents = fs::read_to_string(report).unwrap();
        assert!(contents.contains("test job: processing"));
        assert!(contents.contains("Failure: job-failed"));
        println!("Diagnostic file: {}", report.display());
    }
}
