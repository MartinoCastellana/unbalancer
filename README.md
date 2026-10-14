# Unbalancer

Unbalancer è un load balancer adattivo che osserva il comportamento del traffico e dei backend, seleziona dinamicamente l'algoritmo di distribuzione più adatto e registra l'esito di ogni decisione.

L'obiettivo non è imporre un algoritmo unico, ma costruire un sistema capace di capire quando usare Round Robin, Least Connections, EWMA, Consistent Hashing o altre strategie, tenendo conto dello stato reale del sistema.

> Versione: **0.0.1** — Stato del progetto: fase di progettazione.

## Visione

I load balancer tradizionali usano spesso una strategia configurata in anticipo. Questa soluzione funziona finché il traffico e i backend rimangono relativamente stabili; in presenza di latenza, errori, sessioni persistenti o risorse non uniformi può diventare subottimale.

Unbalancer introduce un livello decisionale chiamato **SOM**, inizialmente inteso come **System Orchestration Model**. Il SOM analizza metriche, sessioni, eventi storici e risultati precedenti per scegliere:

- quale algoritmo utilizzare;
- con quali pesi utilizzarlo;
- quali backend penalizzare o escludere temporaneamente;
- quando ripristinare gradualmente un backend degradato.

## Principio architetturale

Unbalancer è diviso in tre livelli:

```text
Data Plane         riceve le richieste e le inoltra rapidamente
Decision Plane     applica la politica di routing attiva
Intelligence Plane Ollama + SOM aggiornano la politica di routing
```

Ollama non viene interrogato per ogni richiesta. Il Data Plane usa sempre l'ultima politica valida; il SOM viene eseguito quando cambiano significativamente le condizioni del sistema o a intervalli configurabili. In caso di timeout, errore o risposta non valida, resta attivo il fallback precedente.

## Funzionalità progettate

- supporto modulare agli algoritmi di load balancing più comuni;
- selezione dinamica dell'algoritmo da parte del SOM;
- session tracking per sessioni attive, completate e fallite;
- classificazione del motivo di terminazione di una sessione;
- penalizzazione temporanea dei backend degradati;
- health check e circuit breaker;
- raccolta di latenza, throughput, errori e risorse;
- decision journal con decisione, contesto ed esito;
- integrazione locale con Ollama;
- fallback deterministici e validazione delle decisioni del modello;
- benchmark comparativi tra algoritmi e politiche adattive;
- landing page pubblica e documentazione tecnica dettagliata.

## Algoritmi previsti

Gli algoritmi saranno implementati come moduli sostituibili con un contratto comune:

```text
recommend(request_context, backend_state) -> recommendation
```

La prima famiglia prevista comprende:

- Round Robin;
- Weighted Round Robin;
- Random e Weighted Random;
- Least Connections;
- Weighted Least Connections;
- Least Response Time;
- EWMA latency;
- Power of Two Choices;
- IP Hash;
- Consistent Hashing;
- session affinity;
- resource-aware routing;
- priority-based routing;
- failover routing.

Il SOM può scegliere un algoritmo singolo oppure una politica combinata con pesi. Non tutti gli algoritmi devono essere applicati a ogni richiesta: tutti contribuiscono al sistema, ma la strategia attiva dipende dal contesto.

## Decisioni, sessioni e memoria

Per ogni ciclo decisionale il sistema conserva:

1. il contesto osservato;
2. le raccomandazioni degli algoritmi;
3. la decisione del SOM;
4. il backend scelto;
5. l'esito della sessione;
6. il motivo di successo, degrado o terminazione;
7. l'effetto misurato sulla decisione successiva.

Una latenza alta persistente, per esempio, può produrre questo flusso:

```text
latenza alta
  -> sessione degradata
  -> penalità sul backend
  -> priorità ridotta o circuit breaker
  -> rivalutazione del SOM
  -> eventuale cambio di algoritmo
```

Le penalità avranno durata, soglie e cooldown configurabili per evitare oscillazioni continue tra algoritmi e backend.

## Integrazione con Ollama

Ollama sarà il runtime locale dell'Intelligence Plane. Il modello riceverà uno snapshot strutturato dello stato del sistema e dovrà restituire una decisione JSON validata, ad esempio:

```json
{
  "selected_algorithm": "weighted_least_connections",
  "algorithm_weights": {
    "least_connections": 0.35,
    "least_response_time": 0.45,
    "power_of_two_choices": 0.20
  },
  "backend_penalties": {
    "server-2": 0.80
  },
  "cooldown_seconds": 30,
  "reason": "sustained high latency and timeout rate"
}
```

Il modello non avrà autorità illimitata: la decisione sarà controllata da schema validation, limiti operativi, health check e fallback. Qwen3-0.6B è la scelta iniziale; la sua conferma definitiva dipenderà dai benchmark di latenza, formato delle risposte e qualità delle decisioni.

### Modello scelto: Qwen3-0.6B

Il modello di riferimento per il primo prototipo sarà **Qwen3-0.6B**, eseguito localmente tramite Ollama.

La scelta è motivata dal ruolo specifico del SOM. Il modello non deve generare testi lunghi né sostituire il motore di routing: deve interpretare uno snapshot compatto, selezionare una strategia e restituire una decisione strutturata con latenza contenuta.

Qwen3-0.6B è adatto alla prima fase perché:

- ha una dimensione ridotta e un consumo di memoria compatibile con una macchina locale;
- consente inferenza locale senza dipendere da API cloud;
- riduce il tempo di risposta del ciclo decisionale rispetto a modelli più grandi;
- è sufficiente per classificazione dello stato, selezione dell'algoritmo e generazione JSON vincolata;
- rende più semplici test, benchmark e sviluppo offline;
- lascia risorse disponibili al proxy, ai backend simulati e alla raccolta delle metriche.

Il modello non sarà considerato l'unica fonte di verità. Le decisioni saranno sempre validate da Unbalancer e, in caso di risposta invalida, timeout o indisponibilità di Ollama, verrà mantenuta l'ultima policy valida o applicato un algoritmo di fallback.

La valutazione iniziale confronterà Qwen3-0.6B su:

1. validità del JSON prodotto;
2. tempo di risposta;
3. coerenza nella scelta dell'algoritmo;
4. capacità di reagire a latenza, errori e sessioni degradate;
5. consumo di memoria e CPU;
6. stabilità durante cicli decisionali ripetuti.

## Ambiente di sviluppo attuale

Specifiche rilevate sulla macchina utilizzata per lo sviluppo del progetto il **14 ottobre 2026**:

| Componente | Specifica |
|---|---|
| Modello | MacBook Pro 18,3 |
| Chip | Apple M1 Pro |
| CPU | 8 core: 6 performance + 2 efficiency |
| Memoria | 16 GB |
| Architettura | ARM64 |
| Sistema operativo | macOS 15.7.4 |
| Runtime Ollama rilevato | 0.32.9 |
| Modello SOM | Qwen3-0.6B |

Ollama risulta installato, ma al momento della rilevazione il servizio locale non era in esecuzione. Le prestazioni definitive saranno registrate dopo l'avvio del servizio e il download del modello.

## Struttura prevista

```text
unbalancer/
├── README.md
├── LICENSE
├── docs/
│   ├── vision.md
│   ├── architecture.md
│   └── landing-page.md
├── core/
│   ├── proxy/
│   ├── algorithms/
│   ├── som/
│   ├── sessions/
│   ├── health/
│   ├── metrics/
│   └── storage/
├── landing/
├── simulator/
│   ├── README.md
│   ├── src/
│   └── package.json
├── benchmarks/
│   ├── README.md
│   └── config.example.yaml
├── tests/
├── examples/
└── configs/
```

## Roadmap

### Fase 0 — Progettazione

- definizione del dominio e della terminologia;
- architettura dei tre piani;
- contratto degli algoritmi;
- formato del decision journal;
- criteri di valutazione del SOM;
- struttura della landing page.

### Fase 1 — Load balancer deterministico

- proxy HTTP;
- configurazione dei backend;
- health check;
- fallback;
- primi algoritmi indipendenti.

### Fase 2 — Sessioni e osservabilità

- lifecycle delle sessioni;
- metriche;
- motivi di terminazione;
- decision journal;
- dashboard o endpoint di osservabilità.

### Fase 3 — SOM con politica locale

- scoring;
- penalità;
- cooldown;
- cambio dinamico di algoritmo;
- simulatore e benchmark.

I benchmark confronteranno sempre baseline statica e Unbalancer sullo stesso workload, con scenari di traffico stabile, picchi, backend lento, errori e recupero.

### Fase 4 — Ollama

- adapter Ollama;
- prompt e output JSON;
- validazione delle risposte;
- modello locale configurabile;
- confronto tra decisioni deterministiche e SOM.

### Fase 5 — Adattamento avanzato

- apprendimento dagli outcome;
- tuning automatico dei pesi;
- modelli specializzati;
- rilevamento di pattern e anomalie.

### Fase 6 — Pubblicazione

- landing page;
- documentazione completa;
- benchmark riproducibili;
- esempi Docker;
- CI;
- release iniziale su Git.

## Stato delle funzionalità

| Funzionalità | Stato |
|---|---|
| Visione e architettura | Progettata |
| Moduli degli algoritmi | Da implementare |
| Session tracking | Da implementare |
| Decision journal | Da implementare |
| SOM deterministico | Da implementare |
| Adapter Ollama | Da implementare |
| Modello locale | Da valutare con benchmark |
| Protocollo benchmark baseline/Unbalancer | Progettato |
| Landing page | Struttura progettata |
| Interfaccia di simulazione | Prototipo locale `0.0.1` |

## Licenza

Da definire prima della prima pubblicazione.
