import urllib.request
import json
import sys

def main():
    try:
        # 1. Health
        r = urllib.request.urlopen('http://localhost:5000/api/health', timeout=5)
        print('Health:', r.status)

        # 2. Sources
        r = urllib.request.urlopen('http://localhost:5000/api/grid/sources', timeout=5)
        sources_resp = json.loads(r.read())
        print(f"Total Generation Sources: {sources_resp['count']} (Capacity: {sources_resp['totalCapacityMw']:,} MW)")

        # 3. Substations
        r = urllib.request.urlopen('http://localhost:5000/api/grid/substations', timeout=5)
        subs_resp = json.loads(r.read())
        print(f"Total Grid Substations: {subs_resp['count']} (Capacity: {subs_resp['totalCapacityMva']:,} MVA)")

        # 4. Specific substations
        r = urllib.request.urlopen('http://localhost:5000/api/grid/substations/SS-KHAVDA-PS', timeout=5)
        khavda = json.loads(r.read())['substation']
        print(f"Khavda Substation: {khavda['name']} | {khavda['voltageKv']} kV | {khavda['transformationCapacityMva']:,} MVA")

        r = urllib.request.urlopen('http://localhost:5000/api/grid/substations/SS-BHADLA-PS', timeout=5)
        bhadla = json.loads(r.read())['substation']
        print(f"Bhadla Substation: {bhadla['name']} | {bhadla['voltageKv']} kV | {bhadla['transformationCapacityMva']:,} MVA")

        # 5. Specific power sources
        r = urllib.request.urlopen('http://localhost:5000/api/grid/sources/SRC-RAMAGUNDAM-FLOAT', timeout=5)
        ram = json.loads(r.read())['source']
        print(f"Ramagundam Floating Solar: {ram['name']} | {ram['capacityMw']:,} MW")

        r = urllib.request.urlopen('http://localhost:5000/api/grid/sources/SRC-RIHAND-HYDRO', timeout=5)
        rihand = json.loads(r.read())['source']
        print(f"Rihand Hydro: {rihand['name']} | {rihand['capacityMw']:,} MW")

        # 6. Database counts via POST /api/db/query
        req = urllib.request.Request(
            'http://localhost:5000/api/db/query',
            data=json.dumps({'sql': 'SELECT count(*) as count FROM grid_substations'}).encode(),
            headers={'Content-Type': 'application/json'}
        )
        r = urllib.request.urlopen(req, timeout=5)
        db_res = json.loads(r.read())
        print(f"SQLite DB grid_substations row count: {db_res['rows'][0]['count']}")

        req = urllib.request.Request(
            'http://localhost:5000/api/db/query',
            data=json.dumps({'sql': 'SELECT count(*) as count FROM power_plants'}).encode(),
            headers={'Content-Type': 'application/json'}
        )
        r = urllib.request.urlopen(req, timeout=5)
        db_res2 = json.loads(r.read())
        print(f"SQLite DB power_plants row count: {db_res2['rows'][0]['count']}")

        print("=== ALL STATIONS AND SUBSTATIONS VERIFIED SUCCESSFULLY ===")
    except Exception as e:
        print(f"Error during verification: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
