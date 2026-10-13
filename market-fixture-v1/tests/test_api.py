import unittest, subprocess, os, socket, time, json, urllib.request, urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import shutil
        installed=os.environ.get('PHP_BIN') or shutil.which('php')
        php=Path(installed) if installed else ROOT/'runtime/extracted/usr/bin/php8.4'
        if not php.exists(): raise unittest.SkipTest('PHP unavailable: fixture tests still run; install PHP PDO SQLite to test HTTP API')
        cls.php=[str(php)]
        env=os.environ.copy()
        if not installed:
            cls.php += ['-n','-d','extension='+str(ROOT/'runtime/extracted/usr/lib/php/20240924/pdo.so'),'-d','extension='+str(ROOT/'runtime/extracted/usr/lib/php/20240924/pdo_sqlite.so')]
            env['LD_LIBRARY_PATH']=str(ROOT/'runtime/extracted/usr/lib/x86_64-linux-gnu')
        env['MARKET_DATA_PRIVATE_DIR']=str(ROOT/'private')
        cls.env=env; cls.server=None
        if (ROOT/'public_html/market-data/v1/index.php').exists():
            with socket.socket() as s: s.bind(('127.0.0.1',0)); port=s.getsockname()[1]
            cls.base=f'http://127.0.0.1:{port}/market-data/v1/index.php'
            cls.log=open(ROOT/'tests/php-server.log','w')
            cls.server=subprocess.Popen(cls.php+['-S',f'127.0.0.1:{port}','-t',str(ROOT/'public_html')],env=env,stdout=cls.log,stderr=cls.log)
            for _ in range(100):
                try:
                    with socket.create_connection(('127.0.0.1',port),timeout=.1): break
                except OSError: time.sleep(.02)
            else: raise RuntimeError('PHP server did not start')
    @classmethod
    def tearDownClass(cls):
        if cls.server: cls.server.terminate(); cls.server.wait(); cls.log.close()
    def request(self,query,method='GET'):
        req=urllib.request.Request(self.base+'?'+query,method=method)
        try: response=urllib.request.urlopen(req)
        except urllib.error.HTTPError as e: response=e
        with response: return response.status,json.loads(response.read())
    def test_assets(self):
        code,data=self.request('action=assets')
        self.assertEqual(code,200)
        self.assertTrue(data['simulation'])
        self.assertIn('assets',data,'asset listing missing')
        self.assertEqual(len(data['assets']),53)
        ids={a['asset_id']:a for a in data['assets']}
        self.assertIn('BYMA:GGAL',ids); self.assertIn('NYSE-ADR:GGAL',ids)
        self.assertIn('CRYPTO:POL',ids); self.assertIn('CRYPTO:MATIC',ids)
        self.assertEqual(ids['CRYPTO:BTC']['anchor_price'],'100.00000000')
        self.assertTrue(all(isinstance(a['anchor_price'],str) for a in ids.values()))

    def test_series_pagination_exact(self):
        from urllib.parse import urlencode
        query={'action':'series','asset_id':'CRYPTO:BTC','start':'2026-10-05T00:00:00Z','end':'2026-10-11T23:59:00Z','limit':'1000'}
        points=[]; cursors=[]
        for page in range(11):
            code,data=self.request(urlencode(query))
            self.assertEqual(code,200)
            self.assertIn('points',data,'series missing')
            self.assertEqual(data['total'],10080)
            self.assertEqual(data['count'],len(data['points']))
            self.assertLessEqual(data['count'],1000)
            points.extend(data['points'])
            cursor=data['next_cursor']
            if cursor is None: break
            self.assertNotIn(cursor,cursors); cursors.append(cursor); query['cursor']=cursor
        self.assertIsNone(cursor)
        self.assertEqual(len(points),10080)
        self.assertEqual(len({p['time'] for p in points}),10080)
        self.assertEqual(points[0],{'time':'2026-10-05T00:00:00Z','price':'100.00000000'})
        self.assertEqual(points[-1]['time'],'2026-10-11T23:59:00Z')
        import sqlite3
        db=sqlite3.connect(ROOT/'private/market-v1.sqlite')
        rows=db.execute("SELECT price_units FROM prices WHERE asset_id='CRYPTO:BTC' ORDER BY minute").fetchall()
        self.assertEqual([int(p['price'].replace('.','')) for p in points],[r[0] for r in rows])
        db.close()
        code,data=self.request('action=series&asset_id=BYMA:GGAL&start=2026-10-05T00:00:00Z&end=2026-10-05T00:02:00Z&limit=2')
        self.assertEqual(data['next_cursor'],'2026-10-05T00:02:00Z')
        code,data=self.request('action=series&asset_id=BYMA:GGAL&start=2026-10-05T00:00:00Z&end=2026-10-05T00:02:00Z&limit=2&cursor=2026-10-05T00:02:00Z')
        self.assertEqual(data['count'],1); self.assertIsNone(data['next_cursor'])

    def test_snapshot(self):
        code,data=self.request('action=snapshot&at=2026-10-05T00:00:00Z')
        self.assertEqual(code,200); self.assertIn('quotes',data,'snapshot missing')
        self.assertEqual(data['source_time'],'2026-10-05T00:00:00Z')
        self.assertEqual(len(data['quotes']),53)
        btc=next(q for q in data['quotes'] if q['asset_id']=='CRYPTO:BTC')
        self.assertEqual(btc['price'],'100.00000000')
        code,data=self.request('action=snapshot&at=2026-10-11T23:59:00Z&asset_id=BYMA:GGAL')
        self.assertEqual(code,200); self.assertEqual(len(data['quotes']),1)
        self.assertEqual(data['quotes'][0]['asset_id'],'BYMA:GGAL')

    def test_invalid_parameters(self):
        bad=['action=nope','action[]=assets','action=assets&surprise=1','action=assets&action=manifest','action=series','action=series&asset_id=CRYPTO:BTC&start=2026-10-05T00:00:01Z&end=2026-10-06T00:00:00Z','action=series&asset_id=CRYPTO:BTC&start=2026-10-05T00:00:00%2B00:00&end=2026-10-06T00:00:00Z','action=series&asset_id=CRYPTO:BTC&start=2026-02-30T00:00:00Z&end=2026-10-06T00:00:00Z','action=series&asset_id=CRYPTO:BTC&start=2026-10-04T23:59:00Z&end=2026-10-06T00:00:00Z','action=series&asset_id=CRYPTO:BTC&start=2026-10-06T00:00:00Z&end=2026-10-05T00:00:00Z','action=snapshot','action=snapshot&at=2026-10-12T00:00:00Z','action=snapshot&at[]=x']
        base='action=series&asset_id=CRYPTO:BTC&start=2026-10-05T00:00:00Z&end=2026-10-05T00:02:00Z'
        bad += [base+'&limit='+v for v in ['0','1001','-1','1.5','01','x']]
        bad += [base+'&cursor='+v for v in ['2026-10-04T23:59:00Z','2026-10-05T00:03:00Z','x']]
        for query in bad:
            with self.subTest(query=query):
                code,data=self.request(query); self.assertEqual(code,400)
                self.assertEqual(data['error']['code'],'invalid_parameter')
                self.assertTrue(data['simulation'])
        for action,tail in [('series','&start=2026-10-05T00:00:00Z&end=2026-10-05T00:01:00Z'),('snapshot','&at=2026-10-05T00:00:00Z')]:
            code,data=self.request('action='+action+'&asset_id=GGAL'+tail)
            self.assertEqual(code,404); self.assertEqual(data['error']['code'],'asset_not_found')
        code,data=self.request('action=manifest','POST')
        self.assertEqual(code,405); self.assertEqual(data['error']['code'],'method_not_allowed')

    def test_replay_explicit_clock(self):
        samples=[('2026-10-05T00:00:00Z','2026-10-05T00:00:00Z'),('2026-10-12T00:00:00Z','2026-10-05T00:00:00Z'),('2026-10-04T23:59:00Z','2026-10-11T23:59:00Z'),('2026-10-13T12:34:00Z','2026-10-06T12:34:00Z')]
        for playback,source in samples:
            code,data=self.request('action=replay&asset_id=CRYPTO:BTC&playback_time='+playback)
            self.assertEqual(code,200); self.assertEqual(data['data_mode'],'simulated/replay')
            self.assertEqual(data['playback_time'],playback); self.assertEqual(data['source_time'],source)
            self.assertTrue(data['simulation'])
            _,snapshot=self.request('action=snapshot&asset_id=CRYPTO:BTC&at='+source)
            self.assertEqual(data['quotes'],snapshot['quotes'])
        for tail in ['', '&playback_time=now','&playback_time=2026-10-13T12:34:01Z']:
            code,data=self.request('action=replay'+tail); self.assertEqual(code,400)
        code,data=self.request('action=replay&playback_time=2026-10-13T12:34:00Z&epoch=2026-10-13T12:34:00Z')
        self.assertEqual(code,200); self.assertEqual(data['source_time'],'2026-10-05T00:00:00Z')

    def test_immutable_cache(self):
        url=self.base+'?action=assets'
        with urllib.request.urlopen(url) as response:
            etag=response.headers.get('ETag'); self.assertIsNotNone(etag)
            self.assertEqual(response.headers.get('Cache-Control'),'public, max-age=31536000, immutable')
            self.assertEqual(response.headers.get('X-Dataset-Version'),'market-fixture-v1')
            body=response.read()
        req=urllib.request.Request(url,headers={'If-None-Match':etag})
        try: response=urllib.request.urlopen(req)
        except urllib.error.HTTPError as e: response=e
        with response: self.assertEqual(response.status,304); self.assertEqual(response.read(),b'')
        with urllib.request.urlopen(self.base+'?action=snapshot&at=2026-10-05T00:00:00Z') as response:
            self.assertNotEqual(etag,response.headers.get('ETag'))
        req=urllib.request.Request(self.base+'?action=nope',headers={'If-None-Match':etag})
        try: response=urllib.request.urlopen(req)
        except urllib.error.HTTPError as e: response=e
        with response: self.assertEqual(response.status,400); self.assertEqual(response.headers.get('Cache-Control'),'no-store')

    def test_private_path_fail_closed(self):
        link=ROOT/'public_html/exposed-fixture'
        link.symlink_to(ROOT/'private',target_is_directory=True)
        try:
            env=self.env.copy(); env['MARKET_DATA_PRIVATE_DIR']=str(link)
            result=subprocess.run(self.php+['-r',"$_GET=['action'=>'manifest']; include 'public_html/market-data/v1/index.php';"],cwd=ROOT,env=env,capture_output=True,text=True,check=True)
            data=json.loads(result.stdout)
            self.assertIn('error',data,'Public private path must be refused')
            self.assertEqual(data['error']['code'],'service_unavailable')
            self.assertNotIn(str(ROOT),result.stdout)
        finally: link.unlink()

    def test_readonly_requests_and_connection(self):
        import hashlib,re
        dbpath=ROOT/'private/market-v1.sqlite'; before=hashlib.sha256(dbpath.read_bytes()).hexdigest()
        for query in ['action=assets','action=snapshot&at=2026-10-05T00:00:00Z','action=series&asset_id=CRYPTO:BTC&start=2026-10-05T00:00:00Z&end=2026-10-05T00:01:00Z','action=replay&playback_time=2026-10-13T00:00:00Z']:
            code,_=self.request(query); self.assertEqual(code,200)
        self.assertEqual(before,hashlib.sha256(dbpath.read_bytes()).hexdigest())
        api=(ROOT/'public_html/market-data/v1/index.php').read_text()
        self.assertIn('?mode=ro',api); self.assertIn('PRAGMA query_only=ON',api)
        code="$db=new PDO('sqlite:file:' . getenv('MARKET_DATA_PRIVATE_DIR') . '/market-v1.sqlite?mode=ro'); try {$db->exec('DELETE FROM prices'); echo 'WRITABLE';} catch (Throwable $e) {echo 'READ_ONLY';}"
        result=subprocess.run(self.php+['-r',code],env=self.env,capture_output=True,text=True,check=True)
        self.assertEqual(result.stdout,'READ_ONLY')
        self.assertEqual(before,hashlib.sha256(dbpath.read_bytes()).hexdigest())

    def test_manifest(self):
        self.assertTrue((ROOT/'public_html/market-data/v1/index.php').exists(),'API missing')
        code,data=self.request('action=manifest')
        self.assertEqual(code,200)
        self.assertEqual(data['row_count'],534240)
        self.assertTrue(data['simulation'])
        self.assertEqual(data,json.loads((ROOT/'private/manifest.json').read_text()))

if __name__=='__main__': unittest.main()
