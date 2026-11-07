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

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('maya',help='Path to original Horse_VR_2017.ma; do not commit a proprietary .ma')
    ap.add_argument('--json',default='',help='Optional report file')
    args=ap.parse_args()
    report=run(args.maya)
    data=json.dumps(report,indent=2)
    print(data)
    if args.json: pathlib.Path(args.json).write_text(data+'\n',encoding='utf8')
