import unittest, subprocess, sys, sqlite3, gzip, json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class ExportTests(unittest.TestCase):
    def test_mysql_export_exact_roundtrip(self):
        self.assertTrue((ROOT/'export_mysql.py').exists(),'optional exporter missing')
        subprocess.run([sys.executable,str(ROOT/'export_mysql.py')],check=True)
        schema=(ROOT/'private/mysql-schema.sql').read_text()
        self.assertIn('BIGINT',schema); self.assertIn('PRIMARY KEY (asset_id, minute)',schema)
        payload=(ROOT/'private/mysql-import.sql.gz').read_bytes()
        db=sqlite3.connect(':memory:')
        source=sqlite3.connect(ROOT/'private/market-v1.sqlite')
        for statement in source.iterdump():
            if statement.startswith('CREATE TABLE'): db.execute(statement)
        db.executescript(gzip.decompress(payload).decode())
        self.assertEqual(db.execute('SELECT COUNT(*) FROM prices').fetchone()[0],534240)
        for table,order in [('assets','asset_id'),('prices','asset_id,minute')]:
            a=db.execute(f'SELECT * FROM {table} ORDER BY {order}')
            b=source.execute(f'SELECT * FROM {table} ORDER BY {order}')
            for ra,rb in zip(a,b,strict=True): self.assertEqual(ra,rb)
        db.close(); source.close()
        info=json.loads((ROOT/'private/export-manifest.json').read_text())
        self.assertEqual(info['mysql-import.sql.gz'],hashlib.sha256(payload).hexdigest())
        subprocess.run([sys.executable,str(ROOT/'export_mysql.py')],check=True)
        self.assertEqual(payload,(ROOT/'private/mysql-import.sql.gz').read_bytes())
if __name__=='__main__': unittest.main()
