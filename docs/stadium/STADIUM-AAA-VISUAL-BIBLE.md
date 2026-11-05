# Hipódromo Satoshi Nakamoto · Biblia visual AAA (v0.1)
Fecha de referencia: 2026-11-04 (Argentina). Documento de producción, no certificación visual.

## Identidad y gramática del recinto
**Hípica patrimonial + infraestructura de transmisión contemporánea.** Torres gemelas y galerías clásicas (no réplicas), coronamientos y tejados oscuros, muros de piedra clara, vidrio oscuro, latón envejecido y verde azulado CRP. Jerarquía: pistas y caballos primero, tribunas y torres después, paisaje al fondo. Nada debe obstaculizar el plano de carrera.

## Referencias investigadas y decisiones
| Sistema | Fuente | Decisión visual comprobable |
| --- | --- | --- |
| Monumento y cubiertas | Churchill Downs, Twin Spires y tribuna oficial: https://louisvilleky.gov/events/venues/churchill-downs | Dos hitos verticales legibles en panorámica; cubierta continua apoyada en estructuras reales; modernización VIP sin destruir el carácter clásico |
| Fachadas y llegada | Tribuna Oficial de Palermo (1908, Luis Faure Dujarric): https://old.palermo.com.ar/es/institucional/c/tribunas | Separar arquitrabe, vanos, accesos y segundo plano de fachada; la tribuna debe mirar la meta |
| Gran escala y servicios | Meydan Racecourse, ERA: https://emiratesracing.com/racecourses/meydan | Articular ala de servicios, palcos, mantenimiento y circulación; no poner todo en un gran prisma |
| Estadio premium | Royal Ascot: https://www.ascot.com/ | Estudiar marquesinas, continuidad de espectadores y materiales, sujeto a validación visual detallada |
| Hípica en movimiento | Winning Post 10, presentación oficial: https://www.gamecity.ne.jp/winningpost10/system-race.html | Conservar la lectura del pelotón, suelo volumétrico cercano, luz diurna estacional y cámara de TV con prioridad en posiciones |
| Método de referencia | CGWORLD, Winning Post 10 2026: https://cgworld.jp/article/202608-cgw336-wp10.html | Levantar imágenes de referencia por material y escala, compararlas cámara a cámara; no reproducir imágenes protegidas en el producto |
| Fotografía y escala | Rival Stars Horse Racing Desktop: https://www.rivalstarshorseracing.com/ | Marcar contacto al suelo, diversidad de planos, claridad en movimiento y contraste de superficies |
| Color y atmósfera | Churchill Downs día/noche y Meydan nocturno | 3 niveles de exposición: carrera, público, fachada; luces cálidas en recintos VIP y pista neutral visible, sin azules uniformes |

## Trazados y restricciones no negociables
- Muybridge: óvalo de tierra, Genesis: recta diagonal sintética, Vint Cerf: S de césped. Deben conservarse tres cronómetros/fixtures independientes, sin alterar el deporte.
- Pistas libres de árboles, tribunas, carteles, gateras ajenas, muros, cruces de caminos al nivel de rodadura y mallas flotantes. La visibilidad total requiere vista panorámica del complejo.
- NO modificar caballo BTC, rigs, algoritmos financieros, resultado, premios ni apuestas.
- Estándar de evaluación: dron, transmisión, railcam, fachada, torres, noche, lluvia, doce caballos, móvil y pruebas de 30/60 FPS donde sea posible.

## Presupuesto técnico inicial (orientativo, no medición)
- Multitudes distantes: instancing por parte anatómica, materiales reutilizados, paleta de vestuario determinista y siluetas diferentes.
- Evitar luces dinámicas por persona; preferir lámparas de estadio con luz de relleno agrupada.
- Priorizar sombras de corredores y contacto de casco; reducir sombras de público lejano y objetos repetidos.
- Escalado según calidad; los perfiles SwiftShader y móviles necesitan medición separada.
- Registrar draw calls, geometrías, FPS percentil 5, memoria GPU, tamaño transferido y errores WebGL por plano.

## Orden de aprobación visual
1. Integridad geométrica de los tres recorridos y posiciones reales de grandes edificios.
2. Público creíble y orientado hacia la pista (iteración del PR de audiencia).
3. Fachadas, canopias y torres con detalle visto desde 5–20 m; sin piezas flotantes.
4. Materiales PBR con referencias reales y transiciones de terreno sin mosaicos visibles.
5. Iluminación real de noche + condiciones de lluvia; simultáneamente conservar 12 caballos legibles.
6. Broadcast y rendimiento documentados desde el render real, no renders conceptuales.

## Límites de la evidencia actual
Las fuentes sirven como orientación de dirección artística. La rama de público no demuestra que la escena completa alcance AAA. La calidad no se aprueba hasta revisar capturas reales de Chromium y producción.
