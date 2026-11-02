# F1: referencia de autódromo procedural

El repositorio APEX FORMULA se conserva como **submódulo Git** en esta rama de investigación, fijado a `e5292b85c9a8773fd2a5e2b55df570d5da963488` (2 de septiembre de 2026).

- Origen: https://github.com/bridge-mind/apex-formula
- Licencia: MIT, copyright 2026 BridgeMind (respetar LICENSE y atribución)
- Descarga: `git clone --recurse-submodules ...` o, si el repositorio ya está clonado, `git submodule update --init --recursive`
- Componentes a estudiar: `src/track/`, `src/car/`, `src/render/`, `src/vfx/` y `src/camera/`.

**No importar su motor de física ni director de carreras en Cryptódromo.** El motor financiero debe emitir resultados independientes de cualquier representación; F1 recibe el progreso desde un adaptador visual para circuitos spline. Este módulo no forma parte de la web pública ni de su proceso de build.
