import json
import re
from pathlib import Path

backend_dir = Path("d:/codes/Yuva_yodha_hackthon/backend")
src_data_dir = Path("d:/codes/Yuva_yodha_hackthon/src/data")

# Load sources and substations JSON
with open(backend_dir / "sources_data.json", "r", encoding="utf-8") as f:
    sources = json.load(f)

with open(backend_dir / "substations_data.json", "r", encoding="utf-8") as f:
    substations = json.load(f)

with open(backend_dir / "sinks_data.json", "r", encoding="utf-8") as f:
    sinks = json.load(f)

with open(backend_dir / "official_grid_data.json", "r", encoding="utf-8") as f:
    official_grid_data = json.load(f)

# Read original indiaGridData.js
js_path = src_data_dir / "indiaGridData.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract parts of indiaGridData.js
# 1. Baseline & Regions (from line 1 to export const INDIA_GRID_SOURCES)
m_sources = re.search(r'export const INDIA_GRID_SOURCES = \[', content)
if not m_sources:
    raise ValueError("Could not find INDIA_GRID_SOURCES in indiaGridData.js")
prefix = content[:m_sources.start()]

# 2. Extract SINKS start
m_sinks = re.search(r'export const INDIA_GRID_SINKS = \[', content)
if not m_sinks:
    raise ValueError("Could not find INDIA_GRID_SINKS in indiaGridData.js")

# 3. Extract TRANSMISSION_CORRIDORS start
m_corr = re.search(r'export const TRANSMISSION_CORRIDORS = \[', content)
if not m_corr:
    raise ValueError("Could not find TRANSMISSION_CORRIDORS in indiaGridData.js")

# 4. Extract SOLAR_RE_ZONES start
m_zones = re.search(r'export const SOLAR_RE_ZONES = \[', content)
if not m_zones:
    raise ValueError("Could not find SOLAR_RE_ZONES in indiaGridData.js")
zones_and_suffix = content[m_zones.start():]

# Parse current transmission corridors
corridors_code = content[m_corr.start():m_zones.start()]

cross_border_corridors = [
    {
        "id": "CORR-XBORDER-BANGLADESH",
        "name": "Baharampur (India) -> Bheramara (Bangladesh) 400 kV HVDC Interconnection",
        "from": [24.10, 88.25],
        "to": [24.03, 89.02],
        "fromLabel": "Baharampur 400kV Substation",
        "toLabel": "Bheramara HVDC Back-to-Back Terminal",
        "capacityMw": 1000,
        "flowMw": 840,
        "voltageKv": 400,
        "lengthKm": 125,
        "conductorType": "Twin ACSR Moose",
        "nominalCurrentA: ": 1600,
        "type": "CROSS_BORDER_LINK",
        "color": "#10b981",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-XBORDER-NEPAL",
        "name": "Muzaffarpur (India) -> Dhalkebar (Nepal) 400 kV Cross-Border Interconnection",
        "from": [26.12, 85.39],
        "to": [26.96, 85.95],
        "fromLabel": "Muzaffarpur 400kV Substation",
        "toLabel": "Dhalkebar 400kV GIS Substation",
        "capacityMw": 1000,
        "flowMw": 620,
        "voltageKv": 400,
        "lengthKm": 140,
        "conductorType": "Twin ACSR Moose",
        "nominalCurrentA: ": 1600,
        "type": "CROSS_BORDER_LINK",
        "color": "#10b981",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-XBORDER-BHUTAN",
        "name": "Tala Hydro (Bhutan) -> Alipurduar (India) 400 kV Cross-Border Interconnection",
        "from": [27.02, 89.65],
        "to": [26.49, 89.53],
        "fromLabel": "Tala Hydro Generating Station",
        "toLabel": "Alipurduar 400kV/±800kV HVDC Hub",
        "capacityMw": 2000,
        "flowMw": 1450,
        "voltageKv": 400,
        "lengthKm": 115,
        "conductorType": "Quad ACSR Bersimis",
        "nominalCurrentA: ": 2800,
        "type": "CROSS_BORDER_LINK",
        "color": "#38bdf8",
        "status": "ENERGIZED",
        "rerouteTarget": None
    }
]

# Build new JavaScript code
new_content = prefix

# Append INDIA_GRID_SOURCES
new_content += f"export const INDIA_GRID_SOURCES = {json.dumps(sources, indent=2)};\n\n"

# Append INDIA_GRID_SUBSTATIONS
new_content += f"// Official 765 kV / 400 kV / ±800 kV HVDC Grid Substations & Renewable Energy Pooling Stations (REMC)\n"
new_content += f"// Sourced from Central Electricity Authority (CEA) & POWERGRID (PGCIL)\n"
new_content += f"export const INDIA_GRID_SUBSTATIONS = {json.dumps(substations, indent=2)};\n\n"

# Append INDIA_GRID_SINKS
new_content += f"export const INDIA_GRID_SINKS = {json.dumps(sinks, indent=2)};\n\n"

# Append TRANSMISSION_CORRIDORS including cross-border
# Load existing corridors from official_grid_data.json
existing_corr = official_grid_data.get("OFFICIAL_TRANSMISSION_CORRIDORS", [])
# Merge with cross-border corridors
merged_corr = existing_corr + [c for c in cross_border_corridors if c['id'] not in {x.get('id') for x in existing_corr}]
new_content += f"export const TRANSMISSION_CORRIDORS = {json.dumps(merged_corr, indent=2)};\n\n"

# Append remaining zones and bounds
new_content += zones_and_suffix

with open(js_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Successfully updated {js_path}!")
print(f"Exported {len(sources)} Sources, {len(substations)} Substations, {len(sinks)} Sinks, {len(merged_corr)} Corridors!")
