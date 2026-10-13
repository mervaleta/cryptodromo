import unittest
import importlib.util
from pathlib import Path
import json
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime(2026, 10, 13, 6, 10, tzinfo=timezone.utc)

def race(**kw):
    r = dict(id=1, name='Copa observable', start='2026-10-13T06:09:00Z', end='2026-10-13T06:12:00Z', participants=[dict(coin=dict(name='Bitcoin', symbol='BTC'), position=1, secret='DO_NOT_KEEP')], secret='DO_NOT_KEEP')
    r.update(kw)
    return r

def page(r):
    return '<script id="__NEXT_DATA__" type="application/json">' + json.dumps({'props': {'pageProps': {'currentRace': r, 'nextRace': []}}}).replace('<', '\\u003c') + '</script>'

def module():
    spec = importlib.util.spec_from_file_location('collector', ROOT / 'collector.py')
    if spec is None or not (ROOT / 'collector.py').exists():
        raise AssertionError('Missing collector implementation')
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

class CollectorTests(unittest.TestCase):
    def test_source_whitelist_drops_all_non_display_values(self):
        m = module()
        result = m.parse_source(page(race()), NOW)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['participants'], [{'name': 'Bitcoin', 'label': 'BTC'}])
        self.assertNotIn('DO_NOT_KEEP', json.dumps(result))
        self.assertEqual(set(result[0]), {'id','name','start','end','status','participants','standings'})
        self.assertEqual(result[0]['standings'], [])

    def test_future_and_unverified_results_never_become_recaps(self):
        m = module()
        r = race(status='confirmed', resultsConfirmed=True, results=[{'position':1, 'name':'Bitcoin'}])
        safe = m.parse_source(page(r), NOW)
        self.assertEqual(safe[0]['standings'], [])
        stories = m.edit(safe, NOW, NOW, 'snapshot')
        self.assertFalse(any(s['kind'] == 'result' for s in stories))
        self.assertTrue(all('ganador' not in s['body'] for s in stories))

    def test_duplicate_run_static_escaping_and_private_boundary(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            m = module()
            root = Path(tmp)
            state, out = root / 'private/state.sqlite', root / 'public'
            source = page(race(name='<script>alert(1)</script>'))
            m.run(state, out, NOW, capture=True, fetch=lambda: source)
            first = (out / 'index.html').read_text()
            count = m.count_posts(state)
            before = (out / 'index.html').stat().st_mtime_ns
            m.run(state, out, NOW, capture=False, fetch=lambda: self.fail('local publish must not fetch'))
            self.assertEqual(m.count_posts(state), count)
            self.assertEqual((out / 'index.html').stat().st_mtime_ns, before)
            self.assertIn('&lt;script&gt;', first)
            self.assertNotIn('<script>alert(1)</script>', first)
            self.assertTrue((out / 'rss.xml').exists())
            self.assertTrue((out / 'archive/index.html').exists())
            self.assertNotIn('DO_NOT_KEEP', state.read_bytes().decode(errors='ignore'))
            self.assertFalse(any(p.suffix == '.sqlite' for p in out.rglob('*')))
            with self.assertRaises(ValueError):
                m.run(out / 'bad.sqlite', out, NOW)

    def test_replay_embargo_daily_fetch_cap_and_failure_retains_posts(self):
        import tempfile
        from datetime import timedelta
        with tempfile.TemporaryDirectory() as tmp:
            m = module()
            state, out = Path(tmp)/'private/state.sqlite', Path(tmp)/'public'
            calls = []
            def fetch():
                calls.append(1)
                return page(race())
            m.run(state,out,NOW,capture=True,fetch=fetch,mode='replay')
            self.assertEqual(m.count_posts(state),16) # authored pieces are not replay events
            m.run(state,out,NOW,capture=True,fetch=fetch,mode='replay')
            self.assertEqual(len(calls),1)
            later = NOW + timedelta(days=1, minutes=5)
            m.run(state,out,later,mode='replay')
            count = m.count_posts(state)
            self.assertGreater(count,0)
            self.assertIn('Replay / simulación', (out/'index.html').read_text())
            def broken(): raise OSError('UPSTREAM_PRIVATE_ERROR')
            m.run(state,out,later,capture=True,fetch=broken,mode='replay')
            self.assertEqual(count,m.count_posts(state))
            self.assertIn('Fuente no disponible', (out/'index.html').read_text())
            self.assertNotIn('UPSTREAM_PRIVATE_ERROR',state.read_bytes().decode(errors='ignore'))
            # Replay publication time is actual first emission, not its eligibility deadline.
            import sqlite3
            with sqlite3.connect(state) as db:
                for row in db.execute('SELECT payload FROM posts'):
                    s = json.loads(row[0])
                    if s['mode'] == 'replay':
                        self.assertEqual(s['published_at'],later.isoformat())

    def test_initial_issue_categories_fiction_labels_and_original_art(self):
        import tempfile
        import sqlite3
        from collections import Counter
        with tempfile.TemporaryDirectory() as tmp:
            m = module()
            state,out = Path(tmp)/'private/state.sqlite',Path(tmp)/'public'
            r = race()
            payload=json.loads(page(r).split('>',1)[1].rsplit('</script>',1)[0])
            payload['props']['pageProps']['nextRace']=[race(id=i,start='2026-10-13T07:00:00Z',end='2026-10-13T07:03:00Z') for i in range(2,6)]
            source='<script id="__NEXT_DATA__">'+json.dumps(payload)+'</script>'
            m.run(state,out,NOW,capture=True,fetch=lambda:source)
            with sqlite3.connect(state) as db:
                posts=[json.loads(x[0]) for x in db.execute('SELECT payload FROM posts')]
            counts=Counter(s['category'] for s in posts)
            self.assertGreaterEqual(len(counts),5)
            self.assertTrue(all(n>=4 for n in counts.values()))
            for s in posts:
                article=(out/'articles'/ (s['id']+'.html')).read_text()
                if s['category']=='Stud del Humor':
                    self.assertIn('Ficción / sátira — personajes inventados',article)
                    self.assertNotIn('Fuente: <a',article)
                if s['category']=='Vidriera ficticia':
                    self.assertIn('Publicidad ficticia — no es una oferta comercial',article)
                    self.assertIn('Ficción / sátira — personajes inventados',article)
                    self.assertNotIn('comprar ahora',article.lower())
            manifest=json.loads((out/'assets/manifest.json').read_text())
            self.assertGreaterEqual(len(manifest),4)
            for asset in manifest:
                self.assertIn('license',asset)
                self.assertTrue((out/asset['path']).exists())
                self.assertLess((out/asset['path']).stat().st_size,200000)
                self.assertLessEqual(asset['width'],1200)
            self.assertTrue((Path(tmp)/'private/category-counts.json').exists())
            index=(out/'index.html').read_text()
            self.assertIn('id="humor"',index)
            self.assertIn('loading="lazy"',index)
            self.assertIn('Próximas en la instantánea',index)
            self.assertIn('Últimos titulares observados',index)

    def test_rss_absolute_links_fiction_labels_and_publication_dates(self):
        import tempfile
        import xml.etree.ElementTree as ET
        with tempfile.TemporaryDirectory() as tmp:
            m=module()
            state,out=Path(tmp)/'private/state.sqlite',Path(tmp)/'public'
            m.run(state,out,NOW,capture=True,fetch=lambda:page(race()))
            feed=ET.parse(out/'rss.xml')
            for item in feed.findall('./channel/item'):
                self.assertTrue(item.findtext('link').startswith('https://'))
                self.assertIsNotNone(item.findtext('pubDate'))
                title=item.findtext('title')
                if 'Rita Rebalanceo' in title:
                    self.assertIn('Ficción / sátira',item.findtext('description'))
                if 'Margin Call' in title:
                    self.assertIn('Publicidad ficticia',item.findtext('description'))

if __name__ == '__main__':
    unittest.main()
