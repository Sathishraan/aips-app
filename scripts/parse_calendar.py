import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / "assets" / "calendar_extracted.txt").read_text(encoding="utf-8").splitlines()

month_re = re.compile(
    r"^(?:MONTHLY PLANNER\s*[\u2013\u2014\-–—]?\s*)?([A-Za-z]+)\s+(\d{4})\s*$",
    re.I,
)
days = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
month_index = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
}

months_order = []
months = {}
cur = None
i = 0


def classify(event: str) -> str:
    u = event.upper()
    if "HOLIDAY" in u or any(
        x in u
        for x in [
            "MUHARRAM",
            "CHRISTMAS",
            "DIWALI",
            "PONGAL",
            "RAMZAN",
            "EID",
            "GOOD FRIDAY",
            "REPUBLIC",
            "INDEPENDENCE",
            "GANDHI",
            "BAKRID",
            "MILAD",
        ]
    ):
        return "holiday"
    if any(x in u for x in ["FA ", "SA ", "EXAM", "ASSESSMENT", "REVISION"]):
        return "exam"
    if "PTM" in u or "OPEN HOUSE" in u:
        return "ptm"
    if "VALUE DAY" in u:
        return "value"
    return "event"


while i < len(text):
    line = text[i].strip()
    m = month_re.match(line)
    if m:
        name = m.group(1).title()
        year = int(m.group(2))
        key = f"{name} {year}"
        theme = ""
        if i + 1 < len(text):
            nxt = text[i + 1].strip()
            if (
                not month_re.match(nxt)
                and nxt.lower() not in days
                and not re.match(r"^\d{1,2}$", nxt)
                and "Event" not in nxt
                and nxt.upper() != "DATE"
            ):
                theme = nxt
                i += 1
        cur = {
            "id": key.lower().replace(" ", "-"),
            "month": name,
            "year": year,
            "theme": theme,
            "events": [],
        }
        months[key] = cur
        months_order.append(key)
        i += 1
        continue

    if cur is None:
        i += 1
        continue

    if re.match(r"^\d{1,2}$", line):
        date_num = int(line)
        day_name = ""
        event_parts = []
        if i + 1 < len(text) and text[i + 1].strip().lower() in days:
            day_name = text[i + 1].strip().title()
            i += 1

        j = i + 1
        while j < len(text):
            nxt = text[j].strip()
            if month_re.match(nxt):
                break
            if re.match(r"^\d{1,2}$", nxt) and j + 1 < len(text) and text[j + 1].strip().lower() in days:
                break
            if nxt.upper() in ("DATE", "DAY", "EVENT / OBSERVANCE", "DAY COUNT"):
                j += 1
                continue
            if nxt == "-":
                j += 1
                break
            if re.match(r"^\d{1,3}$", nxt):
                # day-count after optional event
                j += 1
                break
            if nxt.lower() in days:
                break
            event_parts.append(nxt)
            j += 1

        event = re.sub(r"\s+", " ", " ".join(event_parts)).strip()
        mi = month_index.get(cur["month"], 1)
        date_str = f"{cur['year']}-{mi:02d}-{date_num:02d}"

        if event and event != "-":
            title = "Holiday" if event.upper() == "HOLIDAY" else event
            cur["events"].append(
                {
                    "date": date_str,
                    "day": day_name,
                    "title": title,
                    "type": classify(title),
                }
            )
        i = j
        continue

    i += 1

out = []
for k in months_order:
    mdata = months[k]
    seen = set()
    ev = []
    for e in mdata["events"]:
        key = (e["date"], e["title"])
        if key in seen:
            continue
        seen.add(key)
        ev.append(e)
    mdata["events"] = ev
    out.append(mdata)
    print(mdata["month"], mdata["year"], "events", len(ev))

out_path = ROOT / "data" / "schoolCalendar.json"
out_path.parent.mkdir(exist_ok=True)
out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print("written", out_path, "months", len(out), "events", sum(len(m["events"]) for m in out))
