# Motor de competencias independiente del estadio

## Contrato

`CompetitionEngine` recibe una competencia identificada, la lista de participantes y dos variaciones porcentuales por participante, y emite un registro reproducible de eventos y una clasificación final. **No debe importar Three.js ni depender de FPS, cámara, audio, física de vehículos o clima.**

Un adaptador `TrackPresentation` consume esos eventos y posiciona la representación 3D: caballo, automóvil, dinosaurio u otra. La escena puede ser un hipódromo ovalado, autódromo spline o recorrido temático, sin alterar la clasificación.

```text
Synthetic/real market feed -> normalized candles -> immutable race fixture
                                                  |
                                                  v
                        CompetitionEngine (pure, deterministic)
                             |                |
                      timeline/scores      result/ranks
                             |                |
                        PresentationAdapter / HUD / replay
                             |
        +--------------------+--------------------+
        |                    |                    |
    HorseRacing          FormulaRacing        DinosaurRacing
    oval track           spline circuit       themed track
    12 horses            F1 models            animated dinos
```

## Reglas que preservamos

- Hasta 480 largadas diarias, 12 participantes; el catálogo de 100 tokens y su ponderación pertenecen al fixture, no al renderer.
- Dos entradas de precio y 12 dosis cada cinco segundos (nueve durante los primeros 45 s y tres durante el cierre).
- Coeficientes: primer bloque `[-20,-10,0,10,20,30,40,50,60]`; último `[20,40,60]`. Su permutación por corredor modifica la animación intermedia, pero **no debe cambiar el resultado final** porque todos usan el mismo multiconjunto.
- El control manual de precios de la demo debe identificarse explícitamente y quedar fuera de cualquier resultado presentado como cotización real o auditada.
- Lógica de desempate estable, versión de fórmula, semilla, precios y coeficientes persistidos para reproducción.
- La duración visual, el radio de curva, el número de gateras, las colisiones decorativas y la distancia no pueden definir quién gana.
- **Pendiente:** comparar fórmula de scoring y progreso contra el motor anterior y contra la descripción de patente antes de activar en producción. Evitar que diferencias de punto flotante o normalización alteren ganadores históricos.

## Interfaces objetivo

```ts
interface RaceEvent { raceId:string; atSeconds:number; symbol:string; score:number; progress:number }
interface RaceResult { raceId:string; winner:string; order:string[]; sourceVersion:string }
interface TrackAdapter {
  build(scene:any, settings:any):void;
  poseAt(progress:number, lane:number):{position:any; heading:number};
  dispose():void;
}
interface CompetitorRenderer {
  spawn(symbol:string, appearance:any):any;
  setPose(symbol:string, pose:any, gait:number):void;
  dispose():void;
}
```

## Módulos

- `core/competition`: validación, scoring, dosis, desempate y replay.
- `data/market-fixture`: precios sintéticos, selección ponderada de tokens, versiones.
- `tracks/horse-oval`: gateras numeradas 1–12, rectas, curvas, meta, tribunas tipo Churchill Downs.
- `tracks/formula`: spline, parrilla, boxes, tribunas, cartelería, visuales de F1.
- `tracks/dino`: terreno y decoraciones temáticas.
- `renderers/horses`, `renderers/formula-cars`, `renderers/dinosaurs`.
- `presentations`: cámara, HUD, narración, iluminación, clima y audio.

## Referencias de terceros

- APEX FORMULA, MIT: https://github.com/bridge-mind/apex-formula (guardado como submódulo en `future-f1/vendor/apex-formula`).
- Claude of Duty, MIT: https://github.com/mshumer/Claude-of-Duty para materiales procedurales y efectos.
- Churchill Downs, modelo Sketchfab con atribución CC BY: **no se incluye el modelo** hasta obtener el archivo original y verificar su licencia y optimización.

**Alcance de esta rama:** investigación y contrato de arquitectura; no cambia la carrera publicada ni instala un segundo motor activo.
