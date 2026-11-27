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
        values = [float(x) for x in raw]
        if not all(__import__("math").isfinite(x) for x in values):
            raise RuntimeError("Maya matrix contains nonfinite values")
        return values
    raise RuntimeError("Expected Maya 4x4 bindPreMatrix; got %r" % (raw,))

def canonical_matrix_source(cmds, plug):
    suffix = ".worldMatrix[0]"
    if not isinstance(plug, str) or not plug.endswith(suffix):
        raise RuntimeError("Unexpected skin matrix source: %r" % (plug,))
    node = plug[:-len(suffix)]
    matches = cmds.ls(node, long=True) or []
    if len(matches) != 1:
        raise RuntimeError("Ambiguous or missing Maya matrix source: %r -> %r" % (plug, matches))
    return matches[0] + suffix

def optional_attr(cmds, plug):
    if not cmds.objExists(plug):
        return None
    value = cmds.getAttr(plug)
    if isinstance(value, (tuple, list)) and len(value) == 1:
        value = value[0]
    if isinstance(value, (tuple, list)):
        return [float(x) for x in value]
    return value

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
        # MFnSkinCluster.getOutputGeometry() returns MObjects, NOT
        # MDagPaths. getWeights() requires a mesh MDagPath and the
        # inclusive transform must come from that same path.
        geometries = skin_fn.getOutputGeometry()
        if len(geometries) != 1:
            raise RuntimeError("Expected one output geometry, found %d" %
                               len(geometries))
        output_object = geometries[0]
        shape_names = cmds.skinCluster(skin_name, query=True, geometry=True) or []
        if len(shape_names) != 1:
            raise RuntimeError("Expected one skinCluster mesh path, found %r" %
                               (shape_names,))
        shape_selection = om.MSelectionList()
        shape_selection.add(shape_names[0])
        dag = shape_selection.getDagPath(0)
        if dag.node().hasFn(om.MFn.kTransform):
            dag.extendToShape()
        if not dag.node().hasFn(om.MFn.kMesh):
            raise RuntimeError("skinCluster output is not a polygon mesh")
        if dag.node() != output_object:
            raise RuntimeError("skinCluster output object differs from resolved mesh path")
        mesh = om.MFnMesh(dag)
        count = mesh.numVertices
        points = mesh.getPoints(om.MSpace.kObject)
        tri_counts, triangles = mesh.getTriangles()
        influences = skin_fn.influenceObjects()
        if len(influences) != 70:
            raise RuntimeError("Expected 70 original skin influences, got %d" % len(influences))
        component_fn = om.MFnSingleIndexedComponent()
        comp = component_fn.create(om.MFn.kMeshVertComponent)
        component_fn.addElements(list(range(count)))
        raw_weights, n_influences = skin_fn.getWeights(dag, comp)
        if n_influences != len(influences):
            raise RuntimeError("Skin influence count mismatch")
        if len(raw_weights) != count * n_influences:
            raise RuntimeError("Skin weight array size mismatch")
        joints = []
        influence_names = []
        logical_indices = []
        bind_pre_by_logical = {}
        matrix_connections = {}
        for i, joint in enumerate(influences):
            name = joint.fullPathName()
            logical = int(skin_fn.indexForInfluenceObject(joint))
            bind_pre = flatten_matrix(
                cmds.getAttr("%s.bindPreMatrix[%d]" % (skin_name, logical)))
            sources = cmds.listConnections(
                "%s.matrix[%d]" % (skin_name, logical),
                source=True, destination=False, plugs=True) or []
            canonical_sources = [canonical_matrix_source(cmds, plug) for plug in sources]
            expected_source = name + ".worldMatrix[0]"
            if canonical_sources != [expected_source]:
                raise RuntimeError(
                    "Maya skin matrix[%d] must connect only to %s; got %r" %
                    (logical, expected_source, canonical_sources))
            parent = cmds.listRelatives(name, parent=True, fullPath=True) or []
            influence_names.append(name)
            logical_indices.append(logical)
            bind_pre_by_logical[str(logical)] = bind_pre
            matrix_connections[str(logical)] = canonical_sources
            joints.append({
                "slot": i, "logicalIndex": logical, "path": name,
                "parent": parent[0] if parent else None,
                "bindPreMatrix": bind_pre,
                "jointOrient": list(cmds.getAttr(name + ".jointOrient")[0])
                if cmds.nodeType(name) == "joint" else None
            })

        sparse = []
        max_error = 0.0
        max_influences_per_vertex = 0
        vertices_over_four = 0
        max_discarded_mass_if_four = 0.0
        for v in range(count):
            row = [[i, float(raw_weights[v*n_influences+i])]
                   for i in range(n_influences)
                   if raw_weights[v*n_influences+i] > 0.0]
            total = sum(w for _, w in row)
            max_error = max(max_error, abs(total-1.0))
            if total <= 0:
                raise RuntimeError("Unweighted Maya vertex %d" % v)
            if any(not __import__("math").isfinite(w) or w < 0.0 for _, w in row):
                raise RuntimeError("Invalid native Maya weight at vertex %d" % v)
            max_influences_per_vertex = max(max_influences_per_vertex, len(row))
            if len(row) > 4:
                vertices_over_four += 1
            retained_four = sum(w for _, w in sorted(row, key=lambda item: item[1], reverse=True)[:4])
            max_discarded_mass_if_four = max(max_discarded_mass_if_four, max(0.0, total-retained_four))
            sparse.append(row)

        blend_raw = skin_fn.getBlendWeights(dag, comp)
        blend_weights = [float(value) for value in blend_raw]
        if len(blend_weights) != count:
            raise RuntimeError("Maya blend-weight count mismatch: %d != %d" % (len(blend_weights), count))
        if any(not __import__("math").isfinite(value) or value < 0.0 or value > 1.0 for value in blend_weights):
            raise RuntimeError("Maya blend weights contain invalid values")

        geometry_matrix = [float(dag.inclusiveMatrix()[i]) for i in range(16)]
        skin_settings = {
            key: optional_attr(cmds, skin_name + "." + key)
            for key in (
                "skinningMethod", "normalizeWeights", "maintainMaxInfluences",
                "maxInfluences", "bindMethod", "envelope", "dqsSupportNonRigid",
                "useComponents"
            )
        }
        if skin_settings["skinningMethod"] is None or skin_settings["normalizeWeights"] is None:
            raise RuntimeError("Maya skinCluster is missing skinningMethod/normalizeWeights settings")
        # IDs and triangle order refer to the ORIGINAL Maya mesh, not the
        # Quaternius GLB. Keep these intact for an audited vertex remap.
        output = {
            "schema": "btc-maya-original-skin-v1",
            "format": "btc-maya-native-skin-v2",
            "sourceScene": cmds.file(query=True, sceneName=True) or os.path.abspath(a.scene),
            "source": os.path.basename(a.scene),
            "skinCluster": skin_name,
            "mesh": dag.fullPathName(),
            "meshPath": dag.fullPathName(),
            "vertexCount": count,
            "influenceCount": n_influences,
            "influences": influence_names,
            "influenceLogicalIndices": logical_indices,
            "influenceDetails": joints,
            "matrixConnectionsByLogicalIndex": matrix_connections,
            "bindPreMatrixByLogicalIndex": bind_pre_by_logical,
            "geometryMatrix": geometry_matrix,
            "meshInclusiveMatrix": geometry_matrix,
            "triangleCount": len(triangles)//3,
            "pointsObjectSpace": [[float(p.x),float(p.y),float(p.z)]
                                  for p in points],
            "triangleVertexIds": [int(i) for i in triangles],
            "weightsSparseByVertex": sparse,
            "weightsByVertex": sparse,
            "blendWeightsByVertex": blend_weights,
            "skinSettings": skin_settings,
            "maxWeightSumError": max_error,
            "maxInfluencesPerVertex": max_influences_per_vertex,
            "verticesWithMoreThanFourWeights": vertices_over_four,
            "maxDiscardedWeightMassIfForcedToFour": max_discarded_mass_if_four,
            "warnings": [
                "This file is NOT a rendered horse or an animation.",
                "All positive source weights are preserved; no four-influence truncation is performed.",
                "Verify mesh vertex ordering against btc-maya-body-data.js before browser binding.",
                "Do not map these weights to the unrelated Quaternius 50-joint skeleton.",
                "Use the paired native rig-motion export for the full hierarchy and sampled joint matrices.",
                "Blend weights and skinCluster settings are required to reproduce the original Maya skinning method."
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
