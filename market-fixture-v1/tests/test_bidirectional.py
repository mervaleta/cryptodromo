import sqlite3,unittest
from pathlib import Path
class MarketMovementTests(unittest.TestCase):
 def test_each_asset_has_rises_and_falls(self):
  p=Path(__file__).resolve().parents[1]/'private/market-v1.sqlite'
  from contextlib import closing
  with closing(sqlite3.connect(p)) as db:
   for (asset,) in db.execute('SELECT asset_id FROM assets'):
    values=[r[0] for r in db.execute('SELECT price_units FROM prices WHERE asset_id=? ORDER BY minute',(asset,))]
    deltas=[b-a for a,b in zip(values,values[1:])]
    self.assertTrue(any(d<0 for d in deltas),asset+' lacks declines')
    self.assertTrue(any(d>0 for d in deltas),asset+' lacks rises')
