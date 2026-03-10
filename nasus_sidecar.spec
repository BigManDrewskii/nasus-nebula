# nasus_sidecar.spec
# PyInstaller spec — bundles nasus_stack/nasus_sidecar into a standalone binary.
# Run from repo root:
#   pip install pyinstaller
#   pyinstaller nasus_sidecar.spec --clean
# Then the binary is at dist/nasus-sidecar (mac/linux) or dist/nasus-sidecar.exe (windows)
# build-sidecar.sh calls this and copies the binary to src-tauri/sidecar/ automatically.

import sys
from pathlib import Path

ROOT = Path(SPECPATH)
SIDECAR_DIR = ROOT / "nasus_stack" / "nasus_sidecar"
STACK_DIR = ROOT / "nasus_stack"

block_cipher = None

a = Analysis(
    [str(SIDECAR_DIR / "__main__.py")],
    pathex=[str(ROOT), str(STACK_DIR), str(SIDECAR_DIR)],
    binaries=[],
    datas=[
        # Bundle the full nasus_stack Python package
        (str(STACK_DIR), "nasus_stack"),
        # Bundle any prompt templates or config files
        (str(SIDECAR_DIR / "prompts"), "nasus_sidecar/prompts") if (SIDECAR_DIR / "prompts").exists() else (".", "."),
    ],
    hiddenimports=[
        "uvicorn",
        "uvicorn.lifespan.on",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.loops.auto",
        "fastapi",
        "fastapi.middleware.cors",
        "starlette.responses",
        "starlette.background",
        "anyio",
        "anyio._backends._asyncio",
        "httpx",
        "pydantic",
        "pydantic.deprecated.class_validators",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "notebook", "IPython"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="nasus-sidecar",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
