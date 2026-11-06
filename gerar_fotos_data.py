#!/usr/bin/env python3
"""Gera fotos_data.js: miniaturas embutidas (data URI) usadas só para desenhar a foto no card
quando o app é aberto direto do disco (file://). Lê as fotos de fotos/<nome-do-tecnico>.jpg.
Rode de novo ao trocar ou adicionar fotos:  python gerar_fotos_data.py   (requer: pip install pillow)"""
import base64, io, json, re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
out = {}
for p in sorted((ROOT / "fotos").glob("*.jpg")):
    if not re.fullmatch(r"[a-z0-9-]+", p.stem):   # ignora arquivos fora do padrão (ex.: cópias com espaço)
        continue
    with Image.open(p) as im:
        im = im.convert("RGB"); im.thumbnail((360, 360), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "JPEG", quality=78, optimize=True)
    out[p.stem] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
(ROOT / "fotos_data.js").write_text("window.FOTOS = " + json.dumps(out) + ";\n", encoding="utf-8")
print(len(out), "fotos embutidas;", round((ROOT / "fotos_data.js").stat().st_size / 1e6, 2), "MB")
