"""Optional offline export, not a deployed MySQL backend. No credentials."""
from pathlib import Path
import sqlite3, gzip, hashlib, json
ROOT=Path(__file__).resolve().parent
SCHEMA='''-- OPTIONAL: use a NEW dedicated database; no DROP statements.
CREATE TABLE assets (
 asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 ticker VARCHAR(32) NOT NULL, market VARCHAR(32) NOT NULL, name VARCHAR(255) NOT NULL,
 currency VARCHAR(16) NOT NULL, scale INT NOT NULL, anchor_units BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE prices (
 asset_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 minute BIGINT NOT NULL, price_units BIGINT NOT NULL,
 PRIMARY KEY (asset_id, minute), KEY prices_minute (minute, asset_id),
 FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
'''
def literal(value):
    if isinstance(value,int): return str(value)
    if '\\' in value: raise ValueError('backslash not supported in portable export')
    return "'"+value.replace("'","''")+"'"
def export():
    private=ROOT/'private'
    (private/'mysql-schema.sql').write_text(SCHEMA)
    db=sqlite3.connect(f'file:{private}/market-v1.sqlite?mode=ro',uri=True)
    with (private/'mysql-import.sql.gz').open('wb') as raw:
        with gzip.GzipFile(filename='',fileobj=raw,mode='wb',mtime=0) as out:
            out.write(b'-- Fictional simulated fixture; import schema separately into an empty dedicated database.\nBEGIN;\n')
            for table,order in [('assets','asset_id'),('prices','asset_id,minute')]:
                cursor=db.execute(f'SELECT * FROM {table} ORDER BY {order}')
                while rows:=cursor.fetchmany(500):
                    values=','.join('('+','.join(literal(v) for v in row)+')' for row in rows)
                    out.write(f'INSERT INTO {table} VALUES {values};\n'.encode())
            out.write(b'COMMIT;\n')
    db.close()
    info={name:hashlib.sha256((private/name).read_bytes()).hexdigest() for name in ['market-v1.sqlite','mysql-schema.sql','mysql-import.sql.gz']}
    (private/'export-manifest.json').write_text(json.dumps(info,indent=2)+'\n')
    print(json.dumps(info))
if __name__=='__main__': export()
