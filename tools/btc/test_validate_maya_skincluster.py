"""Synthetic positive/negative regression checks for BTC Maya export validation.

Run: python -m unittest discover -s tools/btc -p 'test_validate_maya_skincluster.py'
Synthetic fixtures do NOT substitute for exporting Horse_VR_2017.ma in Maya.
"""
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).with_name("validate_maya_skincluster.py")
spec = importlib.util.spec_from_file_location("btc_skin_validator", MODULE)
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def fixture():
    logical = list(range(70))
    return {
        "schema": "btc-maya-original-skin-v1",
        "skinCluster": "HorseRig1:skinCluster1",
        "sourceScene": "synthetic-fixture-not-original.ma",
        "geometryMatrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        "vertexCount": 5406,
        "influenceCount": 70,
        "influences": ["joint%d" % i for i in logical],
        "influenceLogicalIndices": logical,
        "bindPreMatrixByLogicalIndex": {str(i): [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] for i in logical},
        "matrixConnectionsByLogicalIndex": {str(i): ["joint%d.worldMatrix[0]" % i] for i in logical},
        "weightsSparseByVertex": [[[0, 1.0]] for _ in range(5406)],
    }


class SkinValidationTests(unittest.TestCase):
    def check(self, payload, valid):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "skin.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            if valid:
                validator.validate(path)
            else:
                with self.assertRaises(ValueError):
                    validator.validate(path)

    def test_valid_fixture(self):
        self.check(fixture(), True)

    def test_missing_vertex(self):
        data = fixture()
        data["weightsSparseByVertex"].pop()
        self.check(data, False)

    def test_non_normalized_weights(self):
        data = fixture()
        data["weightsSparseByVertex"][7] = [[0, 0.4]]
        self.check(data, False)

    def test_duplicate_influence(self):
        data = fixture()
        data["weightsSparseByVertex"][8] = [[0, 0.5], [0, 0.5]]
        self.check(data, False)

    def test_invalid_bind_matrix(self):
        data = fixture()
        data["bindPreMatrixByLogicalIndex"]["3"] = [1, 2]
        self.check(data, False)

    def test_ambiguous_connection(self):
        data = fixture()
        data["matrixConnectionsByLogicalIndex"]["5"].append("other.worldMatrix[0]")
        self.check(data, False)

    def test_boolean_weight(self):
        data = fixture()
        data["weightsSparseByVertex"][0] = [[0, True]]
        self.check(data, False)


    def test_missing_matrix_connection(self):
        data = fixture()
        del data["matrixConnectionsByLogicalIndex"]["5"]
        self.check(data, False)

    def test_unexpected_bind_matrix_key(self):
        data = fixture()
        data["bindPreMatrixByLogicalIndex"]["999"] = data["bindPreMatrixByLogicalIndex"]["0"]
        self.check(data, False)

    def test_nan_weight(self):
        data = fixture()
        data["weightsSparseByVertex"][0] = [[0, float("nan")]]
        self.check(data, False)

    def test_connection_points_to_wrong_joint(self):
        data = fixture()
        data["matrixConnectionsByLogicalIndex"]["5"] = ["joint6.worldMatrix[0]"]
        self.check(data, False)

    def test_boolean_vertex_count(self):
        data = fixture()
        data["vertexCount"] = True
        self.check(data, False)

    def test_boolean_logical_index(self):
        data = fixture()
        data["influenceLogicalIndices"][0] = True
        self.check(data, False)

    def test_malformed_sparse_pair(self):
        data = fixture()
        data["weightsSparseByVertex"][0] = [[0]]
        self.check(data, False)


if __name__ == "__main__":
    unittest.main()
