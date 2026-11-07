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
    n = data.get("vertexCount")
    k = data.get("influenceCount")
    require(n == 5406, "unexpected vertex count: %r" % n)
    require(k == 70, "unexpected influence count: %r" % k)
    if not isinstance(n, int) or not isinstance(k, int) or n <= 0 or k <= 0:
        raise ValueError("invalid vertex/influence counts: " + "; ".join(errors))
    names = data.get("influences", [])
    logical = data.get("influenceLogicalIndices", [])
    require(len(names) == k and len(set(names)) == k, "influence names not unique/complete")
    require(len(logical) == k and len(set(logical)) == k, "logical influence indices not unique/complete")
    require(all(isinstance(i, int) and i >= 0 for i in logical), "invalid logical indices")
    matrices = data.get("bindPreMatrixByLogicalIndex", {})
    connections = data.get("matrixConnectionsByLogicalIndex", {})
    for idx in logical:
        key = str(idx)
        m = matrices.get(key)
        require(isinstance(m, list) and len(m) == 16 and
                all(isinstance(x, (int, float)) and math.isfinite(x) for x in m),
                "invalid bindPreMatrix[%s]" % key)
        require(bool(connections.get(key)), "missing matrix connection[%s]" % key)
    rows = data.get("weightsSparseByVertex", [])
    require(len(rows) == n, "incorrect vertex row count")
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
            if not isinstance(j, int) or not 0 <= j < k or j in ids:
                errors.append("invalid/repeated influence at vertex %d" % v)
            ids.add(j)
            if not isinstance(w, (int, float)) or not math.isfinite(w) or w <= 0 or w > 1:
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
