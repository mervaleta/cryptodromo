#!/usr/bin/env python3
"""Offline artifact audit plus a real temporary loopback HTTP smoke test."""
import functools
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sqlite3
import threading
from urllib.parse import urlsplit, unquote
from urllib.request import urlopen
from collections import Counter
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parent
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        for key in ('href','src'):
            if key in attrs: self.links.append(attrs[key])
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def audit():
    out=ROOT/'public'
    with sqlite3.connect(ROOT/'private/state.sqlite') as db:
        posts=[json.loads(x[0]) for x in db.execute('SELECT payload FROM posts')]
        snapshots=[json.loads(x[0]) for x in db.execute('SELECT payload FROM snapshots')]
    counts=dict(Counter(p['category'] for p in posts))
    assert len(counts)==5 and all(n>=4 for n in counts.values()),counts
    assert len(posts)==len({p['id'] for p in posts})
    assert len(posts)==len(list((out/'articles').glob('*.html')))
    for event in snapshots:
        for r in event:
            assert set(r)=={'id','name','start','end','status','participants','standings'}
            assert r['standings']==[]
            assert all(set(p)=={'name','label'} for p in r['participants'])
    files=list(out.rglob('*'))
    assert not any(p.suffix in ('.sqlite','.db','.py') for p in files)
    pages=list(out.rglob('*.html'))
    for page in pages:
        content=page.read_text()
        assert 'lang="es"' in content and 'name="viewport"' in content
        assert '<script' not in content.lower()
        parser=Links(); parser.feed(content)
        for link in parser.links:
            parts=urlsplit(link)
            if parts.scheme or parts.netloc or not parts.path: continue
            target=(page.parent/unquote(parts.path)).resolve()
            assert out.resolve() in target.parents or target==out.resolve()
            assert target.exists(),(page,link)
    ET.parse(out/'rss.xml')
    manifest=json.loads((out/'assets/manifest.json').read_text())
    assert len(manifest)==4
    for asset in manifest:
        assert asset['license']=='CC0-1.0' and asset['width']<=1200
        assert (out/asset['path']).stat().st_size<200000
    handler=functools.partial(QuietHandler,directory=str(out))
    server=ThreadingHTTPServer(('127.0.0.1',0),handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    http_count=0
    try:
        for file in files:
            if file.is_file():
                url='http://127.0.0.1:'+str(server.server_port)+'/'+file.relative_to(out).as_posix()
                with urlopen(url,timeout=5) as response:
                    assert response.status==200
                    assert response.read()==file.read_bytes()
                http_count+=1
    finally:
        server.shutdown();server.server_close();thread.join()
    report=dict(posts=len(posts),categories=counts,article_pages=len(posts),safe_snapshots=len(snapshots),safe_races=sum(map(len,snapshots)),confirmed_result_articles=sum(p['kind']=='result' for p in posts),html_pages=len(pages),http_files_verified=http_count,illustrations=len(manifest),svg_total_bytes=sum((out/a['path']).stat().st_size for a in manifest),safe_race_schema=sorted(snapshots[0][0]),safe_runner_schema=sorted(snapshots[0][0]['participants'][0]),source_observed_at=next(p['observed_at'] for p in posts if p['source_url']))
    (ROOT/'private/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__': audit()
