"""Export original Maya skinCluster1 influences, weights and bind matrices.

Run inside Maya Python (mayapy or Script Editor) after opening Horse_VR_2017.ma:
    exec(open('tools/btc/export_maya_skincluster.py', encoding='utf8').read())

Writes JSON only; does not alter the scene, GLB, other horses or deployed files.
Requires Autodesk Maya with maya.api.OpenMaya and maya.api.OpenMayaAnim.
No claim is made that an export has occurred until this script is run in Maya.
"""
import json
import os
import maya.cmds as cmds
import maya.api.OpenMaya as om
import maya.api.OpenMayaAnim as oma

CLUSTER = 'HorseRig1:skinCluster1'
OUT = os.environ.get('BTC_MAYA_SKIN_EXPORT', os.path.abspath('btc-maya-skincluster1.json'))

def dag_path(name):
    selection = om.MSelectionList()
    selection.add(name)
    return selection.getDagPath(0)

def export():
    if not cmds.objExists(CLUSTER):
        raise RuntimeError('Missing original skinCluster: ' + CLUSTER)
    meshes = cmds.skinCluster(CLUSTER, query=True, geometry=True) or []
    if len(meshes) != 1:
        raise RuntimeError('Expected exactly one skinned mesh; found %r' % meshes)
    shape = cmds.listRelatives(meshes[0], shapes=True, fullPath=True, noIntermediate=True)
    if not shape or len(shape) != 1:
        raise RuntimeError('Cannot resolve unique skinned mesh shape')
    selection = om.MSelectionList()
    selection.add(CLUSTER)
    skin = oma.MFnSkinCluster(selection.getDependNode(0))
    path = dag_path(shape[0])
    mesh = om.MFnMesh(path)
    component = om.MFnSingleIndexedComponent().create(om.MFn.kMeshVertComponent)
    om.MFnSingleIndexedComponent(component).addElements(list(range(mesh.numVertices)))
    weights, influence_count = skin.getWeights(path, component)
    influences = skin.influenceObjects()
    if len(influences) != influence_count:
        raise RuntimeError('Influence count mismatch')
    # Maya matrix[] logical indices need not match the compact getWeights order.
    matrix_connections = {}
    for logical in cmds.getAttr(CLUSTER + '.matrix', multiIndices=True) or []:
        source = cmds.listConnections('%s.matrix[%d]' % (CLUSTER, logical),
                                      source=True, destination=False, plugs=True) or []
        matrix_connections[str(logical)] = source
    bind_pre = {}
    for logical in cmds.getAttr(CLUSTER + '.bindPreMatrix', multiIndices=True) or []:
        matrix = cmds.getAttr('%s.bindPreMatrix[%d]' % (CLUSTER, logical))
        bind_pre[str(logical)] = list(matrix) if matrix is not None else None
    rows = []
    for vertex in range(mesh.numVertices):
        row = [float(weights[vertex * influence_count + j]) for j in range(influence_count)]
        if abs(sum(row) - 1.0) > 0.005:
            raise RuntimeError('Unnormalized Maya weights at vertex %d' % vertex)
        rows.append([[j, w] for j, w in enumerate(row) if w > 1e-8])
    result = {
        'schema': 'btc-maya-original-skin-v1',
        'sourceScene': cmds.file(query=True, sceneName=True),
        'skinCluster': CLUSTER,
        'mesh': shape[0],
        'vertexCount': mesh.numVertices,
        'influenceCount': influence_count,
        'influences': [p.fullPathName() for p in influences],
        'influenceLogicalIndices': [int(skin.indexForInfluenceObject(p)) for p in influences],
        'matrixConnectionsByLogicalIndex': matrix_connections,
        'bindPreMatrixByLogicalIndex': bind_pre,
        'weightsSparseByVertex': rows,
        'geometryMatrix': list(cmds.xform(shape[0], query=True, matrix=True, worldSpace=True)),
    }
    with open(OUT, 'w', encoding='utf8') as handle:
        json.dump(result, handle, separators=(',', ':'), ensure_ascii=False)
    print('BTC original Maya skin exported:', OUT, mesh.numVertices, influence_count)

if __name__ == '__main__':
    export()
