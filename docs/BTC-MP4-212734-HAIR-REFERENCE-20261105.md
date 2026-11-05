# BTC · benchmark de pelo basado en `212734.mp4` · 2026-11-05

**Estado:** referencia inspeccionada / V17 candidato, sin validación visual de WebGL de producción. Este documento no certifica un despliegue ni calidad AAA.

## Fuente revisada de primera mano

- Archivo original aportado al proyecto: `212734.mp4`, H.264, 1920 × 1080, duración 10.504 s, 316 cuadros, ~30.10 fps.
- La toma muestra un caballo blanco/gris claro, de costado en galope, fondo verde para composición. El acabado del video es estilizado; no debe interpretarse como un modelo fotográfico ni como una malla disponible para copiar.
- Se inspeccionaron fotogramas y una secuencia de 12 recortes del cuello, crin y flequillo entre 0.00 y 1.83 s. La frecuencia y dirección del viento externo no se pueden medir inequívocamente en el video: el aspecto observado combina galope, respuesta secundaria y flujo aparente.

## Lectura cuadro por cuadro

| Intervalo | Aspecto observable | Qué debe reproducir BTC |
| --- | --- | --- |
| 0.00–0.33 s | Mechones cervicales descienden sobre el cuello, superpuestos en capas; raíces alineadas con la cresta | Silueta continua desde cruz hasta nuca, evitando hebras que salen de la garganta |
| 0.50–0.83 s | Puntas se levantan y barren hacia atrás mientras cabeza/cuello suben; el flequillo continúa encima de la frente | Retardo elástico y excursión mayor de las puntas; raíces firmemente ancladas |
| 1.00–1.16 s | Mechones vuelven a posarse con escalonamiento, no todos como una lámina única | Respuesta amortiguada diferenciada por región y fase |
| 1.33–1.83 s | Nueva extensión y agrupación; flequillo forma dos o tres puntas cortas delante de las orejas | Aislar las guías cortas del flequillo, sin atravesar orejas ni ojos |
| Ciclo completo | Cola se abre, fluye hacia atrás y vuelve con retraso respecto de la grupa | Dock fijo, componente de inercia separado, sin oscilación idéntica a crin |

## Hallazgo en los activos 3D aportados

La escena original `Horse_VR_2017.ma` **sí contiene pelo modelado / sistemas de Maya**, no sólo cuerpo:
- `ManePolyShapeOrig`: **235 vértices, 184 caras de cuatro lados (368 triángulos tras triangulación)**.
- `TailPolyShapeOrig`: **261 vértices, 254 caras de cuatro lados (508 triángulos tras triangulación)**.
- `Hair_Long` contiene `hairSystem1_Mane_LongShape`, `hairSystem2_Tail_LongShape` y curvas/folículos; requieren evaluación y bake fuera de Three.js.
- Se extrajo un GLB estático de diagnóstico de ambas mallas usando la transformación de Maya al espacio local del corredor; NO tiene skinning, física ni aspecto AAA y NO se importó en la ficha.

**Dirección artística real:** usar el groom Maya como insumo a conservar/rehacer en Blender/Maya (guías, volúmenes y silueta), con rig del Gallop y malla corporal original; no ampliar indefinidamente el generador de hebras tubulares en JS.

## Candidato de movimiento V17 en rama aislada

- Mismo cuerpo anatómico Maya / rig Gallop original. Ninguna modificación de huesos, timeline del clip o motor financiero.
- Dos estados de inercia amortiguados, separados para crin dorsal y flequillo, alimentados por la fase nativa del galope. Raíz rígida y excursión creciente hacia la punta.
- Viento prioritariamente dirigido hacia la grupa, con pequeña componente irregular secundaria; suprimir vaivén lateral de amplitud equiparable a la corriente aerodinámica.
- Identificadores de región en atributos de malla para diferenciar flequillo, corona, crin y cola.
- 24 → 20 secciones longitudinales por guía, conservando 6 vértices/anillo: coste geométrico teórico **−16.7%** (sin afirmar mejora medida de FPS).
- Esta iteración **sigue utilizando hebras generadas por código**; el próximo hito de geometría es convertir el groom artístico de Maya a un activo skinned real con LOD.

## QA obligatorio antes de aprobar/publicar

1. Captura **Chromium/WebGL real de Hostinger** en `https://race.cryptodromo.com/racers/#BTC`; confrontar hash de archivos efectivamente servidos y build visible `btc-maya-mp4-groom-inertia-20261105-v17`. No alcanza con GitHub/CI.
2. 16 fases nativas del Gallop, vista de perfil y tres cuartos, además de frente, atrás y detalle de nuca/flequillo. Comparar con los fotogramas 0.00, 0.16, 0.33, 0.50, 0.66, 0.83, 1.00, 1.16, 1.33, 1.50, 1.66 y 1.83 s del MP4.
3. Detectar y rechazar cabellos que cruzan orejas, ojos y cuello, raíces desprendidas, puntas que vibran o bordes que saltan al pausar/reanudar.
4. Ensayar viento 0 / 0.95 / 2, galope 0.5× / 1× / 1.6×, idle, pausado/reanudado, 15 / 30 / 60 fps; medir draw calls, triángulos, memoria GPU y FPS.
5. La aceptación exige una mejora visible en capturas comparables y mantener intactos los **otros 99 corredores**, la carrera y los resultados. **Sin clone, sin modelo maestro aprobado, sin etiqueta AAA**.

## Responsable del arte

La referencia en video indica cómo debe moverse la masa capilar; no sustituye el trabajo de artist grooming. El siguiente cambio estructural debe reemplazar o cubrir los tubos procedurales con un asset real elaborado a partir del `Horse_VR_2017.ma`, con piel, materiales, mallas de guías y niveles de detalle.
