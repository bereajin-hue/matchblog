# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec — pyinstaller build.spec 으로 단일 EXE 빌드
# 빌드: cd incheon_price_checker && pyinstaller build.spec

import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# google-genai / google-auth 의 데이터 파일 포함
datas = [
    ('prompts', 'prompts'),              # Gemini 판정 프롬프트
]
datas += collect_data_files('google.genai')
datas += collect_data_files('google.auth')
datas += collect_data_files('certifi')

# google-genai 하위 모듈 전체 포함 (동적 임포트 대응)
hiddenimports = (
    collect_submodules('google.genai')
    + collect_submodules('google.auth')
    + collect_submodules('google.api_core')
    + [
        'rapidfuzz',
        'rapidfuzz.distance',
        'tenacity',
        'openpyxl',
        'openpyxl.styles',
        'openpyxl.utils',
        'requests',
        'tkinter',
        'tkinter.ttk',
        'tkinter.filedialog',
        'tkinter.messagebox',
        # 프로젝트 모듈
        'pipeline',
        'config',
        'core.excel_io',
        'core.keyword',
        'core.naver_api',
        'core.prefilter',
        'core.ai_matcher',
        'core.normalizer',
        'core.judge',
        'utils.unit_parser',
        'utils.cache',
        'utils.logger',
    ]
)

a = Analysis(
    ['app.py'],
    pathex=[os.path.abspath('.')],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'pandas', 'scipy', 'PIL'],
    noarchive=False,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='incheon_price_checker',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,          # GUI 앱: 콘솔창 숨김
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon='assets/icon.ico',   # 아이콘 파일이 있으면 주석 해제
)
