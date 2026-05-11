# Auto-logger for UserPromptSubmit hook.
# Called by Claude Code on every user prompt. Reads JSON from stdin, appends one
# JSONL entry per prompt to prompts.jsonl. Multiple Claude Code windows in the
# same project all write here (append-only is concurrency-safe enough for this).

$ErrorActionPreference = 'SilentlyContinue'

try {
    $raw = [Console]::In.ReadToEnd()
    if (-not $raw) { exit 0 }

    $payload = $raw | ConvertFrom-Json
    $prompt = $payload.prompt
    if (-not $prompt) { exit 0 }

    # Skip slash commands (e.g. /nyilatkozat, /clear, /compact) and empty prompts
    if ($prompt -match '^\s*/') { exit 0 }
    if ($prompt.Trim().Length -lt 3) { exit 0 }

    # Heuristic category detection — best-effort, manually re-categorize later if needed.
    $category = 'Programkód generálása'
    if ($prompt -match '(?i)(readme|dokumentáci|leírás|telepít|install|describe|magyará)') {
        $category = 'Szövegblokkok létrehozása'
    }
    elseif ($prompt -match '(?i)(ötlet|javasl|hogyan kezdj|melyik a jobb|architektú|tervezz|approach|design|best practice)') {
        $category = 'Új ötletek, megoldási javaslatok generálása'
    }
    elseif ($prompt -match '(?i)(ábr|chart|grafikon|vizualizáci|plot)') {
        $category = 'Adatvizualizáció, grafikonok generálása adatpontok alapján'
    }
    elseif ($prompt -match '(?i)(vázlat|outline|szerkeze|szekciók|fejezetek)') {
        $category = 'Vázlat létrehozása'
    }

    $entry = [ordered]@{
        timestamp = (Get-Date -Format "o")
        category  = $category
        tool      = "Claude Code (Opus 4.7)"
        prompt    = $prompt
        files     = ""
        notes     = "auto-logged"
    }

    $json = $entry | ConvertTo-Json -Compress -Depth 4
    $logPath = Join-Path $PSScriptRoot "prompts.jsonl"

    # Best-effort retry on contention from multiple Claude Code windows.
    for ($i = 0; $i -lt 5; $i++) {
        try {
            Add-Content -Path $logPath -Value $json -Encoding utf8 -ErrorAction Stop
            break
        } catch {
            Start-Sleep -Milliseconds 50
        }
    }
}
catch {
    # Never break the user's prompt flow — swallow all errors.
}
exit 0
