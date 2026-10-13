#!/usr/bin/env python3
"""Display-only Cryptodromo collector. Raw HTTP content never reaches disk."""
import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import shutil
import sqlite3
import tempfile
from datetime import datetime, timezone
import urllib.request
import xml.etree.ElementTree as ET
from editorial import authored, illustrations, CATEGORIES, FICTION, AD
from collections import Counter

SOURCE_URL = 'https://cryptodromo.com/live'
SITE_URL = os.environ.get('GAZETTE_SITE_URL','https://mediumvioletred-shrew-934553.hostingersite.com').rstrip('/')

class NextData(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.parts = []
    def handle_starttag(self, tag, attrs):
        self.active = tag == 'script' and dict(attrs).get('id') == '__NEXT_DATA__'
    def handle_endtag(self, tag):
        if tag == 'script':
            self.active = False
    def handle_data(self, data):
        if self.active:
            self.parts.append(data)

def timestamp(value):
    try:
        d = datetime.fromisoformat(value.replace('Z', '+00:00'))
        return d.astimezone(timezone.utc) if d.tzinfo else None
    except (ValueError, TypeError, AttributeError):
        return None

def text(value, default='', limit=160):
    return value[:limit] if isinstance(value, str) else default

def parse_source(content, now):
    parser = NextData()
    parser.feed(content)
    obj = json.loads(''.join(parser.parts))
    props = obj.get('props', {}).get('pageProps', {})
    upcoming = props.get('nextRace', [])
    if not isinstance(upcoming, list):
        raise ValueError('Unsupported race list')
    candidates = [props.get('currentRace')] + upcoming
    result = {}
    for raw in candidates:
        if not isinstance(raw, dict):
            continue
        rid = raw.get('id')
        if not isinstance(rid, (str, int)) or isinstance(rid, bool):
            continue
        start, end = timestamp(raw.get('start')), timestamp(raw.get('end'))
        if not start or not end or end <= start:
            continue
        runners = []
        for runner in raw.get('participants', []) if isinstance(raw.get('participants'), list) else []:
            if not isinstance(runner, dict):
                continue
            coin = runner.get('coin', {})
            if isinstance(coin, dict):
                name, label = text(coin.get('name')), text(coin.get('symbol'), limit=24)
                if name or label:
                    runners.append({'name': name, 'label': label})
        status = 'upcoming' if now < start else 'live' if now < end else 'unconfirmed'
        result[str(rid)] = dict(id=str(rid), name=text(raw.get('name'), 'Carrera virtual'), start=start.isoformat(), end=end.isoformat(), status=status, participants=runners, standings=[])
    if not result:
        raise ValueError('No observable race metadata')
    return list(result.values())

def identity(*parts):
    return hashlib.sha256('|'.join(str(p) for p in parts).encode()).hexdigest()[:24]

def edit(races, observed, published, mode):
    stories = []
    for r in races:
        # A status is an observation window, never a result attestation.
        status = r['status']
        if status == 'unconfirmed':
            continue
        kind = 'preview' if status == 'upcoming' else 'observation'
        names = ', '.join((p['name'] + ' (' + p['label'] + ')') for p in r['participants'])
        title = ('En el partidor: ' if kind == 'preview' else 'La pista virtual: ') + r['name']
        body = ('La nómina observable reúne a ' + names + '. ' if names else 'La fuente no identifica participantes en esta observación. ') + 'Horario anunciado: ' + r['start'] + ' a ' + r['end'] + '. El parte no acredita posiciones finales ni permite pronosticar el desenlace.'
        stories.append(dict(id=identity('race', r['id'], status, mode), title=title, body=body, kind=kind, category='Actualidad / Previas', source_url=SOURCE_URL, observed_at=observed.isoformat(), published_at=published.isoformat(), mode=mode))
    day = observed.date().isoformat()
    stories.append(dict(id=identity('roundup', day, mode), title='Parte de la jornada virtual · ' + day, body=f'Esta edición conserva {len(races)} carreras identificadas en una instantánea de la fuente; no representa una jornada completa. No hay una fuente de resultados confirmados validada para esta edición. Las nóminas y horarios son evidencia observada, no resultados.', kind='roundup', category='Actualidad / Previas', source_url=SOURCE_URL, observed_at=observed.isoformat(), published_at=published.isoformat(), mode=mode))
    return stories

CSS = '''*{box-sizing:border-box}body{margin:0;background:#f5f0e2;color:#223d31;font:17px/1.6 Georgia,serif}a{color:#215d43;text-underline-offset:3px}header,main,footer{max-width:1180px;margin:auto;padding:24px}header{text-align:center;border-bottom:double 5px #a08445}h1{font-size:clamp(2.2rem,6vw,4.8rem);line-height:1.05;margin:14px 0}h2{line-height:1.2}nav{display:flex;flex-wrap:wrap;justify-content:center;gap:20px}.kicker,.badge,time{font:13px/1.6 system-ui,sans-serif}.badge{background:#e7dab3;padding:5px 9px;display:inline-block}.notice{padding:14px;border:1px solid #b5944d;background:#fff8e5}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:24px}.card{border-top:3px solid #a08445;padding:18px 4px}.card h3{line-height:1.25}article.full{max-width:800px;margin:auto}.ticker{padding:12px 0;border-bottom:1px solid #b5944d;font:14px system-ui,sans-serif}.muted{color:#566b5b}.skip{position:absolute;left:-9999px}.skip:focus{left:10px;background:white;padding:10px}img{max-width:100%;height:auto}section{margin:32px 0}footer{border-top:double 4px #a08445}p{overflow-wrap:anywhere}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}'''

def database(state):
    state.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    db = sqlite3.connect(str(state))
    os.chmod(state, 0o600)
    db.row_factory = sqlite3.Row
    db.executescript('CREATE TABLE IF NOT EXISTS snapshots(observed_at TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);')
    return db

def setmeta(db, key, value):
    db.execute('INSERT INTO meta VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', (key, value))

def getmeta(db, key, default=''):
    row = db.execute('SELECT value FROM meta WHERE key=?', (key,)).fetchone()
    return row[0] if row else default

def count_posts(state):
    with sqlite3.connect(state) as db:
        return db.execute('SELECT COUNT(*) FROM posts').fetchone()[0]

def fetch_source():
    request = urllib.request.Request(SOURCE_URL, headers={'User-Agent':'CryptodromoGazette/1.0 (+automated display-only newspaper)'})
    with urllib.request.urlopen(request, timeout=35) as response:
        if response.geturl() != SOURCE_URL:
            raise ValueError('Unexpected source redirect')
        raw = response.read(8_000_001)
        if len(raw) > 8_000_000:
            raise ValueError('Source exceeds limit')
        return raw.decode('utf-8')

def page_shell(title, body, prefix='', notice=''):
    e = html.escape
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Cobertura automática de turf virtual y humor explícitamente ficticio"><title>' + e(title) + ' · La Gaceta del Cryptódromo</title><link rel="stylesheet" href="' + prefix + 'assets/style.css"><link rel="alternate" type="application/rss+xml" title="RSS" href="' + prefix + 'rss.xml"></head><body><a class="skip" href="#contenido">Saltar al contenido</a><header><p class="kicker">EL PARTIDOR DIGITAL · EDICIÓN AUTOMÁTICA</p><h1>La Gaceta del Cryptódromo</h1><p>Cobertura automática de turf virtual • Fuente Cryptodromo</p><nav aria-label="Principal"><a href="' + prefix + 'index.html">Portada</a><a href="' + prefix + 'archive/index.html">Hemeroteca</a><a href="' + prefix + 'index.html#humor">Ficción y humor</a><a href="' + prefix + 'rss.xml">RSS</a><a href="https://cryptodromo.com/live" rel="noopener">Ir a la fuente</a></nav></header><main id="contenido">' + ('<p class="notice" role="status">' + e(notice) + '</p>' if notice else '') + body + '</main><footer><p>Redacción automática con plantillas originales; sin entrevistas reales, consejos de inversión ni apuestas inventadas. Las ilustraciones son decorativas.</p><p>Publicación diferenciada de Cryptodromo: no representa su comunicación oficial. No se publican datos internos.</p></footer></body></html>'

def story_badge(s):
    e = html.escape
    if s['mode'] == 'replay':
        return '<p class="badge">Replay / simulación — datos de ' + e(s['observed_at'][:10]) + ', emitidos ' + e(s['published_at'][:10]) + '</p>'
    return '<p class="badge">Instantánea observada — no es un directo</p>'

def story_meta(s):
    if s['mode'] == 'editorial':
        label = (FICTION + ' · ' + AD) if s['kind'] == 'ad' else FICTION if s['kind'] == 'fiction' else 'Editorial educativo — no es una crónica de resultados'
        return '<p class="badge">' + label + '</p><p class="kicker">Texto original de la redacción automática · Publicado: ' + html.escape(s['published_at']) + '</p>'
    return story_badge(s) + '<p class="muted kicker">Fuente: <a href="' + html.escape(s['source_url'], quote=True) + '">Cryptodromo</a> · Observado: <time>' + html.escape(s['observed_at']) + '</time> · Publicado: <time>' + html.escape(s['published_at']) + '</time></p>'

def render(db, out, notice):
    posts = [json.loads(row[0]) for row in db.execute('SELECT payload FROM posts ORDER BY id')]
    posts.sort(key=lambda s: (s['published_at'], s['id']), reverse=True)
    files, manifest = illustrations()
    files['assets/style.css'] = CSS
    files['assets/manifest.json'] = json.dumps(manifest,ensure_ascii=False,indent=2)
    cards = {category:[] for category in CATEGORIES}
    def picture(s, prefix=''):
        i = CATEGORIES.index(s['category']) % len(manifest)
        asset = manifest[i]
        return '<figure><img loading="lazy" width="800" height="420" src="' + prefix + asset['path'] + '" alt="' + asset['title'] + '"><figcaption class="kicker">Ilustración original · no representa personas ni carreras reales · <a href="' + asset['license_url'] + '">CC0</a></figcaption></figure>'
    for s in posts:
        url = 'articles/' + s['id'] + '.html'
        cards[s['category']].append('<article class="card">' + picture(s) + '<p class="kicker">' + html.escape(s['category']) + '</p><h3><a href="' + url + '">' + html.escape(s['title']) + '</a></h3>' + story_meta(s) + '<p>' + html.escape(s['body'][:220]) + '…</p></article>')
        files[url] = page_shell(s['title'], '<article class="full"><h2>' + html.escape(s['title']) + '</h2>' + story_meta(s) + picture(s,'../') + ''.join('<p>'+html.escape(p)+'</p>' for p in s['body'].split('\n\n')) + '<p><a href="../index.html">Volver a portada</a></p></article>', '../', notice)
    sections = ''.join('<section id="' + ('humor' if category=='Stud del Humor' else 'category-'+str(i)) + '"><h2>' + html.escape(category) + '</h2>' + ('<p class="notice">Zona de ficción: no es información de carreras ni publicidad real.</p>' if category in CATEGORIES[3:] else '') + '<div class="grid">' + ''.join(cards[category][:4]) + '</div></section>' for i,category in enumerate(CATEGORIES))
    factual = [s for s in posts if s['kind'] in ('preview','observation')]
    headlines = '<div class="ticker"><strong>Últimos titulares observados</strong><ul>' + ''.join('<li><a href="articles/'+s['id']+'.html">'+html.escape(s['title'])+'</a></li>' for s in factual[:3]) + '</ul></div>'
    upcoming = '<section><h2>Próximas en la instantánea</h2><p>Programación anunciada al observar la fuente, no un calendario actualizado en tiempo real.</p><ul>' + ''.join('<li><a href="articles/'+s['id']+'.html">'+html.escape(s['title'])+'</a> · observado '+html.escape(s['observed_at'])+'</li>' for s in [p for p in factual if p['kind']=='preview'][:8]) + '</ul></section>'
    files['index.html'] = page_shell('Portada', '<div class="ticker"><strong>Último parte conservado</strong> · <a href="https://cryptodromo.com/live">Consultar las carreras en Cryptodromo</a> · Esta edición no certifica resultados.</div>' + headlines + upcoming + '<p>Previas anunciadas en la captura: consultar fechas de origen antes de interpretar el horario. <a href="archive/index.html">Todos los partes y notas en la hemeroteca</a>.</p>' + sections, notice=notice)
    # Modest pagination, no unbounded archive page.
    for start in range(0, max(len(posts),1), 24):
        page = start // 24 + 1
        path = 'archive/index.html' if page == 1 else f'archive/page-{page}.html'
        links = ' '.join('<a href="' + ('index.html' if i == 1 else f'page-{i}.html') + '">' + str(i) + '</a>' for i in range(1, (len(posts)+23)//24+1))
        entries = ''.join('<li><a href="../articles/' + s['id'] + '.html">' + html.escape(s['title']) + '</a> · ' + html.escape(s['published_at'][:10]) + '</li>' for s in posts[start:start+24])
        files[path] = page_shell('Hemeroteca', '<h2>Hemeroteca</h2><ul>' + entries + '</ul><nav aria-label="Páginas">' + links + '</nav>', '../', notice)
    root = ET.Element('rss', version='2.0')
    channel = ET.SubElement(root, 'channel')
    for tag, value in [('title','La Gaceta del Cryptódromo'),('link',SITE_URL+'/index.html'),('description','Cobertura automática de turf virtual • Fuente Cryptodromo')]:
        ET.SubElement(channel, tag).text = value
    for s in posts[:40]:
        item = ET.SubElement(channel, 'item')
        from email.utils import format_datetime
        label = (FICTION + ' · ' + AD) if s['kind']=='ad' else FICTION if s['kind']=='fiction' else 'Editorial educativo' if s['mode']=='editorial' else 'Replay / simulación' if s['mode']=='replay' else 'Instantánea observada — no es un directo'
        for tag,value in [('title',s['title']),('link',SITE_URL+'/articles/'+s['id']+'.html'),('description',label + ' | '+s['body'] + ' | Fuente: '+(s['source_url'] or 'Texto original de la redacción automática')+' | Observado: '+s['observed_at']+' | Publicado: '+s['published_at']),('guid',s['id']),('pubDate',format_datetime(timestamp(s['published_at']),usegmt=True))]:
            element = ET.SubElement(item, tag)
            element.text = value
            if tag == 'guid': element.set('isPermaLink','false')
    files['rss.xml'] = ET.tostring(root, encoding='unicode', xml_declaration=True)
    out.mkdir(parents=True, exist_ok=True)
    # Publish immutable article dependencies first; index is the final pointer.
    changed = 0
    for relative in sorted(files, key=lambda p: p == 'index.html'):
        dest = out / relative
        content = files[relative].encode('utf-8')
        if dest.exists() and dest.read_bytes() == content:
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix='.gaceta-', dir=dest.parent)
        try:
            with os.fdopen(fd, 'wb') as f:
                f.write(content); f.flush(); os.fsync(f.fileno())
            os.chmod(temporary, 0o644)
            os.replace(temporary, dest)
        finally:
            if os.path.exists(temporary): os.unlink(temporary)
        changed += 1
    return changed

def run(state, output, now, capture=False, fetch=None, mode='snapshot', replay_days=1, rollover_hour=0):
    state, out = Path(state).resolve(), Path(output).resolve()
    if state == out or out in state.parents or state in out.parents:
        raise ValueError('SQLite state must be outside web root')
    db = database(state)
    try:
        if capture and getmeta(db,'attempt_day') != now.date().isoformat() and now.hour >= rollover_hour:
            setmeta(db,'attempt_day',now.date().isoformat())
            db.commit() # At most one network attempt per UTC day, even on failure.
            try:
                races = parse_source((fetch or fetch_source)(), now)
                db.execute('INSERT OR IGNORE INTO snapshots VALUES(?,?)', (now.isoformat(), json.dumps(races, ensure_ascii=False)))
                setmeta(db,'last_success',now.isoformat())
                setmeta(db,'fetch_failed','')
            except Exception:
                # Never log raw exceptions/body; they can expose upstream contents.
                setmeta(db,'fetch_failed','Fuente no disponible: se conserva la última edición verificada.')
            db.commit()
        rows = db.execute('SELECT observed_at,payload FROM snapshots ORDER BY observed_at').fetchall()
        for row in rows:
            observed = timestamp(row[0])
            published = now
            if mode == 'replay':
                from datetime import timedelta
                eligible = observed + timedelta(days=replay_days)
                if now < eligible:
                    continue
            races = json.loads(row[1])
            for s in edit(races,observed,published,mode):
                db.execute('INSERT OR IGNORE INTO posts VALUES(?,?)', (s['id'],json.dumps(s,ensure_ascii=False)))
        for s in authored(now,identity):
            db.execute('INSERT OR IGNORE INTO posts VALUES(?,?)',(s['id'],json.dumps(s,ensure_ascii=False)))
        db.commit()
        counts = Counter(json.loads(row[0])['category'] for row in db.execute('SELECT payload FROM posts'))
        report = json.dumps(dict(counts),ensure_ascii=False,indent=2)
        count_path = state.parent/'category-counts.json'
        if not count_path.exists() or count_path.read_text() != report:
            count_path.write_text(report)
        notice = getmeta(db,'fetch_failed') or ('Última captura: ' + getmeta(db,'last_success') + '. Cobertura limitada a instantáneas; sin resultados confirmados.')
        if not rows: notice = 'Aún no hay una captura válida. No se inventan carreras ni resultados.'
        changed = render(db,out,notice)
        return {'posts':db.execute('SELECT COUNT(*) FROM posts').fetchone()[0], 'snapshots':len(rows), 'files_changed':changed, 'fetch_failed':bool(getmeta(db,'fetch_failed'))}
    finally:
        db.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state',type=Path,default=Path('private/state.sqlite'))
    parser.add_argument('--output',type=Path,default=Path('public'))
    parser.add_argument('--capture',action='store_true',help='One network attempt per UTC day; omit for local publication')
    parser.add_argument('--mode',choices=['snapshot','replay'],default='snapshot')
    parser.add_argument('--replay-days',type=int,default=1)
    parser.add_argument('--rollover-hour',type=int,choices=range(24),default=0)
    args = parser.parse_args()
    if args.replay_days < 1: parser.error('--replay-days must be positive')
    print(json.dumps(run(args.state,args.output,datetime.now(timezone.utc),args.capture,mode=args.mode,replay_days=args.replay_days,rollover_hour=args.rollover_hour),ensure_ascii=False))
