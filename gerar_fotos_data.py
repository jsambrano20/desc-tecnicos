#!/usr/bin/env python3
"""Gera fotos_data.js: miniaturas embutidas (data URI) usadas so para desenhar a foto no card
quando o app e aberto direto do disco (file://). Rode de novo se trocar fotos: python gerar_fotos_data.py"""
import base64, csv, io, json, os
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).parent
rows = list(csv.reader(open(ROOT / "tecnicos.csv", encoding="utf-8-sig", newline=""), delimiter=";"))[1:]
out = {}
for r in rows:
    p = ROOT / r[3]
    if not p.exists(): continue
    with Image.open(p) as im:
        im = im.convert("RGB"); im.thumbnail((360, 360), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "JPEG", quality=78, optimize=True)
    out[os.path.splitext(os.path.basename(r[3]))[0]] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
(ROOT / "fotos_data.js").write_text("window.FOTOS = " + json.dumps(out) + ";\n", encoding="utf-8")
print(len(out), "fotos embutidas;", round((ROOT / "fotos_data.js").stat().st_size / 1e6, 2), "MB")
