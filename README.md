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

## Esempi di utilizzo

Questi esempi descrivono il comportamento progettato di Unbalancer. Non rappresentano ancora comandi eseguibili: il runtime verrà implementato nelle fasi successive.

### Avvio concettuale

```bash
# Avvio del proxy Unbalancer
unbalancer start --config configs/unbalancer.yaml

# Avvio della simulazione locale
cd simulator
npm run dev
```

Una configurazione iniziale potrà avere questa forma:

```yaml
listen: ":8080"
som:
  enabled: true
  provider: ollama
  model: qwen3:0.6b
  decision_interval: 5s
  cooldown: 30s
backends:
  - id: server-01
    url: http://127.0.0.1:9001
    weight: 1
  - id: server-02
    url: http://127.0.0.1:9002
    weight: 2
```

### Traffico stabile e omogeneo

Quando i backend hanno capacità simili, latenza bassa e un error rate regolare, il SOM può mantenere Weighted Round Robin o Weighted Least Connections. In questo caso non è utile cambiare strategia frequentemente: la stabilità della policy è più importante di una micro-ottimizzazione.

```text
condizione: server equivalenti, latenza p95 stabile
scelta: weighted_round_robin
azione: nessuna penalità, cooldown lungo
motivo: distribuzione uniforme con overhead minimo
```

### API sensibili alla latenza

Per richieste brevi e sensibili ai tempi di risposta, il SOM può preferire Least Response Time o EWMA latency. La decisione usa una finestra temporale, in modo da non reagire a un singolo outlier.

```text
condizione: p95 in aumento, connessioni brevi
scelta: least_response_time o ewma_latency
azione: preferenza ai backend con latenza recente più bassa
motivo: minimizzare la latenza percepita dal client
```

### Sessioni lunghe o WebSocket

Quando le sessioni restano attive a lungo, il SOM deve considerare il numero di connessioni più della sola latenza istantanea. Può usare Least Connections insieme a session affinity o Consistent Hashing.

```text
condizione: sessioni persistenti e durata elevata
scelta: least_connections + session_affinity
azione: evitare di concentrare nuove sessioni sui backend già occupati
motivo: proteggere la capacità residua e mantenere la continuità
```

### Cache, file e contenuti ripetuti

Per traffico che beneficia della cache locale, il SOM può selezionare Consistent Hashing o IP Hash. L'obiettivo non è distribuire perfettamente ogni richiesta, ma mantenere la stessa chiave sullo stesso backend finché questo rimane disponibile.

```text
condizione: richieste ripetibili con chiave o sessione
scelta: consistent_hashing
azione: minimizzare la migrazione delle chiavi
motivo: aumentare il riuso della cache
```

### Picchi improvvisi

Durante un burst, il SOM può passare a Power of Two Choices o Least Connections. Invece di valutare tutti i backend in modo costoso, Power of Two Choices confronta due candidati e seleziona quello meno carico.

```text
condizione: throughput oltre la soglia di burst
scelta: power_of_two_choices
azione: distribuire rapidamente le nuove richieste
motivo: decisione veloce con buona distribuzione del carico
```

### Server con capacità diverse

Se un backend ha più CPU, memoria o istanze disponibili, il SOM può usare Weighted Least Connections o Resource-aware Routing. Il peso non sarà fisso per sempre: potrà essere corretto in base agli outcome osservati.

```text
condizione: capacità eterogenea
scelta: weighted_least_connections
azione: assegnare più traffico ai backend con maggiore capacità libera
motivo: evitare che l'equità numerica diventi inefficienza
```

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

## Logiche decisionali del sistema

Il SOM seguirà una pipeline a più livelli. Il modello Ollama proporrà la politica, ma il controllo finale resterà nel Decision Plane.

### 1. Raccolta dello stato

Il sistema costruisce uno snapshot su una finestra temporale configurabile. Le informazioni principali sono:

- richieste al secondo e trend del traffico;
- sessioni attive, completate, fallite e terminate per timeout;
- latenza media, p95, p99 e variazione recente;
- error rate e numero di retry;
- connessioni attive per backend;
- CPU, memoria, throughput e capacità residua;
- health check e stato del circuit breaker;
- algoritmo corrente e risultati delle ultime decisioni.

### 2. Safety gates

Prima di chiedere una nuova strategia al SOM, Unbalancer applica regole non delegabili al modello:

1. un backend unhealthy non può ricevere nuove sessioni;
2. un backend in circuit breaker viene escluso;
3. un algoritmo incompatibile con il tipo di sessione viene scartato;
4. una policy con pesi invalidi viene rifiutata;
5. deve rimanere almeno un backend disponibile;
6. non è consentito cambiare policy durante il cooldown, salvo emergenza;
7. il modello non può aumentare la priorità di un backend penalizzato senza segnali di recupero.

### 3. Classificazione del traffico

Il SOM classifica il contesto prima di scegliere l'algoritmo:

| Contesto rilevato | Segnali principali | Strategie candidate |
|---|---|---|
| Stable | varianza bassa, errori bassi | Round Robin, Weighted Round Robin |
| Latency-sensitive | p95/p99 in aumento | Least Response Time, EWMA |
| Connection-heavy | molte sessioni attive | Least Connections, Power of Two |
| Burst | aumento rapido del throughput | Power of Two, Least Connections |
| Sticky | sessioni o chiavi persistenti | Consistent Hashing, IP Hash |
| Heterogeneous | capacità diverse | Weighted Least Connections, Resource-aware |
| Degraded | errori, timeout o latenza anomala | Failover, circuit breaker, policy alternativa |

### 4. Scoring dei candidati

Ogni strategia riceve un punteggio calcolato sulle metriche normalizzate. Un valore più basso indica una scelta migliore:

```text
score =
  w_latency   * latency_cost
+ w_sessions  * active_sessions_cost
+ w_errors    * error_cost
+ w_capacity  * capacity_cost
+ w_history   * historical_outcome_cost
+ w_switch    * policy_switch_cost
```

Il termine `policy_switch_cost` evita di cambiare algoritmo per differenze insignificanti. I pesi dipendono dal contesto: durante un degrado aumentano errori e latenza; durante un traffico stabile aumenta il costo del cambio.

### 5. Decisione e validazione

Il SOM produce una proposta. Il sistema la confronta con la policy corrente e applica una nuova policy solo se:

- il miglioramento atteso supera una soglia minima;
- la proposta supera i safety gates;
- il cambio non viola cooldown e hysteresis;
- esiste una motivazione registrabile;
- il risultato JSON rispetta lo schema.

Se il SOM non risponde, Unbalancer conserva l'ultima policy valida e può applicare un fallback deterministico basato sulle metriche locali.

### 6. Feedback dagli outcome

Dopo l'esecuzione, il sistema confronta la previsione con l'esito reale. Una policy che riduce p99 ed error rate riceve un outcome positivo; una policy che causa timeout, sbilanciamento o oscillazioni riceve una penalità.

```text
snapshot -> classificazione -> candidate scoring -> proposta SOM
       -> safety gates -> policy attiva -> outcome -> decision journal
```

## Case history decisionali

Le seguenti case history saranno usate nella simulazione e nei benchmark.

### Case history 1 — Un backend diventa lento

**Situazione iniziale:** quattro backend ricevono traffico con Weighted Least Connections. `server-02` passa da 90ms a 850ms di p95 per tre finestre consecutive.

**Decisione:**

1. il health check risponde ancora, quindi il server non viene rimosso immediatamente;
2. il Decision Plane applica una penalità iniziale;
3. il SOM classifica il contesto come `Degraded` e propone Least Response Time;
4. `server-02` passa a priorità bassa;
5. le nuove sessioni vengono preferite sugli altri backend;
6. dopo il cooldown il sistema rivaluta il comportamento.

**Risultato atteso:** riduzione del p95 e mantenimento delle sessioni già attive senza oscillare tra inclusione ed esclusione.

### Case history 2 — Picco improvviso

**Situazione iniziale:** il traffico passa da 150 a 900 richieste al secondo in pochi secondi.

**Decisione:**

1. il trend supera la soglia `burst_rate`;
2. il SOM aumenta il peso di Power of Two Choices;
3. le richieste vengono confrontate su candidati con meno connessioni;
4. il sistema registra l'overhead e il tempo di convergenza;
5. terminato il picco, il SOM non ripristina subito la policy precedente: attende una finestra stabile.

**Risultato atteso:** assorbimento del burst con meno concentrazione su un singolo backend.

### Case history 3 — Capacità non uniforme

**Situazione iniziale:** `server-01` ha il doppio della capacità di `server-03`, ma entrambi ricevono lo stesso numero di richieste con Round Robin.

**Decisione:**

1. il sistema osserva CPU, memoria e latenza relative;
2. identifica che la distribuzione numerica non è proporzionale alla capacità;
3. il SOM propone Weighted Least Connections;
4. il peso iniziale viene calcolato dalla capacità dichiarata;
5. l'outcome corregge il peso se la latenza reale non conferma la previsione.

**Risultato atteso:** utilizzo più equilibrato della capacità senza sovraccaricare il backend più piccolo.

### Case history 4 — Errore e recupero

**Situazione iniziale:** `server-04` restituisce errori 5xx e timeout. Dopo un periodo offline torna disponibile.

**Decisione:**

1. il circuit breaker impedisce nuove sessioni;
2. il sistema registra gli errori e il motivo di terminazione;
3. gli health check confermano il recupero;
4. il backend rientra con una quota minima di traffico;
5. se gli outcome sono positivi, la priorità aumenta gradualmente;
6. se ricompaiono timeout, il backend torna in stato degradato.

**Risultato atteso:** recupero controllato senza riversare immediatamente traffico su un server instabile.

## Esempio di decision journal

```json
{
  "timestamp": "2026-10-14T12:41:08Z",
  "scenario": "slow_backend",
  "current_algorithm": "weighted_least_connections",
  "proposed_algorithm": "least_response_time",
  "trigger": "server-02 p95 latency above threshold",
  "active_sessions": 412,
  "backend_state": {
    "server-01": { "latency_p95_ms": 118, "error_rate": 0.2, "priority": 1 },
    "server-02": { "latency_p95_ms": 850, "error_rate": 4.8, "priority": 4 }
  },
  "action": "penalize_backend",
  "cooldown_seconds": 30,
  "outcome": "pending"
}
```

L'evento verrà completato quando la finestra di osservazione successiva avrà misurato l'effetto della decisione.

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
