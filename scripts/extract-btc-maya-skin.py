#!/usr/bin/env python3
"""Extract original Maya 2017 horse skin weights and bone names.

No Maya installation or VRay plugin is required. This is data QA, NOT a rig
retargeter: the native scene and a 50-bone Quaternius GLB do NOT share skeletons.
To use in a browser, export a proper glTF skin with inverse bind matrices and
retarget real animation only after evaluating 16 pose-accurate phases.
"""
import argparse
import collections
import json
import pathlib
import re
import struct
import zlib
import hashlib

SINGLE = re.compile(r'setAttr\s+"\.wl\[(\d+)\]\.w\[(\d+)\]"\s+([^;]+);')
RANGE_START = re.compile(r'setAttr(?:\s+-s\s+\d+)?\s+"\.wl\[(\d+)\]\.w\[(\d+):(\d+)\]"\s*(.*)')
CONNECT = re.compile(r'^connectAttr\s+"([^\"]+)"\s+"HorseRig1:skinCluster1\.ma\[(\d+)\]"')
NUMS = re.compile(r'(?<![A-Za-z_])[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?')

def parse(path):
    weights = collections.defaultdict(dict)
    names = {}
    active = False
    pending = None
    with pathlib.Path(path).open(encoding='latin1') as src:
        for line in src:
            if line.startswith('createNode '):
                if 'createNode skinCluster -n "HorseRig1:skinCluster1"' in line:
                    active = True
                elif active: active = False
                continue
            if '"HorseRig1:skinCluster1.ma[' in line:
                m = CONNECT.search(line)
                if m: names[int(m.group(2))] = m.group(1).rsplit('.', 1)[0]
            if not active: continue
            if pending:
                v, first, last, vals = pending
                vals.extend(float(x) for x in NUMS.findall(line.split(';')[0]))
                if len(vals)>=last-first+1:
                    for k,val in enumerate(vals[:last-first+1]):
                        weights[v][first+k]=val
                    pending=None
                continue
            if '.wl' not in line: continue
            m=SINGLE.search(line)
            if m: weights[int(m.group(1))][int(m.group(2))]=float(m.group(3)); continue
            m=RANGE_START.search(line)
            if m:
                v,first,last=map(int,m.group(1,2,3))
                vals=[float(x) for x in NUMS.findall(m.group(4).split(';')[0])]
                if len(vals)>=last-first+1:
                    for k,val in enumerate(vals[:last-first+1]):
                        weights[v][first+k]=val
                else: pending=(v,first,last,vals)
    if pending: raise ValueError('Maya ranged weights end before their values')
    return weights,names

def run(path):
    weights,names=parse(path)
    if len(weights)!=5406 or len(names)!=70:
        raise ValueError(f'Expected 5406 native skin vertices and 70 influences, got {len(weights)}/{len(names)}')
    max_error=max(abs(1-sum(row.values())) for row in weights.values())
    if max_error>0.0001: raise ValueError(f'Non-normalized native skin rows: max error {max_error}')
    high_influences=sum(len(row)>4 for row in weights.values())
    return {
        'source':'Horse_VR_2017.ma, HorseRig1:skinCluster1',
        'vertices':len(weights),'influences':len(names),
        'originalMayaInfluences':[names[k] for k in sorted(names)],
        'verticesWithMoreThan4Weights':high_influences,
        'maxNormalizationError':max_error,
        'note':'Native skinCluster1 weights; do not remap by nearest neighbor into unrelated GLB bones.',
    }


def export_exact_sparse_skin(path, out_path):
    """Private offline intermediate. Keep ALL 70 joints and ALL weights.

    This is NOT yet a glTF and must not be bound to Quaternius's 50 joints.
    Binary (big/little specified): zlib(
      ASCII "BTCSKIN1",
      uint32le vertexCount, uint32le boneCount,
      (vertexCount+1) uint32le offsets in PAIRS,
      repeated (uint8 boneIndex, float32le originalMayaWeight)
    ).
    Every row retains all contributing joints, including tiny influences.
    """
    rows, names = parse(path)
    if len(rows)!=5406 or set(names)!=set(range(70)):
        raise ValueError('Cannot export incomplete 2017 Maya skinCluster1')
    offsets=[0]
    data=bytearray()
    totals=[]
    worst4=0.0
    over4=0
    for vertex in range(5406):
        row=rows[vertex]
        if not row: raise ValueError(f'Unweighted native source vertex {vertex}')
        normal=sum(row.values())
        totals.append(abs(normal-1))
        if abs(normal-1)>0.0001: raise ValueError(f'Original weights invalid at {vertex}: {normal}')
        top=sorted(row.items(),key=lambda item:item[1],reverse=True)
        if len(top)>4:over4+=1
        worst4=max(worst4,1-sum(w for _,w in top[:4]))
        for joint,weight in sorted(row.items()):
            if joint<0 or joint>=70 or weight<0 or weight>1:
                raise ValueError(f'Invalid native source influence {vertex}:{joint}={weight}')
            data+=struct.pack('<Bf',joint,weight)
        offsets.append(len(data)//5)
    uncompressed=b'BTCSKIN1'+struct.pack('<II',5406,70)
    uncompressed+=struct.pack('<5407I',*offsets)+data
    compressed=zlib.compress(uncompressed,9)
    pathlib.Path(out_path).write_bytes(compressed)
    return {
      'source':'Horse_VR_2017.ma/HorseRig1:skinCluster1',
      'format':'zlib:BTCSKIN1:sparse-f32le',
      'vertices':5406,'nativeBones':70,'influencePairs':offsets[-1],
      'verticesWithMoreThanFour':over4,
      'maxDiscardedInfluenceMassIfForcedToFour':worst4,
      'normalizationMaxError':max(totals),
      'bytesCompressed':len(compressed),
      'sha256':hashlib.sha256(compressed).hexdigest(),
      'warning':'Private derivative of original user supplied Maya. Do NOT publish to public repository without rights confirmation. No retarget or rig available yet.'
    }


if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('maya',help='Path to original Horse_VR_2017.ma; do not commit a proprietary .ma')
    ap.add_argument('--json',default='',help='Optional report file')
    ap.add_argument('--export-exact',default='',help='Write private compressed native sparse skin. Do not commit to public repo without rights confirmation')
    args=ap.parse_args()
    report=run(args.maya)
    data=json.dumps(report,indent=2)
    print(data)
    if args.json: pathlib.Path(args.json).write_text(data+'\n',encoding='utf8')
    if args.export_exact:
        print(json.dumps(export_exact_sparse_skin(args.maya,args.export_exact),indent=2))
