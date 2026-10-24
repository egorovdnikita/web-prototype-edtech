"""Собирает wireframes.html из screens.txt и user-stories.csv и проверяет покрытие историй."""
import csv
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
ID_RE = re.compile(r"\{([\d.,\s]+)\}")


def load_stories():
    with open(HERE / "user-stories.csv", encoding="utf-8") as f:
        rows = list(csv.reader(f))[1:]
    return {r[0].replace("US ", "").strip(): (r[1], r[2], r[3]) for r in rows if r[0].strip()}


STORIES = load_stories()
USED = {}  # id -> [screen codes]
UNKNOWN = []


def split_ids(text, screen):
    ids = []
    for m in ID_RE.finditer(text):
        ids += [i.strip() for i in m.group(1).split(",") if i.strip()]
    for i in ids:
        if i in STORIES:
            USED.setdefault(i, [])
            if screen not in USED[i]:
                USED[i].append(screen)
        else:
            UNKNOWN.append((screen, i))
    return ID_RE.sub("", text).strip(), ids


def badges(ids):
    out = []
    for i in ids:
        tip = html.escape(STORIES[i][2]) if i in STORIES else "нет в таблице"
        out.append(f'<span class="us" title="{tip}">{i}</span>')
    return "".join(out)


def inline(text):
    t = html.escape(text)
    t = re.sub(r"&lt;&lt;(.*?)&gt;&gt;", r'<span class="btn">\1</span>', t)
    t = re.sub(r"\[\[(.*?)\]\]", r'<span class="inp">\1</span>', t)
    return t


def cell(text, screen, cls="b"):
    body, ids = split_ids(text, screen)
    return f'<div class="{cls}">{inline(body)}{badges(ids)}</div>'


def render_line(line, screen):
    if line.startswith("top:"):
        return cell(line[4:].strip(), screen, "b top")
    if line.startswith("tabs:"):
        body, ids = split_ids(line[5:], screen)
        tabs = [t.strip() for t in body.split("·")]
        items = "".join(f'<span class="tab{" on" if n == 0 else ""}">{inline(t)}</span>' for n, t in enumerate(tabs))
        return f'<div class="tabs">{items}{badges(ids)}</div>'
    if line.startswith("row:"):
        cells = [c for c in line[4:].split(" | ")]
        return '<div class="row">' + "".join(cell(c.strip(), screen) for c in cells) + "</div>"
    if line.startswith("tbl:"):
        body, ids = split_ids(line[4:], screen)
        cols = [c.strip() for c in body.split("|")]
        th = "".join(f"<th>{inline(c)}</th>" for c in cols)
        return f'<table class="tbl" data-cols="{len(cols)}"><tr>{th}<td class="bd">{badges(ids)}</td></tr>'
    if line.startswith("tr:"):
        body, ids = split_ids(line[3:], screen)
        tds = "".join(f"<td>{inline(c.strip())}</td>" for c in body.split("|"))
        return f'<tr>{tds}<td class="bd">{badges(ids)}</td></tr>'
    if line.startswith("img:"):
        body, ids = split_ids(line[4:], screen)
        return f'<div class="img"><span>{inline(body)}</span>{badges(ids)}</div>'
    if line.startswith("~"):
        rest = line[1:].strip()
        if rest.isdigit() or not rest:
            return '<div class="ph"></div>' * int(rest or 1)
        return cell(rest, screen, "note")
    if line.startswith("- "):
        return cell(line[2:], screen, "b it")
    return cell(line, screen)


def close_table(parts, in_tbl):
    if in_tbl:
        parts.append("<tr><td colspan='99' class='ph-row'></td></tr></table>")
    return False


def parse():
    sections = []
    screen = None
    for raw in (HERE / "screens.txt").read_text(encoding="utf-8").splitlines():
        if not raw.strip():
            continue
        if raw.startswith("# "):
            sections.append({"title": raw[2:].strip(), "screens": []})
            continue
        if raw.startswith("== "):
            code, roles, title = [p.strip() for p in raw[3:].split("|")]
            screen = {"code": code, "roles": roles, "title": title, "note": "", "lines": []}
            sections[-1]["screens"].append(screen)
            continue
        if raw.startswith("> "):
            screen["note"] = raw[2:].strip()
            continue
        depth = (len(raw) - len(raw.lstrip(" "))) // 2
        screen["lines"].append((depth, raw.strip()))
    return sections


BELL = '<span>🔔 <span class="badge">3</span></span><span class="avatar"></span>'
SHELLS = {
    "student": ("", [("B1", "Неделя"), ("B2", "Программа"), ("B14", "Календарь"), ("B9", "База заданий"),
                     ("B11", "Прогресс"), ("B13", "Ачивки"), ("B17", "Наставник"), ("B19", "Чаты"), ("B20", "Оплата")]),
    "mentor": ("Кабинет наставника", [("D1", "Мои ученики"), ("D3", "Сообщения"), ("D4", "Индивидуальные планы"), ("D5", "Зачёты"),
                                      ("D10", "Коворкинги"), ("D7", "Чаты"), ("D8", "Отчёты родителям"), ("D9", "Показатели")]),
    "checker": ("Кабинет проверяющего", [("E1", "Очередь"), ("E2", "Проверка"), ("E3", "Апелляции ЕГЭ"), ("H1", "Мои встречи"), ("D9", "Показатели")]),
    "lead": ("Кабинет руководителя", [("F1", "Сотрудники"), ("F2", "Группы"), ("F3", "Успеваемость"), ("F4", "Показатели"),
                                      ("E4", "Контроль очереди"), ("E5", "Перепроверки"), ("E6", "Контроль качества"), ("E7", "Нагрузка"),
                                      ("E8", "Апелляции ЕГЭ"), ("F8", "Графики встреч"), ("F6", "Чаты и дежурства"), ("F7", "Объявления"),
                                      ("F5", "Розыгрыш"), ("F9", "Внутренние курсы")]),
    "methodist": ("Кабинет методиста", [("G1", "Курсы"), ("G4", "База заданий"), ("G11", "Тренировки"), ("G7", "Структура предмета"),
                                        ("G9", "До старта и обратная связь"), ("G10", "Аналитика")]),
    "teacher": ("Кабинет преподавателя", [("H1", "Мои встречи"), ("G1", "Курсы (просмотр)"), ("D9", "Показатели")]),
    "shop": ("Магазин", [("I3", "Заказы"), ("I5", "Новый заказ"), ("I6", "Покупатели"), ("I1", "Продукты и предложения"), ("I2", "Промокоды и бонусы")]),
    "crm": ("CRM", [("J1", "Сегменты"), ("J2", "Рассылки и сценарии")]),
    "tech": ("Администрирование", [("F1", "Сотрудники"), ("K1", "Виджеты"), ("K2", "Ачивки")]),
}
SHELL_RE = re.compile(r"^\s*<!--\s*shell:(\w+)(?:\s+active=(\w+))?\s*-->")


def wrap_shell(src):
    m = SHELL_RE.match(src)
    if not m:
        return src
    kind, active, body = m.group(1), m.group(2), src[m.end():]
    if kind == "public":
        links = " ".join(f'<a href="#{c}">{t}</a>' for c, t in [("C1", "Курсы"), ("C5", "Мои заказы"), ("C6", "Бонусы")])
        return (f'<div class="hdr" style="display:flex"><span class="logo">ЕГЭ Налегке</span>{links}<span class="sp"></span>'
                f'<button class="sm">Войти</button></div><div class="content">{body}</div>')
    sub, items = SHELLS[kind]
    if kind == "student":
        top = ('<select><option>Обществознание · Годовой курс</option><option>История · Годовой курс</option></select>'
               '<span class="sp"></span><span class="small">Оплачено до 31 октября</span><button class="sm">Продлить</button>')
    else:
        top = f'<span class="small muted">{sub}</span><span class="sp"></span>'
    menu = "".join(f'<a{" class=on" if c == active else ""} href="#{c}">{t}</a>' for c, t in items)
    return (f'<div class="app"><div class="hdr"><span class="logo">ЕГЭ Налегке</span>{top}{BELL}</div>'
            f'<nav class="menu">{menu}</nav><div class="content">{body}</div></div>')


def render_screen(s):
    custom = HERE / "html" / f'{s["code"]}.html'
    if custom.exists():
        src = wrap_shell(custom.read_text(encoding="utf-8"))
        inner, cls = ID_RE.sub(lambda m: badges(split_ids(m.group(0), s["code"])[1]), src), "scr ui"
    else:
        inner, cls = render_dsl(s), "scr"
    note = f'<div class="snote">{html.escape(s["note"])}</div>' if s["note"] else ""
    return (
        f'<section class="screen" id="{s["code"]}"><div class="shead"><b>{s["code"]}</b> {html.escape(s["title"])}'
        f'<div class="roles">{html.escape(s["roles"])}</div>{note}</div><div class="{cls}">{inner}</div></section>'
    )


def render_dsl(s):
    parts, in_tbl, open_box = [], False, False
    lines = s["lines"]
    for idx, (depth, line) in enumerate(lines):
        is_tr = line.startswith("tr:")
        if in_tbl and not is_tr:
            in_tbl = close_table(parts, in_tbl)
        if depth == 0 and open_box:
            parts.append("</div>")
            open_box = False
        rendered = render_line(line, s["code"])
        if line.startswith("tbl:"):
            in_tbl = True
        nxt_child = False
        if depth == 0:
            nxt_child = idx + 1 < len(lines) and lines[idx + 1][0] > 0
        if nxt_child and rendered.endswith("</div>") and rendered.startswith('<div class="b'):
            parts.append(rendered[: -len("</div>")])
            open_box = True
        else:
            parts.append(rendered)
    close_table(parts, in_tbl)
    if open_box:
        parts.append("</div>")
    return "".join(parts)


CSS = """
:root{color-scheme:light dark}
body{font-family:var(--font-sans,system-ui,sans-serif);margin:0;color:var(--foreground,#222);display:flex;align-items:flex-start}
.side{position:sticky;top:0;flex:0 0 240px;height:100vh;overflow-y:auto;box-sizing:border-box;padding:16px 12px;border-right:1px solid var(--border,#ddd);font-size:12px;line-height:1.5}
.side a{color:inherit;text-decoration:none;display:block;padding:1px 6px;border-radius:3px}
.side a:hover{background:rgba(127,127,127,.15)}
.side .sec{font-weight:bold;margin-top:12px}
.side .sec:first-child{margin-top:0}
.side .scr-link{color:var(--muted-foreground,#666);display:flex;gap:4px}
.side .scr-link b{flex:0 0 28px;font-weight:normal;color:var(--foreground,#222)}
.side a.on{background:var(--foreground,#222);color:var(--background,#fff)}
.side a.on b{color:inherit}
main{flex:1;min-width:0;padding:0 20px 16px}
h2{scroll-margin-top:8px}.screen{scroll-margin-top:8px}
h2{font-size:16px;margin:24px 0 10px;border-bottom:1px solid var(--border,#ccc);padding-bottom:4px}
.grid{display:flex;flex-direction:column;gap:calc(28px + 2em);max-width:960px}
.shead{font-size:13px;margin-bottom:6px}
.roles{font-size:11px;color:var(--muted-foreground,#777)}
.snote{font-size:11px;color:var(--muted-foreground,#777);font-style:italic}
.scr{background:#f2f2f2;border:1px solid #bdbdbd;border-radius:6px;padding:12px;font:11px/1.35 Arial,sans-serif;color:#555}
.b{background:#d9d9d9;border:1px solid #b3b3b3;padding:5px 6px;margin-bottom:5px}
.b .b{margin:4px 0 0}
.top{background:#c4c4c4;font-weight:bold}
.it{background:#fff;border:1px dashed #9e9e9e}
.note{color:#888;font-style:italic;padding:2px 0 5px}
.row{display:flex;gap:5px}.row>.b{flex:1}
.tabs{display:flex;gap:2px;margin-bottom:5px;flex-wrap:wrap;align-items:center}
.tab{background:#e0e0e0;border:1px solid #bbb;padding:2px 6px}.tab.on{background:#fff;font-weight:bold}
.ph{background:#e6e6e6;border:1px solid #ccc;height:9px;margin:4px 0}
.img{background:#e0e0e0 linear-gradient(to top right,transparent 49.5%,#bbb 49.5%,#bbb 50.5%,transparent 50.5%),linear-gradient(to bottom right,transparent 49.5%,#bbb 49.5%,#bbb 50.5%,transparent 50.5%);border:1px solid #aaa;height:64px;display:flex;align-items:center;justify-content:center;margin-bottom:5px;gap:4px}
.img span{background:#f2f2f2;padding:1px 5px}
.btn{display:inline-block;background:#8f8f8f;color:#fff;padding:0 6px;margin:1px 2px;border-radius:2px}
.inp{display:inline-block;background:#fff;border:1px solid #999;padding:0 5px;margin:1px 2px;min-width:50px;color:#888}
.tbl{width:100%;border-collapse:collapse;margin-bottom:5px;background:#fff}
.tbl th{background:#cfcfcf;text-align:left;font-weight:normal;border:1px solid #b3b3b3;padding:3px}
.tbl td{border:1px solid #ccc;padding:3px}
.tbl td.bd{border:none;background:#f2f2f2;width:1px;white-space:nowrap}
.ph-row{height:8px;background:#ececec}
.us{display:inline-block;background:#ffeb3b;color:#333;font-size:9px;padding:0 3px;border:1px solid #c9b400;margin-left:3px;cursor:help;vertical-align:1px}
.cov{border-collapse:collapse;font-size:12px;width:100%}
.cov td,.cov th{border:1px solid var(--border,#ccc);padding:3px 6px;text-align:left;vertical-align:top}
.cov a{color:inherit}
.miss{color:#c62828;font-weight:bold}
/* Экраны на реальных контролах: без дизайна, только серый, системный шрифт */
.scr.ui{background:#fff;padding:0;overflow:hidden;font:13px/1.45 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#333}
.ui{accent-color:#555}
.ui *{box-sizing:border-box}
.ui h1{font-size:18px;margin:0 0 12px}
.ui h3{font-size:14px;margin:0 0 8px}
.ui p{margin:0 0 8px}
.ui a{color:#333}
.ui .app{display:grid;grid-template-columns:170px 1fr;grid-template-rows:auto 1fr}
.ui .hdr{grid-column:1/-1;flex-wrap:wrap;display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid #ccc;background:#f5f5f5}
.ui .logo{font-weight:bold;border:1px dashed #999;padding:2px 8px}
.ui .sp{flex:1}
.ui .menu{border-right:1px solid #ddd;padding:10px 0;background:#fafafa}
.ui .menu a{display:block;padding:5px 14px;text-decoration:none;color:#555}
.ui .menu a.on{background:#e4e4e4;color:#111;font-weight:600}
.ui .content{padding:16px 18px;min-width:0}
.ui .card{border:1px solid #ccc;border-radius:4px;padding:12px;margin-bottom:12px;background:#fff}
.ui .cols{display:grid;grid-template-columns:1fr 250px;gap:14px;align-items:start}
.ui .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.ui .muted{color:#888}.ui .small{font-size:12px}
.ui input[type=text],.ui input[type=email],.ui input[type=password],.ui select,.ui textarea{font:inherit;border:1px solid #999;border-radius:3px;padding:5px 8px;background:#fff;color:#333}
.ui textarea{width:100%;min-height:56px;display:block}
.ui label.f{display:block;font-size:12px;color:#666;margin:10px 0 3px}
.ui button{font:inherit;border:1px solid #888;border-radius:3px;padding:4px 12px;background:#eee;color:#333;cursor:pointer}
.ui button.pri{background:#555;border-color:#555;color:#fff}
.ui button.sm{padding:2px 8px;font-size:12px}
.ui button.link{border:0;background:none;padding:0;text-decoration:underline}
.ui .tag{display:inline-block;border:1px solid #bbb;border-radius:10px;padding:0 8px;font-size:11px;color:#666;background:#f3f3f3;white-space:nowrap}
.ui .st{font-size:12px;font-weight:600}.ui .st.bad{color:#b23b3b}.ui .st.ok{color:#2e7d32}.ui .st.warn{color:#a66b00}
.ui table.t{width:100%;border-collapse:collapse}
.ui table.t th{text-align:left;font-weight:600;font-size:12px;color:#666;border-bottom:2px solid #ccc;padding:6px}
.ui table.t td{border-bottom:1px solid #e3e3e3;padding:6px;vertical-align:middle}
.ui .item{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:8px 0;border-top:1px solid #eee}
.ui .item:first-of-type{border-top:0}
.ui .grow{flex:1;min-width:120px}
.ui .imgph{background:#f0f0f0 linear-gradient(to top right,transparent 49.7%,#ccc 49.7%,#ccc 50.3%,transparent 50.3%),linear-gradient(to bottom right,transparent 49.7%,#ccc 49.7%,#ccc 50.3%,transparent 50.3%);border:1px solid #bbb;display:flex;align-items:center;justify-content:center;color:#888}
.ui .tabbar{display:flex;border-bottom:1px solid #ccc;margin-bottom:12px;flex-wrap:wrap}
.ui .tabbar button{border:0;border-bottom:2px solid transparent;border-radius:0;background:none;padding:6px 12px;color:#666}
.ui .tabbar button.on{border-bottom-color:#333;color:#111;font-weight:600}
.ui [data-panel]{display:none}.ui [data-panel].on{display:block}
.ui .callout{border-left:4px solid #999;background:#f3f3f3;padding:8px 12px;margin-bottom:12px}
.ui progress{width:140px;height:10px}
.ui .note-i{font-style:italic;color:#888;font-size:12px}
.ui .badge{display:inline-block;min-width:18px;text-align:center;background:#666;color:#fff;border-radius:9px;font-size:11px;padding:0 5px}
.ui .avatar{width:28px;height:28px;border-radius:50%;background:#ccc;display:inline-block;flex:0 0 auto}
.ui .us{font-size:10px}
"""

JS = """
const sideLinks = [...document.querySelectorAll('.side a')];
const targets = sideLinks.map(a => document.getElementById(a.getAttribute('href').slice(1)));
function markCurrent() {
  let cur = 0;
  targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= 80) cur = i; });
  sideLinks.forEach((a, i) => a.classList.toggle('on', i === cur));
  const a = sideLinks[cur], side = a.parentElement;
  if (a.offsetTop < side.scrollTop || a.offsetTop > side.scrollTop + side.clientHeight - 40) side.scrollTop = a.offsetTop - side.clientHeight / 3;
}
addEventListener('scroll', markCurrent, {passive: true});
markCurrent();

document.querySelectorAll('.ui .tabbar').forEach(bar => bar.addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  bar.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  bar.parentElement.querySelectorAll(':scope > [data-panel]').forEach(p => p.classList.toggle('on', p.dataset.panel === b.dataset.tab));
}));
"""


def main():
    sections = parse()
    body = []
    n_screens = sum(len(s["screens"]) for s in sections)
    toc = []
    for n, sec in enumerate(sections):
        toc.append(f'<a class="sec" href="#sec{n}">{html.escape(sec["title"])}</a>')
        toc += [
            f'<a class="scr-link" href="#{s["code"]}"><b>{s["code"]}</b> {html.escape(s["title"])}</a>'
            for s in sec["screens"]
        ]
    toc.append('<a class="sec" href="#coverage">Покрытие историй</a>')
    for n, sec in enumerate(sections):
        body.append(f'<h2 id="sec{n}">{html.escape(sec["title"])}</h2><div class="grid">')
        body += [render_screen(s) for s in sec["screens"]]
        body.append("</div>")

    missing = [i for i in STORIES if i not in USED]
    rows = []
    for i, (role, dom, text) in STORIES.items():
        scr = ", ".join(f'<a href="#{c}">{c}</a>' for c in USED.get(i, [])) or '<span class="miss">нет</span>'
        rows.append(f"<tr><td>{i}</td><td>{html.escape(dom)}</td><td>{html.escape(text)}</td><td>{scr}</td></tr>")

    page = f"""<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>ЕГЭ Налегке — вайрфреймы по пользовательским историям</title><style>{CSS}</style></head><body>
<nav class="side">{''.join(toc)}</nav>
<main>
{''.join(body)}
<h2 id="coverage">Покрытие историй</h2>
<table class="cov"><tr><th>ID</th><th>Поддомен</th><th>История</th><th>Экраны</th></tr>{''.join(rows)}</table>
</main>
<script>{JS}</script>
</body></html>"""
    (HERE / "wireframes.html").write_text(page, encoding="utf-8")

    print(f"screens={n_screens} stories={len(STORIES)} covered={len(USED)}")
    if missing:
        print("MISSING:", " ".join(missing))
    if UNKNOWN:
        print("UNKNOWN:", UNKNOWN)
    return 1 if missing or UNKNOWN else 0


if __name__ == "__main__":
    sys.exit(main())
