[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet(
        'Irodalomkutatás',
        'Programkód generálása',
        'Új ötletek, megoldási javaslatok generálása',
        'Vázlat létrehozása',
        'Szövegblokkok létrehozása',
        'Képek generálása illusztrációs célból',
        'Adatvizualizáció, grafikonok generálása adatpontok alapján',
        'Prezentáció készítése',
        'Egyéb'
    )]
    [string]$Category,

    [Parameter(Mandatory=$true)]
    [string]$Tool,

    [Parameter(Mandatory=$true)]
    [string]$Prompt,

    [string]$Files = "",
    [string]$Notes = ""
)

$entry = [ordered]@{
    timestamp = (Get-Date -Format "o")
    category  = $Category
    tool      = $Tool
    prompt    = $Prompt
    files     = $Files
    notes     = $Notes
}

$json = ($entry | ConvertTo-Json -Compress)
$logPath = Join-Path $PSScriptRoot "prompts.jsonl"
Add-Content -Path $logPath -Value $json -Encoding utf8

Write-Host "[+] Logged: [$Category] $($Prompt.Substring(0, [Math]::Min(80, $Prompt.Length)))..."
