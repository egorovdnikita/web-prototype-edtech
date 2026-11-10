#!/usr/bin/env python3
"""Запись прототипа для промо-ролика README: настоящие экраны, Playwright, кадры CDP screencast.

    python scripts/promo/record.py ПАПКА [--url http://localhost:3123]

Сохраняет ПАПКА/frames/*.png (кадры экрана 390 × 844 px без потерь), ПАПКА/frames.json (время кадров)
и ПАПКА/events.json (касания с центрами настоящих кнопок, команды камеры). Монтаж — compose.py.
Свежий профиль браузера: отметки прототипа — как в моках, данные вымышленные.
"""
import argparse
import base64
import json
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

VW, VH, DPR = 390, 844, 2


class Recorder:
    def __init__(self, page, folder):
        self.page = page
        self.folder = folder
        self.frames = []
        self.events = []
        self.t0 = None
        (folder / "frames").mkdir(parents=True, exist_ok=True)
        self.cdp = page.context.new_cdp_session(page)
        self.cdp.on("Page.screencastFrame", self.on_frame)

    def on_frame(self, msg):
        ts = msg["metadata"]["timestamp"]
        name = f"{len(self.frames):05d}.png"
        (self.folder / "frames" / name).write_bytes(base64.b64decode(msg["data"]))
        self.frames.append({"t": ts, "file": name})
        self.cdp.send("Page.screencastFrameAck", {"sessionId": msg["sessionId"]})

    def start(self):
        self.cdp.send("Page.startScreencast", {"format": "png",
                                               "maxWidth": VW * DPR, "maxHeight": VH * DPR, "everyNthFrame": 1})
        self.t0 = time.time()
        self.wait(.3)

    def stop(self):
        self.duration = self.now() - self.t0
        self.cdp.send("Page.stopScreencast")

    def now(self):
        return time.time()

    def wait(self, seconds):
        self.page.wait_for_timeout(int(seconds * 1000))

    def cam(self, zoom, y=VH / 2):
        """Камера: масштаб относительно общего плана и точка экрана (pt по вертикали) в центре кадра."""
        self.events.append({"type": "cam", "t": self.now(), "zoom": zoom, "y": y})

    def scroll_to(self, locator, top=120, duration=.8):
        """Плавная прокрутка страницы: элемент встаёт на `top` pt от верха экрана."""
        locator.wait_for()
        target = self.page.evaluate("([el, top]) => window.scrollY + el.getBoundingClientRect().top - top",
                                    [locator.element_handle(), top])
        self.page.evaluate("""([target, ms]) => new Promise(done => {
            const from = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
            const to = Math.max(0, Math.min(max, target)), t0 = performance.now();
            const step = now => {
                const p = Math.min(1, (now - t0) / ms);
                const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                window.scrollTo(0, from + (to - from) * e);
                p < 1 ? requestAnimationFrame(step) : done();
            };
            requestAnimationFrame(step);
        })""", [target, int(duration * 1000)])

    def tap(self, locator, after=.7):
        """Касание по центру настоящего элемента; точка и прямоугольник уходят в events.json."""
        locator.wait_for()
        box = locator.bounding_box()
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        assert 0 <= x <= VW and 0 <= y <= VH, f"Элемент вне экрана: {box}"
        self.events.append({"type": "tap", "t": self.now(), "x": x, "y": y, "box": box})
        self.wait(.12)  # кольцо успевает сжаться до нажатия
        self.page.mouse.click(x, y)
        self.wait(after)


def scenario(r):
    page = r.page
    # 1. Неделя: главный экран, урок 15, ученица отмечает конспект.
    r.cam(1.0)
    r.wait(1.6)
    r.cam(1.42, 470)
    r.wait(.6)
    r.scroll_to(page.get_by_role("button", name="Отметить: Заполнить конспект"), top=430, duration=1.1)
    r.wait(.5)
    r.tap(page.get_by_role("button", name="Отметить: Заполнить конспект"), after=1.1)
    # 2. Практика → тренажёр по номерам ЕГЭ, №4: одна ошибка, ключ и пояснение сразу.
    r.cam(1.42, 560)
    r.tap(page.get_by_role("navigation", name="Разделы").get_by_role("link", name="Практика"), after=1.0)
    r.cam(1.42, 430)
    r.tap(page.get_by_text("67%"), after=1.0)
    r.cam(1.42, 520)
    boxes = page.get_by_role("checkbox")
    r.tap(boxes.nth(0), after=.45)
    r.tap(boxes.nth(2), after=.45)
    r.tap(page.get_by_role("button", name="Проверить"), after=1.0)
    r.cam(1.42, 500)
    r.wait(2.2)
    # 3. История: тот же интерфейс, интерактивная тренировка на карте — всё нажатиями.
    r.cam(1.42, 300)
    r.tap(page.get_by_role("tab", name="история"), after=1.0)
    r.tap(page.get_by_text("Интерактивные тренировки"), after=1.0)
    r.tap(page.get_by_text("Северная война на карте").first, after=1.0)
    r.scroll_to(page.get_by_text("Выберите сражение"), top=90, duration=.8)
    r.cam(1.42, 400)
    r.wait(.4)
    pairs = [("Нарвское сражение", "Точка 1"), ("Гангутское сражение", "Точка 2"),
             ("Битва при Лесной", "Точка 3"), ("Полтавская битва", "Точка 4")]
    for battle, point in pairs:
        r.tap(page.get_by_role("button", name=battle), after=.35)
        r.tap(page.get_by_role("button", name=point), after=.6)
    r.wait(.4)
    r.cam(1.42, 520)
    r.wait(2.4)
    # 4. Назад к неделе обществознания: петля замыкается на главном экране.
    r.cam(1.0)
    r.wait(.9)
    r.tap(page.get_by_role("tab", name="общество"), after=.9)
    r.tap(page.get_by_role("navigation", name="Разделы").get_by_role("link", name="Неделя"), after=1.0)
    page.wait_for_url("**/soc")
    r.scroll_to(page.locator("body"), top=0, duration=.7)
    r.wait(.9)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--url", default="http://localhost:3123")
    args = ap.parse_args()
    folder = Path(args.folder)
    folder.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": VW, "height": VH}, device_scale_factor=DPR,
                                  is_mobile=True, has_touch=True, locale="ru-RU")
        page = ctx.new_page()
        page.goto(args.url + "/soc")
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(800)
        r = Recorder(page, folder)
        r.start()
        scenario(r)
        r.stop()
        browser.close()
    start = r.t0
    (folder / "frames.json").write_text(json.dumps([{**f, "t": f["t"] - start} for f in r.frames]))
    (folder / "events.json").write_text(json.dumps(
        {"duration": r.duration, "viewport": [VW, VH], "dpr": DPR,
         "events": [{**e, "t": e["t"] - start} for e in r.events]}, ensure_ascii=False, indent=1))
    print(f"Кадров: {len(r.frames)}, длительность {r.duration:.1f} с")


if __name__ == "__main__":
    main()
