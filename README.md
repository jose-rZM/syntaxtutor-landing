# SyntaxTutor

## Motivación

Esta página viene motivada por la asignatura de Experiencia de Usuario (UX), para estudiar mejoras en la experiencia de descarga y acceso a la aplicación, así como el estudio del embudo que puede generarse y por el que pasan los usuarios.

## Ejecución y verificación

Requiere Node.js 22.12 o posterior (Vite 8).

```bash
npm ci
npm run check
npm run dev        # http://localhost:5173/?analytics=debug
npm run build      # dist/index.html y dist/privacidad.html
npm run preview    # http://localhost:4173
```

`npm run check` cubre la máquina de estados de la demo, las URLs de descarga, las secciones y el comportamiento de la instrumentación. Ejecutar también una prueba manual en navegador.

## Motivación

Esta página viene motivada por la asignatura de Experiencia de Usuario (UX), para estudiar mejoras en la experiencia de descarga y acceso a la aplicación, así como el estudio del embudo que puede generarse y por el que pasan los usuarios.

## Analítica

`src/analytics.js` incluye una lista cerrada de eventos y propiedades. `src/section-tracking.js` mide el alcance de siete secciones (`fit`, `how`, `demo`, `features`, `downloads`, `docs`, `faq`) una vez por carga, tras un segundo de visibilidad suficiente. No registra texto escrito, URL de búsqueda, profundidad exacta de desplazamiento ni identificadores propios.