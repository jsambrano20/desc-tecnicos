#!/usr/bin/env python3
"""Renomeia as fotos de fotos/ para fotos/<slug-do-tecnico>.jpg (redimensiona p/ web).
Usa fotos/lista.txt (linha N = tecnico N de tecnicos.csv) para casar cada foto com o tecnico.
Originais sao movidos para fotos/originais/. Rode: python organizar_fotos.py"""
import csv, re, shutil, unicodedata, sys
from pathlib import Path
from urllib.parse import unquote
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).parent
FOTOS = ROOT / "fotos"; ORIG = FOTOS / "originais"; ORIG.mkdir(exist_ok=True)
MAXSIDE, QUALITY = 800, 85
norm = lambda s: re.sub(r"[\s_]+", "_", unicodedata.normalize("NFC", unquote(s))).strip("_").lower()

with open(ROOT / "tecnicos.csv", encoding="utf-8-sig", newline="") as f:
    rows = list(csv.reader(f, delimiter=";"))[1:]           # numero;tecnico;pais;arquivo;descricao
lines = [l.strip() for l in open(FOTOS / "lista.txt", encoding="utf-8-sig").read().splitlines() if l.strip()]
assert len(lines) == len(rows), f"lista.txt tem {len(lines)} linhas, esperado {len(rows)}"

# indice dos arquivos existentes (sem contar originais/ e os ja convertidos)
files = {}
for p in FOTOS.iterdir():
    if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"}:
        key = norm(re.sub(r" \(\d+\)(?=\.\w+$)", "", p.name))   # tira "(1)" de copias
        files.setdefault(key, []).append(p)

def to_rgb(im):
    im = ImageOps.exif_transpose(im)
    if im.mode in ("I;16", "I;16B", "I", "F"):
        im = im.point(lambda x: x / 256).convert("L") if im.mode.startswith("I") else im.convert("L")
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, "white"); bg.paste(im, mask=im.split()[-1]); return bg
    return im.convert("RGB")

ok, sem_imagem, faltando, erros = [], [], [], []
for (num, nome, _, dest, *_), line in zip(rows, lines):
    target = ROOT / dest
    if line.upper().startswith("SEM-IMAGEM"):
        sem_imagem.append(nome); continue
    key = norm(line.split("File:", 1)[-1])
    srcs = files.get(key)
    if not srcs:
        faltando.append(nome); continue
    try:
        with Image.open(srcs[0]) as im:
            im = to_rgb(im); im.thumbnail((MAXSIDE, MAXSIDE), Image.LANCZOS)
            im.save(target, "JPEG", quality=QUALITY, optimize=True)
        for p in srcs:                                         # guarda originais (e copias)
            if p.resolve() != target.resolve():
                shutil.move(str(p), str(ORIG / p.name))
        ok.append(nome)
    except Exception as e:
        erros.append(f"{nome}: {e}")

print(f"Fotos prontas: {len(ok)}")
print(f"Sem imagem na lista (usam avatar): {len(sem_imagem)} -> {', '.join(sem_imagem)}")
print(f"Foto nao encontrada na pasta: {len(faltando)} -> {', '.join(faltando)}")
print(f"Erros: {len(erros)}" + ("" if not erros else "\n  " + "\n  ".join(erros)))
