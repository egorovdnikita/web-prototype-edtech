#!/usr/bin/env python3
"""Монтаж промо-ролика из записи record.py: холст GitHub Dark, кадр телефона, камера, кольца касаний.

    python scripts/promo/compose.py ПАПКА [--out файл.webp] [--fps 30] [--keys 0.5]

`--keys ШАГ` сохраняет контрольные PNG каждые ШАГ секунд (и стык петли) без кодирования WebP.
"""
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, _webp

OUT_W, OUT_H = 1600, 880
K = 1.25                       # px холста на pt, как у Agent Pulse (1280 pt → 1600 px)
BG = "#0d1117"                 # GitHub Dark --bgColor-default
EDGE = "#3d444d"               # GitHub Dark --borderColor-default
SCREEN_H = 760                 # высота экрана телефона на общем плане, px
BEZEL = 12                     # рамка корпуса на общем плане, px
SCREEN_R = 46                  # радиус экрана, pt
TAP_DELAY = .12                # record.py: касание через 0,12 с после события
LOOP = .5                      # последние секунды сводятся к первому кадру


# ---------- кривые (как в scripts/promo/promo.py Agent Pulse) ----------

def cubic_in_out(t):
    t = min(max(t, 0.0), 1.0)
    return 4 * t * t * t if t < .5 else 1 - (-2 * t + 2) ** 3 / 2


def cubic_out(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 3


def camera_progress(elapsed, duration=.9):
    """Плавная камера: основной ход ~0,45 с, лёгкий перелёт, покой к концу."""
    if elapsed <= 0:
        return 0.0
    if elapsed >= duration:
        return 1.0
    t = elapsed / duration * .75
    value = 1 - math.exp(-11 * t) * (math.cos(8 * t) + (11 / 8) * math.sin(8 * t))
    blend = cubic_in_out((t - .60) / .15)
    return value * (1 - blend) + blend


def tap_state(rel):
    """Кольцо касания: доля радиуса, прозрачность, отверстие / радиус."""
    hole = .58
    if rel < -.37 or rel > .28:
        return 0.0, 0.0, hole
    if rel < -.17:
        p = (rel + .37) / .20
        return .45 + .55 * cubic_out(p), cubic_in_out(p / .6), hole
    if rel < 0:
        p = (rel + .17) / .17
        return 1 - .5 * cubic_in_out(p), 1.0, hole
    p = rel / .28
    return .5 + .24 * cubic_out(p), 1 - cubic_in_out(p), hole + .2 * cubic_in_out(p)


def rounded_mask(size, radius, sup=3):
    mask = Image.new("L", (size[0] * sup, size[1] * sup), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] * sup - 1, size[1] * sup - 1), radius=radius * sup, fill=255)
    return mask.resize(size, Image.LANCZOS)


# ---------- запись ----------

class Recording:
    def __init__(self, folder):
        self.folder = folder
        self.frames = json.loads((folder / "frames.json").read_text())
        meta = json.loads((folder / "events.json").read_text())
        self.duration = meta["duration"]
        self.vw, self.vh = meta["viewport"]
        self.taps = [e for e in meta["events"] if e["type"] == "tap"]
        self.cams = [e for e in meta["events"] if e["type"] == "cam"]
        self.cache = {}

    def screen(self, t):
        """Последний кадр экрана, пришедший к моменту t."""
        idx = 0
        for i, f in enumerate(self.frames):
            if f["t"] <= t:
                idx = i
            else:
                break
        name = self.frames[idx]["file"]
        if name not in self.cache:
            if len(self.cache) > 8:
                self.cache.pop(next(iter(self.cache)))
            self.cache[name] = Image.open(self.folder / "frames" / name).convert("RGB")
        return self.cache[name]

    def camera(self, t):
        """Масштаб и точка экрана в центре кадра; каждый переход начинается из текущего положения."""
        zoom, y = 1.0, self.vh / 2
        for i, c in enumerate(self.cams):
            if c["t"] > t:
                break
            p = camera_progress(t - c["t"])
            zoom, y = zoom + (c["zoom"] - zoom) * p, y + (c["y"] - y) * p
        return zoom, y


# ---------- кадр ----------

def draw_ring(img, cx, cy, r, rel):
    share, alpha, hole = tap_state(rel)
    if alpha <= .01:
        return
    r *= share
    pad = int(r + 12)
    box = (int(cx - pad), int(cy - pad), int(cx + pad), int(cy + pad))
    sample = img.crop(box).convert("RGBA").filter(ImageFilter.GaussianBlur(max(2, r * .16)))
    light = sample.convert("L").resize((1, 1), Image.BOX).getpixel((0, 0)) > 170
    tint = Image.new("RGBA", sample.size, (120, 126, 140, 255) if light else (234, 241, 250, 255))
    glass = Image.blend(sample, tint, .45 if light else .28)
    sup = 4
    size = sample.size
    mask = Image.new("L", (size[0] * sup, size[1] * sup), 0)
    d = ImageDraw.Draw(mask)
    ox, oy = (cx - box[0]) * sup, (cy - box[1]) * sup
    d.ellipse((ox - r * sup, oy - r * sup, ox + r * sup, oy + r * sup), fill=int(235 * alpha))
    ri = r * hole
    d.ellipse((ox - ri * sup, oy - ri * sup, ox + ri * sup, oy + ri * sup), fill=0)
    mask = mask.resize(size, Image.LANCZOS)
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(r * .12 + 2)).point(lambda v: int(v * .3)))
    glass.putalpha(mask)
    layer = img.crop(box).convert("RGBA")
    layer.alpha_composite(shadow)
    layer.alpha_composite(glass)
    img.paste(layer.convert("RGB"), box[:2])


class Composer:
    def __init__(self, rec):
        self.rec = rec
        self.base = SCREEN_H / rec.vh          # px на pt на общем плане
        sup = 3
        border = Image.new("RGBA", (OUT_W * sup, OUT_H * sup))
        ImageDraw.Draw(border).rounded_rectangle((sup / 2, sup / 2, OUT_W * sup - sup / 2, OUT_H * sup - sup / 2),
                                                 radius=20 * K * sup, outline=EDGE, width=round(K * sup))
        self.border = border.resize((OUT_W, OUT_H), Image.LANCZOS)
        self.mask = rounded_mask((OUT_W, OUT_H), 20 * K)

    def geometry(self, t):
        zoom, fy = self.rec.camera(t)
        s = self.base * zoom
        # На общем плане телефон по центру; при приближении точка fy встаёт в центр кадра.
        k = (zoom - 1) / .42 if zoom > 1 else 0
        y_focus = fy * (min(k, 1)) + self.rec.vh / 2 * (1 - min(k, 1))
        left = OUT_W / 2 - self.rec.vw * s / 2
        top = OUT_H / 2 - y_focus * s
        return s, left, top

    def frame(self, t):
        rec = self.rec
        s, left, top = self.geometry(t)
        img = Image.new("RGB", (OUT_W, OUT_H), BG)
        sw, sh = round(rec.vw * s), round(rec.vh * s)
        bez = BEZEL * s / self.base
        # Корпус: тёмная рамка с обводкой GitHub Dark.
        body = (round(left - bez), round(top - bez), round(left + sw + bez), round(top + sh + bez))
        bw, bh = body[2] - body[0], body[3] - body[1]
        sup = 2
        shell = Image.new("RGBA", (bw * sup, bh * sup))
        ImageDraw.Draw(shell).rounded_rectangle((0, 0, bw * sup - 1, bh * sup - 1),
                                                radius=(SCREEN_R * s + bez) * sup, fill="#010409",
                                                outline=EDGE, width=max(2, round(1.5 * sup * s / self.base)))
        shell = shell.resize((bw, bh), Image.LANCZOS)
        img.paste(shell, body[:2], shell)
        screen = rec.screen(t).resize((sw, sh), Image.LANCZOS)
        img.paste(screen, (round(left), round(top)), rounded_mask((sw, sh), SCREEN_R * s, sup=2))
        for tap in rec.taps:
            rel = t - (tap["t"] + TAP_DELAY)
            if -.4 < rel < .3:
                draw_ring(img, left + tap["x"] * s, top + tap["y"] * s, 24 * s, rel)
        return img

    def finish(self, img):
        out = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
        img = img.convert("RGBA")
        img.putalpha(self.mask)
        out.alpha_composite(img)
        out.alpha_composite(self.border)
        return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--out")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--quality", type=float, default=75, help="усилие сжатия без потерь или качество с --lossy")
    ap.add_argument("--lossy", action="store_true", help="сжатие с потерями (на тексте даёт артефакты)")
    ap.add_argument("--keys", type=float, help="только контрольные кадры с этим шагом, с")
    args = ap.parse_args()
    folder = Path(args.folder)
    rec = Recording(folder)
    comp = Composer(rec)
    fps = args.fps
    total = int(round(rec.duration * fps))
    first = comp.frame(0)
    loop_frames = int(round(LOOP * fps))

    def render(i):
        t = i / fps
        img = comp.frame(t) if i else first
        # Стык петли: за LOOP секунд кадр сводится к первому, последний кадр совпадает с ним.
        k = i - (total - 1 - loop_frames)
        if k > 0:
            img = Image.blend(img, first, cubic_in_out(k / loop_frames))
        return comp.finish(img)

    if args.keys:
        keys_dir = folder / "keys"
        keys_dir.mkdir(exist_ok=True)
        idx = sorted({min(total - 1, round(n * args.keys * fps)) for n in range(int(rec.duration / args.keys) + 1)}
                     | {total - 1})
        for i in idx:
            render(i).save(keys_dir / f"key-{i / fps:05.2f}.png")
        print(f"Контрольных кадров: {len(idx)} → {keys_dir}")
        return

    out = Path(args.out) if args.out else folder / "demo.webp"
    # Прямой WebPAnimEncoder libwebp, кадры подаются по одному: ffmpeg в анимации сдвигал цвет даже
    # в режиме без потерь, а дельты с потерями оставляют «призраки» текста на белом.
    # Одинаковые соседние кадры энкодер сливает сам, удлиняя показ.
    lossless = not args.lossy
    enc = _webp.WebPAnimEncoder((OUT_W, OUT_H), 0xFF0D1117, 0, True, 9 if lossless else 3,
                                17 if lossless else 5, False, False)
    step = 1000 / fps
    for i in range(total):
        enc.add(render(i).getim(), round(i * step), lossless, args.quality, 100, 4)
        if i % (fps * 5) == 0:
            print(f"Монтаж: {i / fps:.0f}/{rec.duration:.0f} с", flush=True)
    enc.add(None, round(total * step), lossless, args.quality, 100, 0)
    data = enc.assemble("", b"", b"")
    if data is None:
        raise RuntimeError("Не удалось записать WebP")
    out.write_bytes(data)
    print(f"{out}: {out.stat().st_size / 1e6:.1f} МБ, {total} кадров, {total / fps:.2f} с")


if __name__ == "__main__":
    main()
