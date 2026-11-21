"""Validate the shipped CFF font. No runtime metadata is generated.

Development only: python -m pip install 'fonttools[woff]==4.60.1'
Run from the repository root.
"""
import hashlib
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / 'src/assets/yugioh-card/yugioh/font/ygo-jp.woff2'


def check():
    font = TTFont(FONT)
    assert font['head'].unitsPerEm == 1024
    glyphs = font.getGlyphSet()
    for name in font.getGlyphOrder():
        glyphs[name].draw(BoundsPen(glyphs))
        assert font['CFF '].cff.topDictIndex[0].CharStrings[name].width == font['hmtx'][name][0], name
    cmap = font.getBestCmap()
    for char in '日あ':
        assert font['hmtx'][cmap[ord(char)]][0] == 1024, char
    for char in '０１２３４５６７８９':
        assert font['hmtx'][cmap[ord(char)]][0] == 702, char
    fingerprint = hashlib.sha256(FONT.read_bytes()).hexdigest()
    print(f'Checked {len(glyphs)} glyph widths, {len(cmap)} characters; SHA-256 {fingerprint}')


if __name__ == '__main__':
    check()
