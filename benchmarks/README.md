# Benchmark Unbalancer

Questa directory conterrà il sistema per confrontare una distribuzione del traffico statica con la distribuzione adattiva di Unbalancer.

## Obiettivo

Misurare se il SOM migliora il comportamento del sistema quando cambiano carico, latenza, disponibilità e capacità dei backend.

Il confronto deve usare lo stesso workload, gli stessi backend, la stessa configurazione di rete e la stessa macchina. L'unica variabile principale sarà la presenza o assenza di Unbalancer.

## Modalità di esecuzione

### Baseline — senza Unbalancer

```text
Load generator -> static reference router -> backend pool
```

La baseline utilizzerà una politica statica e dichiarata in anticipo, per esempio Round Robin o Weighted Round Robin. Non avrà accesso al SOM, al decision journal o alle penalità adattive.

Non useremo il collegamento diretto a un solo backend come confronto principale: misurerebbe anche una differenza di topologia, non soltanto l'effetto di Unbalancer.

### Unbalancer

```text
Load generator -> Unbalancer -> adaptive policy -> backend pool
                                      ^
                                      |
                               metrics + SOM
```

Unbalancer potrà cambiare algoritmo, pesi e priorità in base allo stato osservato. Ogni run dovrà registrare la policy attiva e gli interventi del SOM.

## Scenari iniziali

| Scenario | Obiettivo |
|---|---|
| Stable traffic | Misurare overhead e comportamento in condizioni normali |
| Ramp-up | Verificare la risposta a un aumento progressivo del carico |
| Burst traffic | Misurare la gestione di picchi brevi e intensi |
| Slow backend | Verificare rilevamento della latenza e penalizzazione |
| Erroring backend | Verificare error rate, circuit breaker e failover |
| Uneven capacity | Verificare backend con pesi e capacità differenti |
| Session affinity | Verificare il mantenimento delle sessioni |
| Recovery | Misurare il reinserimento graduale di un backend recuperato |

## Metriche obbligatorie

- richieste al secondo;
- throughput;
- latenza media, p50, p95, p99 e massima;
- error rate;
- timeout;
- sessioni completate;
- sessioni fallite e motivi di terminazione;
- distribuzione delle richieste per backend;
- tempo di rilevamento del degrado;
- tempo di reazione del cambio di policy;
- tempo di recupero dopo il degrado;
- numero di cambi algoritmo;
- overhead CPU e memoria;
- latenza aggiunta da Unbalancer e da Ollama.

## Regole di comparabilità

Ogni confronto deve:

1. usare lo stesso seed quando il workload è pseudo-casuale;
2. eseguire un warm-up separato dalla fase misurata;
3. usare la stessa durata e lo stesso numero di richieste;
4. ripetere ogni run più volte;
5. alternare l'ordine baseline/Unbalancer per ridurre bias temporali;
6. salvare configurazione, commit, modello, hardware e timestamp;
7. separare i risultati della prima esecuzione da quelli dopo il warm-up del SOM;
8. riportare intervalli o deviazioni, non solo il valore migliore.

## Output previsto

Ogni run produrrà una directory simile a:

```text
benchmarks/results/
└── 2026-10-14T120000Z-slow-backend/
    ├── manifest.json
    ├── baseline-metrics.json
    ├── unbalancer-metrics.json
    ├── decision-journal.jsonl
    ├── backend-events.jsonl
    └── summary.md
```

I risultati non saranno interpretati soltanto in base al throughput. Unbalancer potrà essere migliore anche mantenendo una latenza p99 e un error rate inferiori durante il degrado, pur introducendo un piccolo overhead nel caso stabile.

## Configurazione di riferimento

La prima configurazione comune dovrà descrivere:

- lista dei backend;
- capacità e pesi iniziali;
- durata del warm-up;
- durata della misurazione;
- profilo del load generator;
- soglie di latenza ed errore;
- algoritmo statico della baseline;
- intervallo decisionale del SOM;
- modello Ollama utilizzato;
- numero di ripetizioni.

Il runner vero e proprio verrà implementato dopo il proxy e il tracciamento delle sessioni.
