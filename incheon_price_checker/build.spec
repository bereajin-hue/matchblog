# PyInstaller spec — 프롬프트 9에서 완성
# pyinstaller build.spec 으로 빌드
block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[('prompts', 'prompts')],   # prompts/ 폴더를 EXE에 포함
    hiddenimports=[],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    name='incheon_price_checker',
    debug=False,
    console=False,       # GUI 앱: 콘솔창 숨김
    icon=None,
)
