# Integración pendiente: Comunidad unificada (2026-11-03)

**Estado:** rama preparada, **no fusionar ni desplegar** hasta terminar la coordinación con los agentes de billetera y temporadas.

## Base y alcance
- Basada en `main` `b7b04dccf` (Alpha18 + escuderías, XP y sesiones invitadas).
- Página canónica `/comunidad/`: conserva pestañas, perfil local, favoritos, clubes, rankings y créditos informativos; **reemplaza la segunda implementación estática de 18 insignias** por el álbum compartido de `features/community-achievements/catalog-page.js`.
- Ruta heredada `/comunidad.html`: redirección de navegación a `/comunidad/`. El almacenamiento local no se borra ni migra, porque ambas rutas comparten origen.
- CSS del álbum aislado en `features/community-achievements/hub.css`.
- Enlaces reales a `/stables/` y `/championship/`, sin inventar datos ni mezclar XP con insignias.
- **No se toca** `api/stables.php`, `stables/`, `championship/`, `visual-lab/`, motor 3D, fixture, resultados, billetera, SQL ni cookies.

## Importante: identidades todavía distintas
- `comunidad/` mantiene alias, bio, favoritos (hasta 5 de 6 tokens) y club en `localStorage` con clave `cryptodromo-community-local-v2`.
- `api/stables.php` mantiene una identidad **demo** independiente `crp_stables_demo` / `stable_guest`, HttpOnly y CSRF; no se usa ni se altera.
- El álbum público **no concede logros reales**. La vista de ejemplo está rotulada. No atribuir automáticamente insignias a sesiones anónimas sin contrato explícito.
- `features/community-achievements/001_achievements.sql` es MySQL y no corresponde ejecutarlo sobre la SQLite de escuderías. No correr migraciones en esta integración.
- El viejo `api/auth.php` no debe utilizarse como identidad verificada.
- `public/comunidad/index.html` es una **copia antigua distinta**; no se tocó para no modificar el pipeline de otros agentes. Verificar qué carpeta despliega Hostinger: si publica solo `public/`, es necesario incorporar los assets compartidos al build, no activar un redirect circular.

## Dependencias y secuencia para integrar
1. Confirmar cambios finales del PR #39 (billetera única) y PR #37 (temporadas/clubes); rebase desde `main` actual.
2. Correr `node --test tests/community-unification.mjs` y las suites existentes de escuderías y navegación.
3. Revisar con dos navegadores/sesiones: favoritos y perfil local intactos; XP de escudería y créditos ficticios intactos; no se crean logros ficticios persistentes.
4. Verificar carga de módulos ES y CSS bajo Hostinger, ruta canónica, navegación móvil, tabs y acceso por teclado.
5. Una vez confirmada la identidad segura, diseñar un **adaptador** de eventos del servidor a logros. Nunca otorgar logros desde eventos inventados en el cliente.

## Hallazgos fuera de alcance
- El repositorio contiene `.ssh_pass`: auditar exposición y rotar cualquier secreto real; no leer ni difundir su contenido.
- La pestaña de favoritos de Comunidad solo soporta seis símbolos, mientras el roster tiene 100. Expandir cuando se defina una fuente única de identidad y favoritos.
- Existen otras rutas heredadas `cryptodromo/profile.html` y `public/comunidad/index.html` que no se sustituyen en esta fase.
