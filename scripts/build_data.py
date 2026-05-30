#!/usr/bin/env python3
"""Build uap-pulse/data/sightings.json from the PURSUE raw record index.

Source: war.gov/UFO PURSUE Release 1 (US DoW, 2026-05-08) — public domain (17 USC 105).
Geocodes the ~35 distinct place-names to representative coordinates, normalizes dates,
and flags off-world (Moon / orbit) records for the map's off-world layer.
"""
import json, os, re

HERE = os.path.dirname(__file__)
RAW = os.path.join(HERE, "pursue-records.raw.json")
OUT = os.path.join(HERE, "..", "data", "sightings.json")

# Representative coordinates for the place-names that appear in the release.
# Regions/seas use a sensible centroid. Off-world entries carry offworld=True.
GEO = {
    "Western United States": (39.5, -116.0, False),
    "Southern United States": (32.0, -90.0, False),
    "United States": (39.8, -98.6, False),
    "North America": (45.0, -100.0, False),
    "Detroit, MI": (42.331, -83.046, False),
    "Pacific Time Zone": (37.0, -120.5, False),
    "Syria": (35.0, 38.0, False),
    "Iraq": (33.2, 43.7, False),
    "Iran": (32.0, 53.0, False),
    "Middle East": (29.0, 45.0, False),
    "United Arab Emirates": (24.0, 54.0, False),
    "Greece": (39.0, 22.0, False),
    "Germany": (51.0, 10.0, False),
    "Netherlands": (52.1, 5.3, False),
    "Azerbaijan": (40.4, 47.6, False),
    "Georgia": (42.3, 43.4, False),
    "Kazakhstan": (48.0, 67.0, False),
    "Turkmenistan": (39.0, 59.0, False),
    "Japan": (36.2, 138.3, False),
    "Djibouti": (11.8, 42.6, False),
    "Papua New Guinea": (-6.3, 143.9, False),
    "Mexico": (23.6, -102.5, False),
    "Indo-PACOM": (-5.0, 120.0, False),
    "Arabian Gulf": (26.5, 51.5, False),
    "Persian Gulf": (26.5, 52.0, False),
    "Gulf of Oman": (24.5, 58.5, False),
    "Gulf of Aden": (12.5, 47.0, False),
    "Strait of Hormuz": (26.6, 56.5, False),
    "Arabian Sea": (16.0, 65.0, False),
    "Mediterranean Sea": (35.0, 18.0, False),
    "Aegean Sea": (38.5, 25.0, False),
    "East China Sea": (29.0, 125.0, False),
    "Pacific Ocean": (0.0, -160.0, False),
    # off-world
    "Moon": (0.0, 0.0, True),
    "Low Earth Orbit": (0.0, 0.0, True),
}

AGENCY_COLOR = {
    "Department of War": "#ff3b6b",   # hot red
    "FBI": "#ffcf3b",                 # amber
    "NASA": "#3bd1ff",                # cyan
    "Department of State": "#9b5bff", # violet
}


def norm_date(s):
    """'12/30/47' -> ('1947-12-30', 1947); '5/6/22' -> ('2022-05-06', 2022). Returns (iso|None, year|None)."""
    if not s or s in ("N/A", "None"):
        return None, None
    m = re.match(r"^\s*(\d{1,2})/(\d{1,2})/(\d{2,4})\s*$", s)
    if not m:
        # try a bare year
        y = re.match(r"^\s*(\d{4})\s*$", s)
        if y:
            return None, int(y.group(1))
        return None, None
    mo, dy, yr = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if yr < 100:
        yr = 2000 + yr if yr <= 26 else 1900 + yr  # cutoff at current 2-digit year
    try:
        return f"{yr:04d}-{mo:02d}-{dy:02d}", yr
    except Exception:
        return None, yr


def era(year):
    if year is None:
        return "Unknown"
    if year <= 1945:
        return "WWII Foo Fighters (1944–45)"
    if year <= 1969:
        return "Cold War & Space Race (1946–69)"
    if year <= 2003:
        return "Modern Files (1970–2003)"
    return "Navy Era & Disclosure (2004–26)"


def main():
    recs = json.load(open(RAW))
    out = []
    unknown_loc = 0
    for i, r in enumerate(recs):
        loc = (r.get("incident_location") or "N/A").strip()
        iso, year = norm_date(r.get("incident_date"))
        g = GEO.get(loc)
        lat = lng = None
        offworld = False
        if g:
            lat, lng, offworld = g
        elif loc not in ("N/A", "", "None"):
            # location text present but not in our gazetteer -> keep, no coords
            unknown_loc += 1
        out.append({
            "id": f"pursue-{i+1:03d}",
            "title": r.get("title"),
            "agency": r.get("agency"),
            "agency_color": AGENCY_COLOR.get(r.get("agency"), "#aaaaaa"),
            "type": r.get("type"),            # PDF | VID | IMG
            "date": iso,
            "year": year,
            "era": era(year),
            "location": None if loc in ("N/A", "", "None") else loc,
            "lat": lat,
            "lng": lng,
            "offworld": offworld,
            "description": (r.get("description") or "").strip(),
            "link": r.get("pdf_link"),
        })
    meta = {
        "source": "war.gov/UFO — PURSUE Release 1 (US Dept. of War, 2026-05-08)",
        "license": "Public domain (17 U.S.C. 105 — US federal government work)",
        "release_date": "2026-05-08",
        "record_count": len(out),
        "with_coords": sum(1 for x in out if x["lat"] is not None),
        "offworld": sum(1 for x in out if x["offworld"]),
        "agencies": AGENCY_COLOR,
    }
    payload = {"meta": meta, "sightings": out}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(payload, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"wrote {OUT}")
    print(f"records: {len(out)} | with coords: {meta['with_coords']} | off-world: {meta['offworld']} | unmapped-loc-text: {unknown_loc}")


if __name__ == "__main__":
    main()
