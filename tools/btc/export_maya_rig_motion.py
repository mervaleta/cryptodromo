#!/usr/bin/env python
"""Export the original Maya influence hierarchy and a baked transform clip.

Run with Autodesk Maya mayapy, not system Python:
  mayapy tools/btc/export_maya_rig_motion.py \
    --scene /path/Horse_VR_2017.ma --out /tmp/btc-maya-rig-motion.json \
    --start 1 --end 48 --fps 60 --clip-name gallop-candidate

This is a SOURCE EXTRACTOR only. It does not build a GLB, retarget to
Quaternius, modify the scene, or claim that the selected time range is Gallop.
Use tools/export_btc_maya_skin.py separately for the complete sparse skin rows.
Matrices remain in Maya's original coordinate basis and row-major convention.
"""
from __future__ import print_function
import argparse
import gzip
import json
import math
import os
import sys

TIME_UNIT_FPS = {
    "game": 15.0,
    "film": 24.0,
    "pal": 25.0,
    "ntsc": 30.0,
    "show": 48.0,
    "palf": 50.0,
    "ntscf": 60.0,
    "23.976fps": 23.976,
    "29.97fps": 29.97,
    "59.94fps": 59.94,
}


def flatten_matrix(raw, label):
    if isinstance(raw, (tuple, list)) and len(raw) == 1:
        raw = raw[0]
    if not isinstance(raw, (tuple, list)) or len(raw) != 16:
        raise RuntimeError("%s is not a 16-value Maya matrix: %r" % (label, raw))
    values = [float(x) for x in raw]
    if not all(math.isfinite(x) for x in values):
        raise RuntimeError("%s contains nonfinite values" % label)
    return values


def vector_attr(cmds, plug):
    if not cmds.objExists(plug):
        return None
    value = cmds.getAttr(plug)
    if isinstance(value, (tuple, list)) and len(value) == 1:
        value = value[0]
    if isinstance(value, (tuple, list)):
        return [float(x) for x in value]
    return float(value)


def node_matrix(cmds, path, attribute):
    return flatten_matrix(cmds.getAttr(path + "." + attribute), path + "." + attribute)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene", required=True, help="Original Horse_VR_2017.ma")
    parser.add_argument("--out", required=True, help="JSON output; use .gz suffix for gzip")
    parser.add_argument("--skin", default="HorseRig1:skinCluster1")
    parser.add_argument("--start", type=float, default=None, help="Start frame; defaults to Maya playback minimum")
    parser.add_argument("--end", type=float, default=None, help="End frame; defaults to Maya playback maximum")
    parser.add_argument("--fps", type=float, default=60.0, help="Baked output sampling rate")
    parser.add_argument("--max-samples", type=int, default=1800, help="Safety limit for sampled poses")
    parser.add_argument("--clip-name", default="unclassified-playback-range")
    return parser.parse_args()


def run():
    args = parse_args()
    if not os.path.isfile(args.scene):
        raise RuntimeError("Maya source missing: " + args.scene)
    if args.fps <= 0 or args.max_samples < 2:
        raise RuntimeError("Invalid sample rate or max-samples")

    import maya.standalone
    maya.standalone.initialize(name="python")
    try:
        import maya.cmds as cmds
        import maya.api.OpenMaya as om
        import maya.api.OpenMayaAnim as oma

        cmds.file(args.scene, open=True, force=True, prompt=False,
                  ignoreVersion=True, loadReferenceDepth="all")
        skins = cmds.ls(type="skinCluster", long=True) or []
        matches = [s for s in skins if s == args.skin or s.split("|")[-1] == args.skin]
        if len(matches) != 1:
            raise RuntimeError("Skin %r ambiguous or missing: %r" % (args.skin, skins))
        skin_name = matches[0]

        selection = om.MSelectionList()
        selection.add(skin_name)
        skin_fn = oma.MFnSkinCluster(selection.getDependNode(0))
        influences = skin_fn.influenceObjects()
        if len(influences) != 70:
            raise RuntimeError("Expected 70 original skin influences, got %d" % len(influences))

        geometry = cmds.skinCluster(skin_name, query=True, geometry=True) or []
        if len(geometry) != 1:
            raise RuntimeError("Expected exactly one skinCluster geometry, got %r" % geometry)
        shapes = cmds.listRelatives(geometry[0], shapes=True, fullPath=True,
                                    noIntermediate=True) or []
        if len(shapes) != 1:
            raise RuntimeError("Cannot resolve unique skinCluster mesh shape")
        mesh_selection = om.MSelectionList()
        mesh_selection.add(shapes[0])
        mesh_path = mesh_selection.getDagPath(0)
        if mesh_path.node().hasFn(om.MFn.kTransform):
            mesh_path.extendToShape()
        vertex_count = om.MFnMesh(mesh_path).numVertices
        if vertex_count != 5406:
            raise RuntimeError("Expected 5406 original Maya vertices, got %d" % vertex_count)

        # Preserve every DAG transform between each skin influence and world.
        # Non-joint transform parents are retained because they affect the bind.
        node_paths = set()
        influence_paths = []
        for influence in influences:
            path = influence.fullPathName()
            influence_paths.append(path)
            current = path
            while current:
                node_paths.add(current)
                parents = cmds.listRelatives(current, parent=True, fullPath=True) or []
                current = parents[0] if parents else None

        ordered_paths = sorted(node_paths, key=lambda p: (p.count("|"), p))
        node_index = {path: index for index, path in enumerate(ordered_paths)}
        nodes = []
        for path in ordered_paths:
            parents = cmds.listRelatives(path, parent=True, fullPath=True) or []
            parent_path = parents[0] if parents else None
            kind = cmds.nodeType(path)
            node = {
                "index": node_index[path],
                "path": path,
                "name": path.split("|")[-1],
                "type": kind,
                "parentPath": parent_path,
                "parentIndex": node_index.get(parent_path, -1),
                "localMatrix": node_matrix(cmds, path, "matrix"),
                "worldMatrix": node_matrix(cmds, path, "worldMatrix[0]"),
                "translate": vector_attr(cmds, path + ".translate"),
                "rotate": vector_attr(cmds, path + ".rotate"),
                "scale": vector_attr(cmds, path + ".scale"),
                "rotateOrder": vector_attr(cmds, path + ".rotateOrder"),
                "inheritsTransform": vector_attr(cmds, path + ".inheritsTransform"),
            }
            if kind == "joint":
                node.update({
                    "jointOrient": vector_attr(cmds, path + ".jointOrient"),
                    "rotateAxis": vector_attr(cmds, path + ".rotateAxis"),
                    "segmentScaleCompensate": vector_attr(cmds, path + ".segmentScaleCompensate"),
                    "inverseScale": vector_attr(cmds, path + ".inverseScale"),
                })
            nodes.append(node)

        influence_map = []
        matrix_connections = {}
        for compact_index, influence in enumerate(influences):
            path = influence.fullPathName()
            logical_index = int(skin_fn.indexForInfluenceObject(influence))
            plug = "%s.matrix[%d]" % (skin_name, logical_index)
            sources = cmds.listConnections(plug, source=True, destination=False,
                                            plugs=True) or []
            matrix_connections[str(logical_index)] = sources
            bind_pre = flatten_matrix(
                cmds.getAttr("%s.bindPreMatrix[%d]" % (skin_name, logical_index)),
                "%s.bindPreMatrix[%d]" % (skin_name, logical_index))
            influence_map.append({
                "compactIndex": compact_index,
                "logicalIndex": logical_index,
                "path": path,
                "nodeIndex": node_index[path],
                "bindPreMatrix": bind_pre,
                "matrixConnections": sources,
            })

        time_unit = cmds.currentUnit(query=True, time=True)
        scene_fps = TIME_UNIT_FPS.get(time_unit)
        if not scene_fps:
            raise RuntimeError("Unsupported Maya time unit %r; add an explicit FPS mapping" % time_unit)
        start = args.start if args.start is not None else float(cmds.playbackOptions(query=True, minTime=True))
        end = args.end if args.end is not None else float(cmds.playbackOptions(query=True, maxTime=True))
        if end <= start:
            raise RuntimeError("Animation sample end must be greater than start")
        step = scene_fps / args.fps
        sample_count = int(math.floor((end - start) / step + 1e-8)) + 1
        last_sample = start + (sample_count - 1) * step
        if end - last_sample > 1e-6:
            sample_count += 1
        if sample_count < 2 or sample_count > args.max_samples:
            raise RuntimeError("Refusing %d samples; set a shorter clip range or explicit max-samples" % sample_count)

        original_time = float(cmds.currentTime(query=True))
        frames = []
        first_pose = None
        max_pose_delta = 0.0
        try:
            for sample_index in range(sample_count):
                frame_time = min(end, start + sample_index * step)
                cmds.currentTime(frame_time, edit=True, update=True)
                cmds.refresh(force=True)
                matrices = []
                for path in ordered_paths:
                    matrices.extend(node_matrix(cmds, path, "matrix"))
                if first_pose is None:
                    first_pose = matrices
                else:
                    for a, b in zip(first_pose, matrices):
                        max_pose_delta = max(max_pose_delta, abs(a - b))
                frames.append({
                    "timeFrame": frame_time,
                    "localMatricesRowMajor": matrices,
                })
        finally:
            cmds.currentTime(original_time, edit=True, update=True)
            cmds.refresh(force=True)

        all_joints = cmds.ls(type="joint", long=True) or []
        anim_curves = cmds.ls(type="animCurve") or []
        output = {
            "format": "btc-maya-rig-motion-v1",
            "sourceScene": cmds.file(query=True, sceneName=True),
            "skinCluster": skin_name,
            "meshPath": mesh_path.fullPathName(),
            "meshInclusiveMatrix": flatten_matrix(
                cmds.xform(geometry[0], query=True, matrix=True, worldSpace=True),
                "skinCluster mesh inclusive matrix"),
            "vertexCount": vertex_count,
            "sceneJointCount": len(all_joints),
            "exportedHierarchyNodeCount": len(nodes),
            "exportedHierarchyJointCount": sum(1 for n in nodes if n["type"] == "joint"),
            "influenceCount": len(influence_map),
            "influences": influence_map,
            "matrixConnectionsByLogicalIndex": matrix_connections,
            "hierarchy": nodes,
            "clip": {
                "label": args.clip_name,
                "classification": "unverified-scene-range",
                "startFrame": start,
                "endFrame": end,
                "sceneTimeUnit": time_unit,
                "sceneFps": scene_fps,
                "sampleFps": args.fps,
                "sampleCount": len(frames),
                "animated": max_pose_delta > 1e-7,
                "maxLocalMatrixDeltaFromFirstPose": max_pose_delta,
                "frames": frames,
            },
            "diagnostics": {
                "animCurveNodeCountInScene": len(anim_curves),
                "coordinateBasis": "original Maya scene basis; no axis conversion",
                "matrixConvention": "16-value Maya row-major",
                "weights": "export separately with tools/export_btc_maya_skin.py; preserve every sparse influence",
            },
            "warnings": [
                "This JSON is not a GLB and is not directly consumable by Three.js.",
                "The selected time range is not certified as a Gallop clip by this exporter.",
                "Do not map these matrices or weights onto the unrelated Quaternius 50-joint skeleton.",
                "Convert mesh, hierarchy, bind matrices and every sampled pose together before browser skinning.",
                "Keep the original sparse skin weights; a four-influence truncation loses source weight mass.",
            ],
        }

        destination = os.path.abspath(args.out)
        parent = os.path.dirname(destination)
        if not os.path.isdir(parent):
            os.makedirs(parent)
        temp = destination + ".tmp"
        opener = gzip.open if destination.endswith(".gz") else open
        with opener(temp, "wt", encoding="utf-8") as handle:
            json.dump(output, handle, separators=(",", ":"), ensure_ascii=False)
        os.replace(temp, destination)
        print("BTC_MAYA_RIG_MOTION_EXPORTED", destination,
              "nodes", len(nodes), "influences", len(influence_map),
              "samples", len(frames), "animated", output["clip"]["animated"])
    finally:
        maya.standalone.uninitialize()


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        sys.stderr.write("BTC_MAYA_RIG_MOTION_EXPORT_FAILED: %s\n" % exc)
        sys.exit(1)
