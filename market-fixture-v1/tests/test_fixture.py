import unittest, subprocess, sys, sqlite3, json, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

class FixtureTests(unittest.TestCase):
    def test_snapshot_uses_minute_index(self):
        db=sqlite3.connect(ROOT/'private/market-v1.sqlite')
        try:
            plan=db.execute('EXPLAIN QUERY PLAN SELECT * FROM prices WHERE minute=?',(29852640,)).fetchall()
            self.assertTrue(any('SEARCH' in r[3] and 'minute' in r[3] for r in plan),str(plan))
        finally: db.close()

    def test_duplicate_catalog_rejected(self):
        import tempfile, shutil
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            path=Path(directory); shutil.copy(ROOT/'build.py',path/'build.py')
            catalog=json.loads((ROOT/'catalog.json').read_text()); catalog.append(catalog[0])
            (path/'catalog.json').write_text(json.dumps(catalog))
            result=subprocess.run([sys.executable,str(path/'build.py')],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn('duplicate asset_id',result.stderr)
            self.assertFalse((path/'private/market-v1.sqlite').exists())

    def test_fixed_complete_dataset(self):
        self.assertTrue((ROOT/'build.py').exists(), 'build-time generator missing')
        subprocess.run([sys.executable, str(ROOT/'build.py')], check=True)
        db = sqlite3.connect(ROOT/'private/market-v1.sqlite')
        assets = db.execute('SELECT asset_id,scale,anchor_units FROM assets ORDER BY asset_id').fetchall()
        self.assertGreaterEqual(len(assets),40)
        self.assertLessEqual(len(assets),60)
        self.assertEqual(len(assets), len(set(a[0] for a in assets)))
        self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0],'ok')
        for aid,scale,anchor in assets:
            rows = db.execute('SELECT minute,price_units FROM prices WHERE asset_id=? ORDER BY minute',(aid,)).fetchall()
            self.assertEqual(len(rows),10080)
            self.assertEqual(rows[0][0],29852640)
            self.assertEqual(rows[-1][0],29862719)
            self.assertTrue(all(b[0]-a[0]==1 for a,b in zip(rows,rows[1:])))
            self.assertTrue(all(type(p) is int and p>0 for _,p in rows))
            self.assertEqual(rows[0][1],anchor)
            # Both rises and falls are needed to exercise market-driven consumers.
            self.assertTrue(any(b[1] < a[1] for a,b in zip(rows,rows[1:])))
            self.assertTrue(any(b[1] > a[1] for a,b in zip(rows,rows[1:])))
        db.close()
        manifest=json.loads((ROOT/'private/manifest.json').read_text())
        self.assertEqual(manifest['row_count'],len(assets)*10080)
        self.assertEqual(manifest['database_sha256'],hashlib.sha256((ROOT/'private/market-v1.sqlite').read_bytes()).hexdigest())
        first=(ROOT/'private/market-v1.sqlite').read_bytes()
        subprocess.run([sys.executable,str(ROOT/'build.py')],check=True)
        self.assertEqual(first,(ROOT/'private/market-v1.sqlite').read_bytes())

if __name__=='__main__': unittest.main()
