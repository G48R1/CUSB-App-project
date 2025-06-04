# Progetto CUSB - App

L'App del CUSB è una cosa seria e duneque si merita un progetto ben elaborato. Di seguito una presentazione delle funzionalità principali previste.


## Panoramica

> **Sezione - Libretto dei canti**

Il Libretto dei canti offre una raccolta di tutti i canti conosciuti (o meglio eseguiti) dal coro. I canti sono in ordine alfabetico. Valutare se inserire il numero (id) del canto a fianco.

#### Funzionalità
- ricerca tramite nome del canto (dinamica e filtrante)
- filtro: possibilità di visualizzare i canti per "etichetta"/tipologia (comunione, offertorio, ingresso, ...)

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; non necessario

Lista dei canti:  
&nbsp;&nbsp;&nbsp; caricamento di un file JSON che mappi il titolo del canto nel path (relativo o assoluto) in cui si trova. Sia il file JSON sia i canti saranno salvati in una repository GitHub o su Drive.

Etichette/Tipologie:  
&nbsp;&nbsp;&nbsp; per poter visualizzare i canti per tipologie si potrebbe salvare nel JSON anche una colonna di tipologie di appartenenza. Per ogni canto va inserita una lista di etichette (un canto può appartenere a più tipologie). Il filtro per etichetta permetterà di visualizzare tutti i canti che hanno nella propria lista di tipologie la tipologia selezionata.

Cliccando su un canto si apre la pagina di visualizzazione del canto.

>> Pagina: Canto

La pagina Canto permette una visualizzazione personalizzata del canto e della sua struttura, nonché della registrazione audio (se presente).

#### Funzionalità
- slider per la visualizzazione delle parti strumentali
- bottoni per il cambio di tonalità
- bottoni per la dimensione del testo
- layout: possibilità di scegliere su quante colonne visualizzare il canto; valutazione inserimento di una funzione "adatta a schermo" per la visualizzazione ottimizzata del canto (sia con sia senza parti strumentali)
- possibilità di scegliere la struttura del canto tra quelle presenti nel menù a tendina (label univoci)
- possibiltà di visualizzare o meno le seconde voci, selezionando quella che si vuole visualizzare (o "tutte") dal menù a tendina
- extra: possibilità di visualizzare il pentagramma di una seconda voce (quella selezionata o tutte insieme)
- possibilità di collassare le stanze (strofe, ritornelli, ...) nella loro versione breve cliccandoci sopra (e viceversa)
- extra (icona pentagramma): possibilità di visualizzare il pentagramma del canto
- extra (icona audio/play): possibilità di riprodurre la registrazione (se presente)

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; non necessario

Struttura canto:  
&nbsp;&nbsp;&nbsp; la struttura del canto sarà realizzata secondo una struttura dati JSON e letta e manipolata tramite classi js. In particolare le classi utilizzate sono:  
InfoCanto, Accordo, Commento, Voce, (RigaAccordo, RigaTesto, RigaVoce) implements Riga, (InOutro) implements Strumentale, Stanza (che racchiude in una singola classe Strofa, Ritornello, Bridge e Pre-Chorus), StrutturaStanza, Canto, StrutturaCanto.

Registrazione:
&nbsp;&nbsp;&nbsp; la registrazione è salvata nella cartella del canto. Gestito dalla classe Registrazione (o nome simile).

Pentagramma:  
&nbsp;&nbsp;&nbsp; il pentagramma del canto viene visualizzato: (da decidere) in una nuova pagina o in una finestra in primo piano. Volendo si può utilizzare una classe Pentagramma (se necessario).


> **Sezione - Canti della Domenica**

La sezione Canti della Domenica permette di visualizzare in maniera consecutiva più canti, uno dietro l'altro. Canti della Domenica non è nient'altro che una raccolta. Non è editabile da qui, ma solo dall'Editor dei Canti (solo per amministratori).

#### Funzionalità
- slider per la visualizzazione delle parti strumentali (generale)
- bottoni per il cambio di tonalità (per ciascun canto)
- layout: come sopra (per ciascun canto)
- seconde voci: come sopra
- stanze collapsible: da decidere

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; non necessario

Schema:  
&nbsp;&nbsp;&nbsp; la lista dei canti da visualizzare e le specifiche saranno salvate in un apposito file JSON che conterrà:
- titolo del canto
- path del canto
- struttura del canto da utilizzare (come label)


> **Sezione - Raccolte**

Raccolte è una sezione personale che contiene delle raccolte di canti. Si accede tramite registrazione/login. Le raccolte sono in stile Canti della Domenica. Ogni raccolta ha la possibilità di essere modificata tramite lo stesso "editor di raccolte" della sezione "editor dei canti", cliccando sull'iconcina accanto al titolo della raccolta.

#### Funzionalità
- possibilità di modificare la raccolta tramite l'editor di raccolte
- menù a tendina per scegliere l'ordinamento delle raccolte (alfabetico, per data, ...)

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; python

Lista raccolte:  
&nbsp;&nbsp;&nbsp; database. Per ogni raccolta salvo: nome, path del file JSON della raccolta, data ultima modifica. I file JSON delle raccolte saranno in una cartella "raccolte" su GitHub o sul Drive (da rivedere).

>> Pagina: Editor Raccolta

Editor raccolta:  
&nbsp;&nbsp;&nbsp; stesso editor dei Canti della Domenica. 

>> Pagina: Raccolta

Visualizzazione raccolta:  
&nbsp;&nbsp;&nbsp; stessa dei Canti della Domenica.


> **Sezione - Eventi**

La sezione eventi contiene raccolte di canti da fare in determinate occasioni. Ogni evento è una raccolta. Non è editabile da qui, ma solo dall'Editor dei Canti (solo per amministratori).

#### Funzionalità
- le stesse della sezione Raccolte, ma solo in visualizzazione

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; non necessario

La realizzazione è la stessa della sezione Raccolte, ma senza editor e possibilità di modifica (solo visualizzazione).


> **Sezione: Editor**

L'Editor dei Canti è accessibile solo agli amministratori. Si accede tramite login.
Presenta in alto una nav con due sezioni:  
Editor Canti, Editor Eventi (tra cui Canti della Domenica, a parte).
Default: Editor Canti selezionato.

>> Pagina: Editor Canti

La pagina dell'editor di canti è simile al Libretto, ma a fianco ad ogni canto c'è un'icona per modificarlo (e una per eliminarlo).

#### Funzionalità
- bottone nuovo canto (in basso)
- modificare canti già presenti (icona a fianco)
- possibilità di cercare il canto da modificare

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; python


>>> *Pagina: Editor Canto*

L'editor dei canti è una pagina con comandi per la modifica e la creazione di un canto.

#### Funzionalità
- bottoni per inserire blocchi (stanze o strumentali)
- bottoni per inserire righe (con tipi specifici)
- possibilità di assegnare tipi ai blocchi (es. accordo, commento, ...)
- bottone per inserire moltiplicatore
- visualizzatore dell'anteprima
- salvare le modifiche

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; python

Generale:  
&nbsp;&nbsp;&nbsp; utilizzo le classi Editor e Blocco per gestire l'editing di un canto. Altre classi più piccole si possono inserire per gestire in maniera più ordinata (es. BloccoAccordo, BloccoRigaTesto, ...). Queste classi hanno al loro interno l'implementazione di metodi o strutture per la generazione parallela di un canto tramite le classi citate nel Libretto (Canto, Stanza, Accordo, ...), nonché un metodo update() per aggiornare l'intero canto (dopo ogni modifica) e l'anteprima. La stessa struttura è utilizzata per la visualizzazione dell'anteprima, che può essere realizzata con una classe Anteprima a sé, oppure tramite innesto di un metodo anteprima(), o direttamente con un metodo interno.

>> Pagina: Editor Eventi

La pagina dell'editor di eventi è simile alla sezione Eventi, ma come l'Editor dei Canti presenta le icone per modificare o eliminare una raccolta. La lista contiene due sezioni: Eventi (con tutta la lista di Eventi) e Canti della Domenica (con la raccolta Canti della Domenica).

#### Funzionalità
- bottone creare evento (in basso ma sempre nella sezione Eventi)
- modificare un evento
- modificare i Canti della Domenica

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; python

>>> *Pagina: Editor Raccolta*

L'editor di una raccolta ha un'interfaccia simile al libretto, ma con la possibilità di aggiungere un canto alla lista. Offre anche un visualizzatore dell'anteprima della raccolta.

#### Funzionalità
- barra di ricerca per i canti
- bottone "+" accanto ad ogni canto per aggiungere alla coda
- drag & drop dei canti nella lista
- salvataggio delle modifiche

#### Realizzazione
Frontend:  
&nbsp;&nbsp;&nbsp; html, css, js  
Backend:  
&nbsp;&nbsp;&nbsp; python

Generale:  
&nbsp;&nbsp;&nbsp; Utilizzo le classi Editor? e ListaCanti per gestire l'editing della lista. Utilizzo la classe Raccolta per costruire la raccolta e visualizzarla con Anteprima.


---

#### Anteprima (valutare se necessaria)
- html: minimale per la finestra
- css: (lo stesso del canto)
- js: classe Anteprima (riceve una lista di oggetti Canto)
