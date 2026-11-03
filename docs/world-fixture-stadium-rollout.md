# Cryptódromo World: fixture + ocho estadios 3D | Entrega 03/11/2026

## Base y límites

Rama preparada desde main 723890295 del 3 de noviembre de 2026, mientras otros agentes trabajan en caballos/carreras. No fusionar hasta comparar el main más reciente. No toca visual-lab/scene.js, caballos, raceFixture, officialRace, apuestas, gateras, resultados ni posiciones financieras.

## Diagnóstico comprobado en Hostinger

Prueba pública en GitHub Actions 41708873842:
- race.cryptodromo.com/stadiums/ y /stadiums/fixture/: HTTP 200 pero archivos JavaScript .mjs entregados como text/plain. Chromium bloqueó el módulo y dejó el mensaje de espera.
- race.cryptodromo.com/estadio/: HTTP 200, canvas WebGL funcional, sin errores. Fog/cámara alejaban los edificios de la toma inicial.
- cryptodromo.com/stadiums/, /stadiums/fixture/ y /estadio/: 404, servidas por otra aplicación Next.js. La carrera está alojada en el subdominio race. No modificar DNS o sobrescribir Next a ciegas.

## Correcciones listas

### P0: Fixture mundial visible
- assets/stadium-network-engine.js y assets/stadium-network-ui.js son ahora los entrypoints .js; Hostinger sirve .js como JavaScript válido.
- Los archivos .mjs quedan como compatibilidad de imports anteriores para herramientas y tests Node.
- Las diez páginas HTML de la red cargan .js con clave de caché world2.
- El watchdog clásico assets/stadium-network-watchdog.js muestra un error amigable, enlaces y botón Reintentar si falla el módulo.
- Calendario, estados, horarios, símbolos, controles y 16.366 turnos editoriales siguen intactos. No se crean cotizaciones, clasificaciones o ganadores.

### P1: Ocho vistas de estadio 3D
- El generador 3D original sigue sirviendo Satoshi, Exchange y Horizonte.
- Ocho presets mundiales seleccionables con sus propias paletas, carteles y estructuras: crypto, merval, wall-street, tokyo, london, commodities, forex y champions.
- Cada ficha mundial tiene enlace al recorrido de su sede. Ejemplo: https://race.cryptodromo.com/estadio/?venue=tokyo
- Camera aerial corregida; niebla clara, exposición y distancia mejoradas; se conservan las otras cámaras, controles, luz y clima.
- Es un recorrido escenográfico. Las ocho sedes 3D comparten un óvalo provisional. Las trece pistas especializadas todavía NO están modeladas y no se anuncian como listas.

## Puesta en producción una vez que el otro agente termine

1. Revisar diff de la rama contra el main más nuevo; resolver conflictos sin perder cambios en estadio/ y race-lab/source/src/stadium/.
2. Ejecutar y revisar CI "Cryptódromo World · fixture and eight 3D venues": contrato del fixture, compatibilidad, WebGL y capturas.
3. Fusionar el PR de esta rama sólo si las pruebas pasan y hay conformidad visual.
4. Verificar despliegue real en race.cryptodromo.com, incluyendo que /assets/stadium-network-ui.js y /assets/stadium-network-engine.js respondan 200 con MIME JavaScript, no text/plain.
5. Ejecutar manualmente workflow "Cryptódromo World · fixture and eight 3D venues", con entrada origin=https://race.cryptodromo.com. Probar las diez páginas de World y las ocho opciones 3D.
6. Si fallara por caché, invalidar caché HTML y JS en Hostinger/CDN. Revertir merge si el browser smoke no pasa.

## Dominio Next.js: cambio separado y obligatorio

cryptodromo.com continúa con su aplicación Next.js; este repo no administra su router. El responsable de esa aplicación debe agregar redirects o rewrites de sólo estas secciones, preservando el resto. Ejemplo para next.config.js:

    async redirects() {
      return [
        { source: '/stadiums', destination: 'https://race.cryptodromo.com/stadiums/', permanent: false },
        { source: '/stadiums/:path*', destination: 'https://race.cryptodromo.com/stadiums/:path*', permanent: false },
        { source: '/estadio', destination: 'https://race.cryptodromo.com/estadio/', permanent: false },
        { source: '/estadio/:path*', destination: 'https://race.cryptodromo.com/estadio/:path*', permanent: false }
      ];
    }

No se debe redirigir todo el dominio porque rompería otras páginas. Hasta aplicar ese cambio en Next, las rutas de cryptodromo.com seguirán devolviendo 404, aunque el fixture funcione en el subdominio.

## QA, seguridad y rollback

- Evitar inputs no validados: el selector de sede admite sólo IDs conocidos.
- No conectar el calendario a precios, ganadores ni apuestas; etiquetarlo como DEMO.
- Validar Chrome, Safari, móviles, rain/night y FPS de GPU real; SwiftShader no reemplaza una prueba de rendimiento.
- Si hay un error, rollback por revert del merge. No cambiar motor financiero ni manualmente el deploy.
- Las pruebas de navegador incluyen el caso de módulo bloqueado para impedir pantallas vacías eternas.
