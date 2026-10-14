# Unbalancer Simulator

Interfaccia locale per simulare il comportamento di Unbalancer prima dell'integrazione con il proxy reale e con Ollama.

## Avvio

```bash
npm install
npm run dev
```

## Funzionalità attuali

- scenari Stable traffic, Burst traffic, Slow backend e Backend recovery;
- avvio, pausa, ripresa e reset della simulazione;
- algoritmo corrente scelto dal SOM simulato;
- metriche di throughput, latenza media, p95, sessioni ed errori;
- stato dei backend, priorità e penalizzazione;
- grafico SVG della latenza;
- decision journal aggiornato in tempo reale;
- versione iniziale `0.0.1`.

I dati sono sintetici e non rappresentano ancora un collegamento a Unbalancer, Ollama o backend reali.
