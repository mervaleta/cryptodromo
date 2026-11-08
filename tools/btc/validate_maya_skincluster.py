"""Validate a Maya BTC skin export without requiring Maya or modifying game assets.

Usage: python tools/btc/validate_maya_skincluster.py btc-maya-skincluster1.json
Only validates exported data; does not certify WebGL appearance or count as V25.
"""
import json
import math
import sys
from pathlib import Path


def validate(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    errors = []
    def require(condition, message):
        if not condition:
            errors.append(message)

    require(data.get("schema") == "btc-maya-original-skin-v1", "wrong schema")
    require(data.get("skinCluster") == "HorseRig1:skinCluster1", "wrong skinCluster")
    require(isinstance(data.get("sourceScene"), str) and bool(data.get("sourceScene")), "missing source scene")
    geometry = data.get("geometryMatrix")
    require(isinstance(geometry, list) and len(geometry) == 16 and
            all(isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) for x in geometry),
            "invalid geometry matrix")
    n = data.get("vertexCount")
    k = data.get("influenceCount")
    require(type(n) is int and n == 5406, "unexpected vertex count: %r" % n)
    require(type(k) is int and k == 70, "unexpected influence count: %r" % k)
    if type(n) is not int or type(k) is not int or n <= 0 or k <= 0:
        raise ValueError("invalid vertex/influence counts: " + "; ".join(errors))
    names = data.get("influences", [])
    logical = data.get("influenceLogicalIndices", [])
    require(isinstance(names, list) and len(names) == k and
            all(isinstance(name, str) and bool(name) for name in names) and
            len(set(name for name in names if isinstance(name, str))) == k,
            "influence names not unique/complete")
    require(isinstance(logical, list) and len(logical) == k and
            all(type(i) is int and i >= 0 for i in logical) and
            len(set(i for i in logical if type(i) is int)) == k,
            "logical influence indices not unique/complete")
    require(all(type(i) is int and i >= 0 for i in logical) if isinstance(logical, list) else False, "invalid logical indices")
    # Stop before indexing malformed influence metadata: fail closed with a useful error.
    if (not isinstance(names, list) or len(names) != k or
            any(not isinstance(name, str) or not name for name in names) or
            not isinstance(logical, list) or len(logical) != k or
            any(type(i) is not int or i < 0 for i in logical)):
        raise ValueError("BTC Maya skin export rejected:\\n" + "\\n".join(errors))
    matrices = data.get("bindPreMatrixByLogicalIndex", {})
    connections = data.get("matrixConnectionsByLogicalIndex", {})
    require(isinstance(matrices, dict) and isinstance(connections, dict), "invalid matrix dictionaries")
    if not isinstance(matrices, dict):
        matrices = {}
    if not isinstance(connections, dict):
        connections = {}
    for position, idx in enumerate(logical if isinstance(logical, list) else []):
        key = str(idx)
        m = matrices.get(key)
        require(isinstance(m, list) and len(m) == 16 and
                all(type(x) in (int, float) and math.isfinite(x) for x in m),
                "invalid bindPreMatrix[%s]" % key)
        expected_connection = (names[position] + ".worldMatrix[0]") if isinstance(names, list) and position < len(names) and isinstance(names[position], str) else None
        require(isinstance(connections.get(key), list) and len(connections[key]) == 1 and
                connections[key][0] == expected_connection,
                "missing/ambiguous worldMatrix connection[%s]" % key)
    require(set(matrices) == {str(i) for i in logical}, "bind matrix keys do not match influences")
    require(set(connections) == {str(i) for i in logical}, "matrix connection keys do not match influences")
    rows = data.get("weightsSparseByVertex", [])
    require(isinstance(rows, list) and len(rows) == n, "incorrect vertex row count")
    if not isinstance(rows, list):
        rows = []
    for v, row in enumerate(rows):
        if not isinstance(row, list) or not row:
            errors.append("empty/invalid weight row %d" % v)
            continue
        ids = set()
        total = 0.0
        for pair in row:
            if not isinstance(pair, list) or len(pair) != 2:
                errors.append("invalid weight pair at vertex %d" % v)
                continue
            j, w = pair
            if type(j) is not int or not 0 <= j < k or j in ids:
                errors.append("invalid/repeated influence at vertex %d" % v)
            if type(j) is int:
                ids.add(j)
            if type(w) not in (int, float) or not math.isfinite(w) or w <= 0 or w > 1:
                errors.append("invalid weight at vertex %d" % v)
            else:
                total += w
        if abs(total - 1) > 0.005:
            errors.append("weight sum at vertex %d: %.7f" % (v, total))
        if len(errors) > 30:
            break
    if errors:
        raise ValueError("BTC Maya skin export rejected:\n" + "\n".join(errors))
    print("PASS: original Maya skin data structure, %d vertices, %d influences" % (n, k))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python validate_maya_skincluster.py export.json")
    validate(sys.argv[1])
