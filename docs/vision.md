# Unbalancer — Visione del progetto

## Obiettivo

Unbalancer vuole rendere il load balancing adattivo, osservabile e capace di apprendere dagli esiti delle proprie decisioni.

Il sistema deve poter rispondere a domande operative come:

- quale algoritmo è più adatto al traffico corrente?
- quale backend sta degradando?
- la latenza alta è isolata o sistemica?
- una sessione è terminata correttamente, per timeout o per errore?
- il cambio di algoritmo ha migliorato il risultato?

## SOM

Nel progetto SOM significa **System Orchestration Model**. È il coordinatore che trasforma lo stato osservato in una politica di routing.

Il SOM non sostituisce il load balancer e non deve gestire direttamente il trasporto di ogni richiesta. Decide la politica; il Data Plane la applica con bassa latenza.

## Ciclo di feedback

```text
osservazione
  -> decisione
  -> esecuzione
  -> outcome
  -> memoria
  -> nuova decisione
```

Questa distinzione è fondamentale: una decisione può essere ragionevole nel momento in cui viene presa, ma diventare sbagliata quando l'esito osservato dimostra che la latenza o il tasso di errore sono aumentati.

## Principi

1. **Modularità** — ogni algoritmo deve poter essere aggiunto o sostituito senza riscrivere il proxy.
2. **Osservabilità** — ogni decisione rilevante deve essere spiegabile tramite eventi e metriche.
3. **Sicurezza operativa** — il modello può proporre, ma il sistema valida e limita.
4. **Fallback** — Unbalancer deve continuare a distribuire il traffico anche quando Ollama non è disponibile.
5. **Stabilità** — cooldown, hysteresis e circuit breaker devono impedire cambi compulsivi.
6. **Riproducibilità** — decisioni e benchmark devono poter essere rieseguiti e analizzati.
7. **Evoluzione graduale** — prima regole e scoring verificabili, poi modelli più avanzati.

## Success criteria iniziali

Il primo prototipo sarà considerato utile quando riuscirà a:

- distribuire traffico tra più backend;
- rilevare un backend lento o instabile;
- registrare il motivo del degrado;
- ridurne la priorità;
- scegliere una strategia alternativa;
- mantenere il servizio durante un errore di Ollama;
- dimostrare tramite benchmark che il cambio di politica produce un miglioramento misurabile.
