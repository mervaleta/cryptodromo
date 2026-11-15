#!/usr/bin/env python3
"""Inspect polygon meshes from the owner-supplied Maya ASCII file.
Foundation extractor only; does not recreate rig, skinning, textures or gallop.
Usage: python convert_maya_mesh.py Horse_VR_2017.ma ./assets
Dependencies: numpy trimesh
"""
import re, json, sys
from pathlib import Path
import numpy as np
import trimesh

S=Path(sys.argv[1]).read_text(errors='replace')
outdir=Path(sys.argv[2])
outdir.mkdir(parents=True,exist_ok=True)
names=['Horse_BaseShapeOrig','ManePolyShapeOrig','TailPolyShapeOrig',
       'eye_ext_LShapeOrig','HorseRig3:eye_ext_RShapeOrig',
       'eyes_internal_LShapeOrig','HorseRig3:eyes_internal_RShapeOrig',
       'Eyelashes1ShapeOrig']
colors={'Horse_BaseShapeOrig':[113,57,32,255],'ManePolyShapeOrig':[28,22,20,255],
        'TailPolyShapeOrig':[27,22,20,255],'eye_ext_LShapeOrig':[41,27,22,255],
        'HorseRig3:eye_ext_RShapeOrig':[41,27,22,255],
        'eyes_internal_LShapeOrig':[13,10,11,255],
        'HorseRig3:eyes_internal_RShapeOrig':[13,10,11,255],
        'Eyelashes1ShapeOrig':[29,20,18,255]}
scene=trimesh.Scene()
reports=[]
for name in names:
    st=re.search(r'^createNode mesh -n "'+re.escape(name)+r'"[^\n]*',S,re.M)
    if not st:
        print('MISSING',name); continue
    end=S.find('\ncreateNode ',st.end())
    block=S[st.start():end if end!=-1 else None]
    arrays={}
    for key in ('vt','ed'):
        data=[]
        pattern=r'setAttr\s+(?:-s\s+\d+\s+)?"\.'+key+r'\[(\d+):(\d+)\]"\s+([^;]*);'
        for m in re.finditer(pattern,block,re.S):
            first,last=int(m.group(1)),int(m.group(2))
            nums=np.fromstring(m.group(3),sep=' ')
            if len(nums)!=(last-first+1)*3:
                raise ValueError(f'{name}:{key}[{first}:{last}] count mismatch')
            data.append((first,last,nums.reshape(-1,3)))
        if data:
            arr=np.zeros((max(x[1] for x in data)+1,3))
            for a,b,v in data:arr[a:b+1]=v
            arrays[key]=arr
    if 'vt' not in arrays or 'ed' not in arrays:
        raise ValueError(f'No authored geometry: {name}')
    vertices=arrays['vt']
    edges=arrays['ed'].astype(int)
    faces=[]
    continuity_errors=0
    fp=r'setAttr(?:\s+-s\s+\d+)?(?:\s+-ch\s+\d+)?\s+"\.fc\[\d+:\d+\]"(?:\s+-type\s+"polyFaces")?\s+([^;]*);'
    for chunk in re.finditer(fp,block,re.S):
        tokens=re.findall(r'(?<!\w)-?\d+|[a-zA-Z]+',chunk.group(1))
        i=0
        while i<len(tokens):
            tag=tokens[i];i+=1
            if tag in ('f','h','mf'):
                n=int(tokens[i]);i+=1
                edgeids=list(map(int,tokens[i:i+n]));i+=n
                if tag!='f':continue
                pairs=[]
                for eid in edgeids:
                    idx=eid if eid>=0 else -eid-1
                    a,b=map(int,edges[idx,:2])
                    pairs.append((a,b) if eid>=0 else (b,a))
                if not all(pairs[j][1]==pairs[(j+1)%len(pairs)][0] for j in range(len(pairs))):
                    continuity_errors+=1
                ring=[pair[0] for pair in pairs]
                for j in range(1,len(ring)-1):
                    triangle=[ring[0],ring[j],ring[j+1]]
                    if len(set(triangle))==3:faces.append(triangle)
            elif tag=='mu':
                uvset=int(tokens[i]);count=int(tokens[i+1]);i+=2+count
            elif tag in ('mc','fc','mh'):
                count=int(tokens[i]);i+=1+count
    if not faces:
        raise ValueError(f'No polygon faces for {name}')
    mesh=trimesh.Trimesh(vertices=vertices,faces=np.asarray(faces),process=False)
    report=dict(name=name,vertices=len(mesh.vertices),triangles=len(mesh.faces),
                continuity_errors=continuity_errors,watertight=bool(mesh.is_watertight))
    print(json.dumps(report))
    reports.append(report)
    mesh.vertices=mesh.vertices/100.0
    mesh.visual.vertex_colors=colors[name]
    scene.add_geometry(mesh,geom_name=name,node_name=name)
    if name=='Horse_BaseShapeOrig':
        (outdir/'btc-maya-authored-base.glb').write_bytes(
            trimesh.exchange.gltf.export_glb(trimesh.Scene(mesh),include_normals=True))
(outdir/'btc-maya-source-assembly.glb').write_bytes(
    trimesh.exchange.gltf.export_glb(scene,include_normals=True))
(outdir/'extracted-meshes-summary.json').write_text(json.dumps(reports,indent=2))
