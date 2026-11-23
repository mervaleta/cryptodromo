#!/usr/bin/env python
"""Export the ORIGINAL Maya skinCluster1 weights, bind matrices and mesh IDs.

Run with Autodesk Maya's mayapy (not regular Python):
  mayapy tools/export_btc_maya_skin.py --scene /path/Horse_VR_2017.ma \
    --out /tmp/btc-native-skin.json

This is an offline SOURCE EXPORT, not a GLB or a Gallop bake. The resulting
JSON must be reviewed against the original 5,406-vertex mesh and joint rig.
It does not change the running BTC model or the other 99 racers.
"""
from __future__ import print_function
import argparse
import json
import os
import sys

def args():
    p = argparse.ArgumentParser()
    p.add_argument("--scene", required=True, help="Original Horse_VR_2017.ma")
    p.add_argument("--out", required=True, help="Destination JSON")
    p.add_argument("--skin", default="HorseRig1:skinCluster1")
    return p.parse_args()

def flatten_matrix(raw):
    if isinstance(raw, (tuple, list)) and len(raw) == 1:
        raw = raw[0]
    if isinstance(raw, (tuple, list)) and len(raw) == 16:
        return [float(x) for x in raw]
    raise RuntimeError("Expected Maya 4x4 bindPreMatrix; got %r" % (raw,))

def run():
    a = args()
    if not os.path.isfile(a.scene):
        raise RuntimeError("Maya source missing: %s" % a.scene)
    import maya.standalone
    maya.standalone.initialize(name="python")
    import maya.cmds as cmds
    import maya.api.OpenMaya as om
    import maya.api.OpenMayaAnim as oma
    try:
        cmds.file(a.scene, open=True, force=True, prompt=False,
                  ignoreVersion=True, loadReferenceDepth="all")
        skins = cmds.ls(type="skinCluster", long=True) or []
        matches = [s for s in skins if s == a.skin or s.split("|")[-1] == a.skin]
        if len(matches) != 1:
            raise RuntimeError("Skin %r ambiguous/missing; available: %r" %
                               (a.skin, skins))
        skin_name = matches[0]
        sel = om.MSelectionList()
        sel.add(skin_name)
        skin_fn = oma.MFnSkinCluster(sel.getDependNode(0))
        geometries = skin_fn.getOutputGeometry()
        if len(geometries) != 1:
            raise RuntimeError("Expected one output geometry, found %d" %
                               len(geometries))
        dag = geometries[0]
        if dag.apiType() != om.MFn.kMesh:
            dag.extendToShape()
        mesh = om.MFnMesh(dag)
        count = mesh.numVertices
        points = mesh.getPoints(om.MSpace.kObject)
        tri_counts, triangles = mesh.getTriangles()
        influences = skin_fn.influenceObjects()
        if not influences:
            raise RuntimeError("Native skin has no joint influences")
        component_fn = om.MFnSingleIndexedComponent()
        comp = component_fn.create(om.MFn.kMeshVertComponent)
        component_fn.addElements(list(range(count)))
        raw_weights, n_influences = skin_fn.getWeights(dag, comp)
        if n_influences != len(influences):
            raise RuntimeError("Skin influence count mismatch")
        if len(raw_weights) != count * n_influences:
            raise RuntimeError("Skin weight array size mismatch")
        joints = []
        for i, joint in enumerate(influences):
            name = joint.fullPathName()
            logical = int(skin_fn.indexForInfluenceObject(joint))
            bind_pre = flatten_matrix(
                cmds.getAttr("%s.bindPreMatrix[%d]" % (skin_name, logical)))
            parent = cmds.listRelatives(name, parent=True, fullPath=True) or []
            joints.append({
                "slot": i, "logicalIndex": logical, "path": name,
                "parent": parent[0] if parent else None,
                "bindPreMatrix": bind_pre,
                "jointOrient": list(cmds.getAttr(name + ".jointOrient")[0])
                if cmds.nodeType(name) == "joint" else None
            })
        sparse = []
        max_error = 0.0
        for v in range(count):
            row = [[i, float(raw_weights[v*n_influences+i])]
                   for i in range(n_influences)
                   if raw_weights[v*n_influences+i] > 1e-9]
            total = sum(w for _, w in row)
            max_error = max(max_error, abs(total-1.0))
            if total <= 0:
                raise RuntimeError("Unweighted Maya vertex %d" % v)
            sparse.append(row)
        # IDs and triangle order refer to the ORIGINAL Maya mesh, not the
        # Quaternius GLB. Keep these intact for an audited vertex remap.
        transform = om.MFnDagNode(dag).parent(0)
        output = {
            "format": "btc-maya-native-skin-v1",
            "source": os.path.basename(a.scene),
            "skinCluster": skin_name,
            "meshPath": dag.fullPathName(),
            "vertexCount": count,
            "influenceCount": n_influences,
            "triangleCount": len(triangles)//3,
            "pointsObjectSpace": [[float(p.x),float(p.y),float(p.z)]
                                  for p in points],
            "meshInclusiveMatrix": [float(x) for x in dag.inclusiveMatrix()],
            "triangleVertexIds": [int(i) for i in triangles],
            "influences": joints,
            "weightsByVertex": sparse,
            "maxWeightSumError": max_error,
            "warnings": [
                "This file is NOT a rendered horse or an animation.",
                "Verify mesh vertex ordering against btc-maya-body-data.js.",
                "Do not map this skin to a 50-bone Quaternius skeleton.",
                "Bind matrices and native hierarchy require rig validation."
            ]
        }
        if count != 5406 or n_influences != 70:
            raise RuntimeError(
                "Unexpected source anatomy %d vertices / %d influences; "
                "refusing to export an unverified mapping" %
                (count, n_influences))
        directory = os.path.dirname(os.path.abspath(a.out))
        if not os.path.isdir(directory):
            os.makedirs(directory)
        temp = a.out + ".tmp"
        with open(temp, "w") as f:
            json.dump(output, f, separators=(",", ":"))
        os.rename(temp, a.out)
        print("BTC_NATIVE_MAYA_SKIN_EXPORTED", a.out,
              count, n_influences, len(triangles)//3,
              "maxWeightSumError", max_error)
    finally:
        maya.standalone.uninitialize()

if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        sys.stderr.write("BTC_NATIVE_MAYA_EXPORT_FAILED: %s\n" % exc)
        sys.exit(1)
