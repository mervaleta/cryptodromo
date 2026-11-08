import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const scene=readFileSync(new URL('../visual-lab/scene.js',import.meta.url),'utf8');
test('occlusion probe is opt-in, read-only and samples 25 camera rays',()=>{
 assert.match(scene,/get\('stadium-occlusion-qa'\)==='1'/);
 assert.match(scene,/__cryptodromoOcclusionQA=Object\.freeze/);
 assert.match(scene,/raycaster\.setFromCamera\(new THREE\.Vector2\(x,y\),camera\)/);
 assert.match(scene,/raycaster\.intersectObjects\(scene\.children,true\)/);
 assert.match(scene,/for\(const y of \[-\.65,-\.3,0,\.3,\.65\]\)/);
 assert.match(scene,/for\(const x of \[-\.8,-\.4,0,\.4,\.8\]\)/);
 assert.match(scene,/samples\.push\(\{x,y,hit:/);
 assert.match(scene,/chain:chain\.slice\(0,8\)/);
});

test('ray diagnostics ignore hidden ancestors, not only hidden leaf meshes',()=>{
 // Alpha20 start-gate children remain raycastable after their parent group
 // is hidden for oval and S-bend. A leaf-only check produced false positives.
 assert.match(scene,/const hit=hits\.find\(h=>\{/);
 assert.match(scene,/for\(let node=h\.object;node;node=node\.parent\)if\(!node\.visible\)return false;/);
 assert.match(scene,/if\(!hit\)\{samples\.push\(\{x,y,hit:null\}\);continue;\}/);
});
