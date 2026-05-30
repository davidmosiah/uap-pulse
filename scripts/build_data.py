#!/usr/bin/env python3
"""Build uap-pulse/data/sightings.json from the war.gov PURSUE combined CSV (Releases 1 + 2).

Source: war.gov/UFO `uap-data.csv` (US Dept. of War PURSUE, Release 1 2026-05-08 + Release 2
2026-05-22) — public domain (17 USC 105). 222 records across 7 federal agencies.
Geocodes named locations (incl. military commands) to representative coordinates,
normalizes dates, flags off-world (Moon / orbit / cislunar).
"""
import csv, os, re

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "uap-data.csv")
OUT = os.path.join(HERE, "..", "data", "sightings.json")

# Representative coordinates. Regions/seas/commands use a sensible centroid.
GEO = {
    "Western United States": (39.5, -116.0, False), "Southern United States": (32.0, -90.0, False),
    "Southeastern United States": (33.0, -84.0, False), "Midwestern United States": (41.5, -93.0, False),
    "United States": (39.8, -98.6, False), "North America": (45.0, -100.0, False),
    "New Mexico": (34.5, -106.0, False), "Texas": (31.0, -99.0, False), "Detroit, MI": (42.331, -83.046, False),
    "Pacific Time Zone": (37.0, -120.5, False),
    "Syria": (35.0, 38.0, False), "Iraq": (33.2, 43.7, False), "Iran": (32.0, 53.0, False),
    "Middle East": (29.0, 45.0, False), "United Arab Emirates": (24.0, 54.0, False),
    "Greece": (39.0, 22.0, False), "Germany": (51.0, 10.0, False), "Netherlands": (52.1, 5.3, False),
    "Azerbaijan": (40.4, 47.6, False), "Georgia": (42.3, 43.4, False), "Kazakhstan": (48.0, 67.0, False),
    "Turkmenistan": (39.0, 59.0, False), "Japan": (36.2, 138.3, False), "Djibouti": (11.8, 42.6, False),
    "Papua New Guinea": (-6.3, 143.9, False), "Mexico": (23.6, -102.5, False), "USSR": (55.0, 50.0, False),
    # seas / oceans
    "Arabian Gulf": (26.5, 51.5, False), "Persian Gulf": (26.5, 52.0, False), "Gulf of Oman": (24.5, 58.5, False),
    "Gulf of Aden": (12.5, 47.0, False), "Strait of Hormuz": (26.6, 56.5, False), "Arabian Sea": (16.0, 65.0, False),
    "Mediterranean Sea": (35.0, 18.0, False), "Aegean Sea": (38.5, 25.0, False), "East China Sea": (29.0, 125.0, False),
    "Yellow Sea": (35.5, 123.0, False), "Pacific Ocean": (0.0, -160.0, False), "North Atlantic Ocean": (45.0, -30.0, False),
    # US combatant commands (operational regions -> representative centroids)
    "CENTCOM": (27.0, 50.0, False), "NORTHCOM": (45.0, -100.0, False), "AFRICOM": (2.0, 20.0, False),
    "EUCOM": (50.0, 10.0, False), "INDOPACOM": (-5.0, 130.0, False), "Indo-PACOM": (-5.0, 125.0, False),
    # off-world
    "Moon": (0.0, 0.0, True), "Low Earth Orbit": (0.0, 0.0, True), "Cislunar Space": (0.0, 0.0, True),
}

AGENCY_COLOR = {
    "Department of War": "#ff3b6b", "FBI": "#ffcf3b", "NASA": "#3bd1ff", "Department of State": "#9b5bff",
    "Central Intelligence Agency": "#46e8a0", "Office of the Director of National Intelligence": "#ff8a4d",
    "Department of Energy": "#e85cff",
}
RELEASE = {"5/8/26": "Release 1 (2026-05-08)", "5/22/26": "Release 2 (2026-05-22)"}


def norm_date(s):
    """Returns (iso|None, year|None). Handles m/d/yy, bare years, and ranges like '1948-1950'."""
    s = (s or "").strip()
    if not s or s in ("N/A", "None"):
        return None, None
    m = re.match(r"^\s*(\d{1,2})/(\d{1,2})/(\d{2,4})\s*$", s)
    if m:
        mo, dy, yr = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if yr < 100:
            yr = 2000 + yr if yr <= 26 else 1900 + yr
        try:
            return f"{yr:04d}-{mo:02d}-{dy:02d}", yr
        except Exception:
            return None, yr
    yrs = re.findall(r"(19\d{2}|20\d{2})", s)   # bare year or range -> first 4-digit year
    if yrs:
        return None, int(yrs[0])
    return None, None


def era(year):
    if year is None: return "Unknown"
    if year <= 1945: return "WWII Foo Fighters (1944–45)"
    if year <= 1969: return "Cold War & Space Race (1946–69)"
    if year <= 2003: return "Modern Files (1970–2003)"
    return "Navy Era & Disclosure (2004–26)"


def main():
    rows = list(csv.DictReader(open(SRC, encoding="utf-8-sig")))
    out, unknown = [], set()
    for i, r in enumerate(rows):
        g = lambda k: (r.get(k) or "").strip()
        loc = g("Incident Location")
        if loc in ("N/A", "None"): loc = ""
        iso, year = norm_date(g("Incident Date"))
        coords = GEO.get(loc)
        lat = lng = None; offworld = False
        if coords: lat, lng, offworld = coords
        elif loc: unknown.add(loc)
        agency = g("Agency")
        # link: PDF/Image link, else DVIDS video, else none
        link = g("PDF | Image Link") or None
        if not link and g("DVIDS Video ID"):
            link = f"https://www.dvidshub.net/video/{g('DVIDS Video ID')}"
        out.append({
            "id": f"pursue-{i+1:03d}",
            "title": g("Title") or g("Video Title") or "Untitled record",
            "agency": agency,
            "agency_color": AGENCY_COLOR.get(agency, "#aaaaaa"),
            "type": g("Type"),                       # PDF | VID | IMG | AUD
            "release": RELEASE.get(g("Release Date"), g("Release Date")),
            "date": iso, "year": year, "era": era(year),
            "location": loc or None, "lat": lat, "lng": lng, "offworld": offworld,
            "description": g("Description Blurb"),
            "link": link,
        })
    # ---- merge curated INTERNATIONAL official-government cases ----
    INTL_COLOR = "#b6ff3c"
    wpath = os.path.join(HERE, "world_cases.json")
    world_n = 0
    if os.path.exists(wpath):
        import json as _json
        wc = _json.load(open(wpath, encoding="utf-8")).get("cases", [])
        for j, c in enumerate(wc):
            iso, year = norm_date(str(c.get("date", "")))
            out.append({
                "id": f"world-{j+1:03d}",
                "title": f"{c.get('flag','')} {c.get('title','')}".strip(),
                "agency": f"{c.get('country')} — {c.get('agency')}",
                "agency_color": INTL_COLOR,
                "type": c.get("type", "DOC"),
                "release": "International (official government archives)",
                "date": iso, "year": year, "era": era(year),
                "location": c.get("location"), "lat": c.get("lat"), "lng": c.get("lng"),
                "offworld": False, "country": c.get("country"), "flag": c.get("flag"),
                "description": c.get("description", ""), "link": c.get("link"),
            })
        world_n = len(wc)

    meta = {
        "source": "war.gov/UFO — PURSUE Releases 1 & 2 (US Dept. of War, 2026-05-08 & 2026-05-22) + curated international official-government cases",
        "license": "Public domain (17 U.S.C. 105 — US federal government work)",
        "record_count": len(out),
        "with_coords": sum(1 for x in out if x["lat"] is not None),
        "offworld": sum(1 for x in out if x["offworld"]),
        "agencies": AGENCY_COLOR,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    import json
    json.dump({"meta": meta, "sightings": out}, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"wrote {OUT}: {len(out)} records | coords {meta['with_coords']} | off-world {meta['offworld']}")
    if unknown: print("UNMAPPED locations:", sorted(unknown))


if __name__ == "__main__":
    main()
