"""Build-only deterministic fictional fixture. Never imported by the API."""
import hashlib, json, sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parent
START=29852640
COUNT=10080
SCHEMA='''CREATE TABLE assets(asset_id TEXT PRIMARY KEY, ticker TEXT NOT NULL, market TEXT NOT NULL, name TEXT NOT NULL, currency TEXT NOT NULL, scale INTEGER NOT NULL, anchor_units INTEGER NOT NULL CHECK(anchor_units>0));
CREATE TABLE prices(asset_id TEXT NOT NULL REFERENCES assets(asset_id), minute INTEGER NOT NULL, price_units INTEGER NOT NULL CHECK(price_units>0), PRIMARY KEY(asset_id,minute)) WITHOUT ROWID;
CREATE INDEX prices_minute ON prices(minute,asset_id);'''

def build():
    catalog=json.loads((ROOT/'catalog.json').read_text())
    ids=[a['asset_id'] for a in catalog]
    if len(ids)!=len(set(ids)): raise ValueError('duplicate asset_id')
    private=ROOT/'private'; private.mkdir(exist_ok=True)
    target=private/'market-v1.sqlite'
    if target.exists(): target.unlink()
    db=sqlite3.connect(target)
    db.executescript('PRAGMA page_size=4096; PRAGMA foreign_keys=ON;'+SCHEMA)
    for a in sorted(catalog,key=lambda a:a['asset_id']):
        db.execute('INSERT INTO assets VALUES(?,?,?,?,?,?,?)',tuple(a[k] for k in ('asset_id','ticker','market','name','currency','scale','anchor_units')))
        seed=int.from_bytes(hashlib.sha256(a['asset_id'].encode()).digest()[:4],'big')
        units=a['anchor_units']; rows=[]
        for i in range(COUNT):
            if i:
                # Build-time signed basis-point steps: crypto more volatile than FX.
                # Integer arithmetic avoids float drift. Fixed per-asset PRNG seed.
                seed=(1664525*seed+1013904223)&0xffffffff
                amplitude=12 if a['market']=='CRYPTO' else 5
                step=((seed>>8)%(2*amplitude+1))-amplitude
                units=max(1,units+(units*step//10000))
            rows.append((a['asset_id'],START+i,units))
        db.executemany('INSERT INTO prices VALUES(?,?,?)',rows)
    db.commit(); db.execute('VACUUM'); db.close()
    manifest={'version':'market-fixture-v1','simulation':True,'price_semantics':'Fictional anchors; synthetic 24/7 minute grid, NOT live prices or official sessions. Deterministic bidirectional integer-unit simulated paths.', 'start':'2026-10-05T00:00:00Z','end':'2026-10-11T23:59:00Z','minutes_per_asset':COUNT,'asset_count':len(catalog),'row_count':COUNT*len(catalog),'database_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'catalog_sha256':hashlib.sha256((ROOT/'catalog.json').read_bytes()).hexdigest(),'generator':'sha256 asset seed + fixed LCG signed basis-point steps; build-time only'}
    (private/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(manifest))
if __name__=='__main__': build()
