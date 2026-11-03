# Crines según la marcha | integración Alpha 18

## Regla visual

- **Carrera (Gallop):** las crines se alargan ligeramente y flamean con la velocidad de galope, moduladas por el viento ambiente.
- **Desfile (Walk):** el paso no genera flameo. Ni el clima despejado (`wind=.5`) ni la lluvia (`wind=1.25`) superan el umbral de vendaval (`wind>1.45`).
- **Vendaval:** las crines de un caballo al paso o detenido pueden moverse cuando `wind>1.45` (escala 0 a 2).
- **Vista de corredores:** puede mostrar el clip Gallop, pero mantiene la crin quieta mediante `maneMotion:false`.
- **Accesibilidad:** `prefers-reduced-motion` desactiva el flameo inmediatamente.

## Integración con los otros agentes

Esta implementación partió de `main` tras la fusión de Alpha 17 (cámaras y largada) y Alpha 18 (densidad del estadio). Conserva sus escenas, controles y materiales. Solo modifica la amplitud de las crines en el shader `Hair` ya existente y el paso de contexto `gait` desde el caballo.

`maneGait:'Walk'` en Parade evita falsos galope por una eventual falta del clip Walk en un GLB alternativo. No se cambian el GLB, el esqueleto, la animación de marcha, los 100 corredores, las 12 posiciones de pista, las cámaras, los resultados ni el motor financiero.

## Verificación

```bash
node --experimental-default-type=module --test tests/wind-mane.mjs tests/wind-mane-gait-policy.mjs tests/wind-mane-integration.mjs tests/alpha16-parade.mjs tests/official-race.mjs
```

CI `Cryptodromo Wind Mane Gait QA` incluye prueba de shader en Chromium, doce caballos reales en desfile y viento despejado/lluvioso. El smoke público valida que las doce crines permanezcan quietas en desfile.

## Reversión

Revertir el PR correspondiente restaura el comportamiento previo sin tocar los archivos 3D ni las reglas de carrera.
