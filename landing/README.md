# Unbalancer landing page

Landing page React/Vite locale per Unbalancer, versione `0.0.1`. Il contenuto è provvisorio e usa placeholder fino all'integrazione delle reference visive e dei testi definitivi.

## Sviluppo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

La build statica viene generata in `landing/dist/`.

## Struttura

- `src/App.jsx` — struttura delle cinque sezioni e navigazione;
- `src/styles.css` — layout responsive, tipografia e palette;
- `src/AnimatedDiagrams.jsx` — animazioni SVG inline del flusso, del SOM e del feedback loop;
- `index.html` — entry point della pagina.

La tipografia usa lo stack di sistema Apple con SF Pro come prima famiglia disponibile. Il progetto non include font proprietari: su sistemi Apple verrà usato SF Pro, sugli altri sistemi verranno usati i fallback configurati.
