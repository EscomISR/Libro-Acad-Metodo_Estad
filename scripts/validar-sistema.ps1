$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Failures = New-Object System.Collections.Generic.List[string]
$IgnoredDirs = @(".git", ".agents", ".codex", "scripts")
$TextExtensions = @(".html", ".css", ".js", ".json")

function Get-RelativePath {
    param([string]$Path)
    $rootWithSlash = $Root.TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
    $rootUri = New-Object System.Uri($rootWithSlash)
    $pathUri = New-Object System.Uri($Path)
    return [uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString())
}

function Add-Failure {
    param([string]$Path, [string]$Message)
    $Failures.Add("$(Get-RelativePath $Path): $Message")
}

function Read-Utf8 {
    param([string]$Path)
    return Get-Content -LiteralPath $Path -Raw -Encoding UTF8
}

function Get-CleanReference {
    param([string]$Value)
    $hashIndex = $Value.IndexOf("#")
    $queryIndex = $Value.IndexOf("?")
    $cutPoints = @()
    if ($hashIndex -ge 0) { $cutPoints += $hashIndex }
    if ($queryIndex -ge 0) { $cutPoints += $queryIndex }
    if ($cutPoints.Count -eq 0) { return $Value }
    return $Value.Substring(0, ($cutPoints | Measure-Object -Minimum).Minimum)
}

function Get-HashReference {
    param([string]$Value)
    $hashIndex = $Value.IndexOf("#")
    if ($hashIndex -lt 0) { return "" }
    $queryIndex = $Value.IndexOf("?", $hashIndex)
    $endIndex = if ($queryIndex -ge 0) { $queryIndex } else { $Value.Length }
    return $Value.Substring($hashIndex + 1, $endIndex - $hashIndex - 1)
}

function Test-ExternalReference {
    param([string]$Value)
    return $Value -match "^(https?:|mailto:|tel:|data:|javascript:|blob:)"
}

function Test-Anchor {
    param([string]$Content, [string]$Hash)
    if ([string]::IsNullOrWhiteSpace($Hash)) { return $true }

    try {
        $decodedHash = [uri]::UnescapeDataString($Hash)
    } catch {
        $decodedHash = $Hash
    }

    $escapedHash = [regex]::Escape($decodedHash)
    return $Content -match "\b(?:id|name)=[""']$escapedHash[""']"
}

function Get-TargetPath {
    param([string]$FilePath, [string]$Value)
    $cleanValue = Get-CleanReference $Value.Trim()
    if ([string]::IsNullOrWhiteSpace($cleanValue)) { return $FilePath }

    try {
        $decodedValue = [uri]::UnescapeDataString($cleanValue)
    } catch {
        $decodedValue = $cleanValue
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Split-Path $FilePath -Parent) $decodedValue))
}

function Assert-Exists {
    param([string]$BasePath, [string]$RelativePath, [string]$OwnerPath, [string]$Label)
    $targetPath = [System.IO.Path]::GetFullPath((Join-Path $BasePath $RelativePath))
    if (-not (Test-Path -LiteralPath $targetPath)) {
        Add-Failure $OwnerPath "$Label no existe: $RelativePath"
    }
}

function Validate-Html {
    param([string]$FilePath, [string]$Content)

    $fileName = Split-Path $FilePath -Leaf
    if ($fileName -cne $fileName.ToLowerInvariant()) {
        Add-Failure $FilePath "el nombre del archivo HTML debe estar en minusculas"
    }

    $checks = @(
        @{ Pattern = "<style\b"; Message = "contiene CSS embebido en una etiqueta <style>" },
        @{ Pattern = "<script\b(?![^>]*\bsrc=)"; Message = "contiene JavaScript embebido sin src" },
        @{ Pattern = "\sstyle=[""']"; Message = "contiene estilos inline" },
        @{ Pattern = "\son\w+=[""']"; Message = "contiene manejadores de eventos inline" },
        @{ Pattern = "Unidades\.html"; Message = "conserva una referencia antigua a Unidades.html"; CaseSensitive = $true },
        @{ Pattern = "Actividad_3_"; Message = "conserva una referencia antigua a Actividad_3_*"; CaseSensitive = $true },
        @{ Pattern = "[""'(=]\s*(?:\.\./)?IMAGENES/(?:IPNb|logoenmh|logoenmh1|logoenmh2)\.png"; Message = "usa un logo comun fuera de RECURSOS/img" },
        @{ Pattern = "[""'(=]\s*(?:\.\./)?UNIDAD_\d/img/(?:IPNb|logoenmh2)\.png"; Message = "usa un logo comun duplicado dentro de una unidad" },
        @{ Pattern = "<div\s+class=[""']figure-container[""']"; Message = "usa div.figure-container en vez de figure.figure-container" },
        @{ Pattern = "<(?:div|p)\s+class=[""']figure-caption[""']"; Message = "usa div/p.figure-caption en vez de figcaption.figure-caption" }
    )

    foreach ($check in $checks) {
        $hasMatch = if ($check.CaseSensitive) {
            $Content -cmatch $check.Pattern
        } else {
            $Content -match $check.Pattern
        }

        if ($hasMatch) {
            Add-Failure $FilePath $check.Message
        }
    }

    $roleButtons = [regex]::Matches($Content, "<[^>]+\brole=[""']button[""'][^>]*>", "IgnoreCase")
    foreach ($button in $roleButtons) {
        if ($button.Value -notmatch "\btabindex=[""']0[""']") {
            Add-Failure $FilePath "un elemento role=""button"" no incluye tabindex=""0"""
            break
        }
    }

    $refs = [regex]::Matches($Content, "\b(?:href|src)=[""']([^""']+)[""']", "IgnoreCase")
    foreach ($ref in $refs) {
        $value = $ref.Groups[1].Value.Trim()
        if ([string]::IsNullOrWhiteSpace($value) -or (Test-ExternalReference $value)) { continue }

        $targetPath = Get-TargetPath $FilePath $value
        $hash = Get-HashReference $value

        if (-not (Test-Path -LiteralPath $targetPath)) {
            Add-Failure $FilePath "referencia local inexistente: $value"
            continue
        }

        if (-not [string]::IsNullOrWhiteSpace($hash) -and [System.IO.Path]::GetExtension($targetPath).ToLowerInvariant() -eq ".html") {
            $targetContent = Read-Utf8 $targetPath
            if (-not (Test-Anchor $targetContent $hash)) {
                Add-Failure $FilePath "ancla inexistente en $(Get-RelativePath $targetPath): #$hash"
            }
        }
    }
}

function Validate-TextEncoding {
    param([string]$FilePath, [string]$Content)
    if ($Content -match "[\u00C3\u00C2\uFFFD]") {
        Add-Failure $FilePath "posible texto con codificacion mojibake"
    }
}

function Validate-CssOrJs {
    param([string]$FilePath, [string]$Content)
    if ($Content -match "\bconsole\.log\s*\(") {
        Add-Failure $FilePath "contiene console.log"
    }
    if ($Content -match "\bdebugger\b") {
        Add-Failure $FilePath "contiene debugger"
    }
}

$navigationPath = Join-Path $Root "RECURSOS/data/navegacion.json"
if (-not (Test-Path -LiteralPath $navigationPath)) {
    $Failures.Add("RECURSOS/data/navegacion.json: no existe")
} else {
    $navigationData = Read-Utf8 $navigationPath | ConvertFrom-Json
    Assert-Exists $Root $navigationData.inicio $navigationPath "inicio"
    Assert-Exists $Root $navigationData.unidades $navigationPath "unidades"

    foreach ($asset in $navigationData.recursosComunes.PSObject.Properties.Value) {
        Assert-Exists $Root $asset $navigationPath "recurso comun"
    }

    foreach ($unidad in $navigationData.unidadesTematicas) {
        Assert-Exists $Root $unidad.indice $navigationPath "indice de unidad $($unidad.numero)"
        Assert-Exists $Root $unidad.referencias $navigationPath "referencias de unidad $($unidad.numero)"

        foreach ($tema in $unidad.temas) {
            Assert-Exists $Root $tema.archivo $navigationPath "tema $($tema.id)"
            Assert-Exists $Root $tema.actividad $navigationPath "actividad $($tema.id)"
        }
    }
}

$files = Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object {
    $relativeParts = (Get-RelativePath $_.FullName).Split("/")
    -not ($relativeParts | Where-Object { $IgnoredDirs -contains $_ })
}

foreach ($file in $files) {
    $extension = $file.Extension.ToLowerInvariant()
    if ($TextExtensions -notcontains $extension) { continue }

    $content = Read-Utf8 $file.FullName
    Validate-TextEncoding $file.FullName $content

    if ($extension -eq ".html") { Validate-Html $file.FullName $content }
    if ($extension -eq ".css" -or $extension -eq ".js") { Validate-CssOrJs $file.FullName $content }
}

if ($Failures.Count -gt 0) {
    Write-Error "Validacion con incidencias:`n- $($Failures -join "`n- ")"
    exit 1
}

Write-Host "Validacion completada sin incidencias."
