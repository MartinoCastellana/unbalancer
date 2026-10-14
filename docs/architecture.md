# Unbalancer — Architettura iniziale

## Livelli

### Data Plane

Riceve richieste, mantiene il percorso veloce e applica la politica attiva. Non dipende sincronicamente da Ollama.

### Decision Plane

Contiene gli algoritmi di routing, il registro dei backend, le priorità, le penalità, il circuit breaker e la politica attualmente attiva.

### Intelligence Plane

Raccoglie snapshot aggregati, interroga il SOM tramite Ollama e pubblica una nuova politica dopo la validazione.

## Componenti

| Componente | Responsabilità |
|---|---|
| Proxy | Ricezione e inoltro delle richieste |
| Algorithm Registry | Registrazione degli algoritmi disponibili |
| Session Tracker | Stato e lifecycle delle sessioni |
| Health Checker | Disponibilità e salute dei backend |
| Metrics Collector | Latenza, errori, throughput e risorse |
| Decision Journal | Decisioni, contesto e outcome |
| Feature Builder | Snapshot pronto per il SOM |
| SOM Adapter | Comunicazione con Ollama |
| Policy Validator | Validazione e limiti della risposta |
| Policy Store | Ultima politica valida e versioni precedenti |

## Cambio di politica

Una nuova politica deve essere versionata. Il sistema deve poter sapere quale politica era attiva quando una sessione è stata avviata e quale politica era attiva quando è terminata.

```text
Policy P1 attiva
  -> degrado server-2
  -> SOM propone P2
  -> validazione P2
  -> cooldown
  -> P2 attiva
```

## Penalità dei backend

La penalità non equivale immediatamente alla rimozione del backend. Sono previste fasi progressive:

1. riduzione del peso;
2. priorità bassa;
3. esclusione dalle nuove sessioni;
4. circuit breaker;
5. health check di recupero;
6. reinserimento graduale.

## Ollama

L'adapter Ollama dovrà supportare:

- endpoint configurabile;
- nome del modello configurabile;
- timeout;
- retry limitati;
- output JSON strutturato;
- validazione dello schema;
- logging della versione del modello;
- fallback all'ultima politica valida.

Il modello verrà scelto con un benchmark locale. Non è richiesta una dipendenza permanente da un modello specifico.

## Benchmark plane

I benchmark saranno separati dal percorso operativo e useranno due modalità equivalenti:

```text
stesso load generator + stessi backend
             ├── baseline: router statico
             └── Unbalancer: policy adattiva + SOM
```

La baseline serve come controllo: deve usare una politica fissa, come Weighted Round Robin, senza metriche decisionali o penalità adattive. Il runner dovrà poter eseguire entrambe le modalità con lo stesso scenario e produrre output confrontabili.

I risultati dovranno includere sia metriche di performance sia metriche di reazione: p95/p99, errori, timeout, motivi di terminazione, tempo di rilevamento del degrado e tempo di recupero. In questo modo si misura l'effetto reale del SOM e non soltanto l'overhead introdotto dal proxy.

## Simulation interface

Il progetto include una dashboard locale separata dalla landing page in `simulator/`. La dashboard permette di osservare il comportamento previsto prima dell'implementazione del Data Plane reale.

La prima versione usa dati sintetici e simula:

- traffico stabile;
- picchi di traffico;
- backend lento;
- recupero di un backend degradato.

La dashboard non sostituisce i benchmark: serve a esplorare il ciclo decisionale, mentre i benchmark misureranno il comportamento con workload riproducibili.
