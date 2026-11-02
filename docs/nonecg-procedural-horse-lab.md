# Horse Lab: NONECG anatomy + procedural materials

Status: prototype prepared locally from the original user-provided Horse_VR_2018.ma, without touching production.

- Horse body: 5,406 vertices and 10,790 triangles.
- Body, eyes and four horseshoes: 25,206 triangles, GLB 340,768 bytes.
- GLB: no bitmaps, no textures, no skeleton, no animations.
- Three.js viewer uses runtime GLSL noise for pelage, 5 coat presets, procedural mane/tail and demonstration BTC equipment.
- Syntax and geometry validated, geometry preview inspected. Browser/WebGL final verification pending.

IMPORTANT: NONECG source is proprietary user-supplied content. Do not commit the extracted GLB to the PUBLIC repository without confirming the original license.
The rig and original Maya clips have not been transferred. Shader walk/gallop are visual experiments and are not suitable for racing yet.
Next: convert skinning and Gallop (225-238), Stand breathing (421-520) into skinned GLB; benchmark 12 active horses before switching /racers/#BTC.
The market/race result engine must remain independent of the model and animations.