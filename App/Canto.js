import Ajv from "https://esm.sh/ajv@8";
import { Stanza } from './Stanza.js';
import { Commento } from './Commento.js';
import { Tonalita } from './Tonalita.js';
import { Strumentale } from './Strumentale.js';
import { StrutturaCanto } from "./StrutturaCanto.js";
import { StrutturaStanza } from "./StrutturaStanza.js";
import { getSchema } from "./config/utils.js";

class Canto {

  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "div";
  static strutturaDefaultLabel = "default";
  static ERROR_MESSAGE = "Il canto deve contenere obbligatoriamente: titolo, tonalità.\nIn caso il corpo del canto sia non vuoto è necessario fornire una struttura per l'impaginazione.";
  
  constructor(json = null) {
    this.type = "canto";
    this.data = json ? {
      // id : json.id,
      titolo : json.titolo,
      info : {
        tonalita : new Tonalita(json.info.tonalita),
        metro : json.info.metro || "",
        tempo : json.info.tempo ? {
          velocita : json.info.tempo.velocita,
          bpm : json.info.tempo.bpm || null
        } : null
      },
      strofe : json.strofe ? json.strofe.map(s => new Stanza(s)) : [],
      ritornelli : json.ritornelli ? json.ritornelli.map(r => new Stanza(r)) : [],
      "pre-chorus" : json["pre-chorus"] ? json["pre-chorus"].map(pc => new Stanza(pc)) : [],
      bridge : json.bridge ? json.bridge.map(b => new Stanza(b)) : [],
      strumentali : json.strumentali ? json.strumentali.map(s => new Strumentale(s)) : [],
      struttura : json.struttura ? json.struttura.map(s => ({
        label : s.label,
        struttura : new StrutturaCanto(s.struttura)
      })) : []
    } : null;

    this.introIndex = 0;
    this.outroIndex = 0;

    if (this.data) {
      if (json.intro) {
        this.data.intro = [];
        json.intro.forEach(i => {
          if (i.label) {
            if (this.containsIntroOutro(i.label, "intro")) {
              console.warn(`intro con label ${i.label} già presente`);
              return;
            }
          }
          this.data.intro.push({
            label: i?.label || String(this.introIndex++),
            contenuto: new Strumentale(i.contenuto)
          })
        });
      }
      if (json.outro) {
        this.data.outro = [];
        json.outro.forEach(i => {
          if (i.label) {
            if (this.containsIntroOutro(i.label, "outro")) {
              console.warn(`intro con label ${i.label} già presente`);
              return;
            }
          }
          this.data.outro.push({
            label: i?.label || String(this.outroIndex++),
            contenuto: new Strumentale(i.contenuto)
          })
        });
      }
    }

    this.index = 0;
    this.strutturaSelected = Canto.strutturaDefaultLabel;
    this.commento = null;
    this.components = new Map();
    this.containerHTML = null;
    this.containerClassList = new Set();

    this.color = false;

    this.buildSingleComponents();
  }

  /**
   * Carica il file JSON-schema
   */
  static async loadSchema() {
    this.schema = await (await fetch(getSchema("canto-unico"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente un canto sulla base di un JSON-schema
   * @param {JSON} json 
   */
  static async validate(json) {
    if (!this.schema) await this.loadSchema();
    if (!this._validate) this._validate = this._ajv.compile(this.schema);
    const valid = this._validate(json);

    if (!valid) {
      console.error("❌ Errore di validazione:", this._validate.errors);
      return {
        valid: false,
        errors: this._validate.errors
      };
    }

    return {
      valid: true,
      errors: null
    };
  }

  /**
   * Inizializza gli array
   */
  initData() {
    if (!this.data) this.data = {};
    if (!this.data.info) this.data.info = {};
    if (!this.data.intro) this.data.intro = [];
    if (!this.data.outro) this.data.outro = [];
    if (!this.data.strofe) this.data.strofe = [];
    if (!this.data.ritornelli) this.data.ritornelli = [];
    if (!this.data["pre-chorus"]) this.data["pre-chorus"] = [];
    if (!this.data.bridge) this.data.bridge = [];
    if (!this.data.strumentali) this.data.strumentali = [];
    if (!this.data.struttura) this.data.struttura = [];
    if (!this.containsStruttura("default")) {
      this.data.struttura.push({
        label: "default",
        struttura: new StrutturaCanto()
      });
    }
  }

  // /**
  //  * Assegna l'id del canto
  //  * @param {number} id
  //  */
  // setId(id) {
  //   this.initData();
  //   this.data.id = id;
  // }

  // /**
  //  * @returns {number}
  //  */
  // getId() {
  //   return this.data?.id || null;
  // }

  /**
   * Imposta il tempo del canto
   * @param {string} velocita 
   * @param {number} bpm 
   */
  setTempo(velocita, bpm) {
    this.initData();
    if (velocita) {
      this.data.info.tempo = {
        velocita : velocita
      }
      if (bpm) this.data.info.tempo.bpm = bpm;
    }
  }

  /**
   * Imposta le info del canto
   * @param {Tonalita} tonalita 
   * @param {string} metro 
   * @param {{velocita: string, bpm: number}} tempo 
   */
  setInfo(tonalita, metro, tempo) {
    this.initData();
    if (tonalita instanceof Tonalita) this.data.info.tonalita = tonalita;
    if (metro) this.data.info.metro = metro;
    if (tempo) this.setTempo(tempo?.velocita, tempo?.bpm || null);
  }

  /**
   * @returns {Tonalita}
   */
  getTonalita() {
    return this.data?.info?.tonalita || null;
  }

  calculateTonalita() { // meglio farlo in editor, così posso usare le classi "base-accordo"
    // ...
  }

  /**
   * Assegna il titolo del canto
   * @param {string} titolo 
   */
  setTitolo(titolo) {
    this.initData();
    this.data.titolo = titolo;
  }

  /**
   * @returns {string}
   */
  getTitolo() {
    return this.data?.titolo || "";
  }

  /**
   * Restituisce un array dei nomi delle seconde voci
   * @param {Array<string>} label ['registro' | 'voce' | 'assegnata']
   * @returns {Set<string>}
   */
  getNomiSecondeVoci(label = ['registro','voce','assegnata']) {
    let voci = new Set();
    this.data.strofe.forEach(s => s.getNomiSecondeVoci(label).forEach(v => voci.add(v)));
    this.data.ritornelli.forEach(r => r.getNomiSecondeVoci(label).forEach(v => voci.add(v)));
    this.data['pre-chorus'].forEach(pc => pc.getNomiSecondeVoci(label).forEach(v => voci.add(v)));
    this.data.bridge.forEach(b => b.getNomiSecondeVoci(label).forEach(v => voci.add(v)));
    return voci;
  }

  /**
   * Attiva o disattiva i colori per le stanze
   * @param {boolean} bool 
   */
  activeColor(bool = false) {
    this.color = bool;
  }

  /**
   * Attiva (o disattiva) il colore per ogni stanza
   */
  setActiveColorForEachStanza() {
    if (!this.data) return;
    if (Array.isArray(this.data.strofe)) this.data.strofe.forEach(s => {s.activeColor(this.color); s.update()});
    if (Array.isArray(this.data.ritornelli)) this.data.ritornelli.forEach(s => {s.activeColor(this.color); s.update()});
    if (Array.isArray(this.data["pre-chorus"])) this.data["pre-chorus"].forEach(s => {s.activeColor(this.color); s.update()});
    if (Array.isArray(this.data.bridge)) this.data.bridge.forEach(s => {s.activeColor(this.color); s.update()});
  }

  /**
   * Specifica il subtype per gli intro e gli outro
   */
  setSubtypeForEachStrumentale() {
    if (this.data && Array.isArray(this.data.intro)) this.data.intro.forEach(i => i.contenuto.setSubType("intro"));
    if (this.data && Array.isArray(this.data.outro)) this.data.outro.forEach(i => i.contenuto.setSubType("outro"));
  }

  /**
   * Aggiunge un commento/appunto al canto
   * @param {string|Commento} commento 
   */
  addCommento(commento) {
    this.commento = commento instanceof Commento ? commento : new Commento().fromString(commento);
    this.commento.addClass("commento-canto");
  }

  /**
   * Crea una nuova struttura con il label specificato, se non esiste già
   * @param {string} label 
   */
  createStruttura(label) {
    if (!this.containsStruttura(label)) {
      this.data.struttura.push({
        label: label,
        struttura: new StrutturaCanto()
      });
    }
    else console.warn(`Struttura con label '${label}' già presente`);
  }

  /**
   * Seleziona la struttura del canto che si desidera (se presente)
   * @param {string} label 
   */
  selectStruttura(label) {
    if (this.containsStruttura(label)) this.strutturaSelected = label;
    else console.warn(`struttura '${label}' non trovata`);
  }

  /**
   * Restituisce la lista dei label delle strutture presenti
   * @returns {Array<string>}
   */
  listaStrutture() {
    if (!Array.isArray(this.data.struttura) || this.data.struttura.length === 0) {
      console.warn("nessuna struttura presente");
      return [];
    }
    return this.data.struttura.map(s => s.label);
  }

  /**
   * Controlla se esiste già la struttura con il label specificato
   * @param {string} label
   * @returns {boolean}
   */
  containsStruttura(label) {
    return this.data.struttura.some(s => s.label === label);
  }

  /**
   * Restituisce la struttura con il label specificato (se presente)
   * @param {string} label
   * @returns {StrutturaCanto}
   */
  getStruttura(label = this.strutturaSelected) {
    return this.data.struttura.find(s => s.label === label)?.struttura || null;
  }

  /**
   * @param {StrutturaCanto|JSON} struttura 
   */
  setStruttura(struttura, label) {
    this.initData();
    this.data.struttura.push({
        label: label,
        struttura: struttura instanceof StrutturaCanto ? struttura : new StrutturaCanto(struttura)
      });
  }

  /**
   * Controlla se esiste già l'intro o l'outro con il label specificato
   * @param {string} label
   * @param {string} type
   * @returns {boolean}
   */
  containsIntroOutro(label, type) {
    if (type === "intro" || type === "outro") return this.data[type].some(s => s.label === label);
    console.warn(`Tipo '${type}' non valido. Scegliere tra 'intro' e 'outro'`);
    return false;
  }

  /**
   * Restituisce l'intro o l'outro con il label specificato (se presente)
   * @param {string} label
   * @param {string} type
   * @returns {Strumentale}
   */
  getIntroOutro(label, type) {
    if (type === "intro" || type === "outro") return this.data[type].find(s => s.label === label)?.contenuto || null;
    console.warn(`Tipo '${type}' non valido. Scegliere tra 'intro' e 'outro'`);
    return null;
  }

  /**
   * Aggiunge una riga strumentale e aggiorna lo schema
   * @param {Strumentale} strumentale
   */
  addStrumentale(strumentale) {
    this.initData();
    this.data.strumentali.push(strumentale);
    this.getStruttura(Canto.strutturaDefaultLabel).addComponente("strumentale", null, null, strumentale?.commento || null);
  }

  /**
   * Aggiunge una riga di intro o outro e aggiorna lo schema
   * @param {Strumentale} strumentale
   * @param {string} label
   * @param {string} type
   */
  addIntroOutro(strumentale, label, type) {
    this.initData();
    if (type === "intro" || type === "outro") {
      if (label) {
        if (this.containsIntroOutro(label, type)) {
          console.warn(`${type} con label ${label} già presente`);
          return;
        }
      }
      else label = (type === "intro" ? String(this.introIndex++) : String(this.outroIndex++));
      strumentale.setSubType(type);
      this.data[type].push({
        label: label,
        contenuto: strumentale
      })
      this.getStruttura(Canto.strutturaDefaultLabel).addComponenteByRef(type, label, null, null, strumentale?.commento || null);
      // console.log(this.data.intro);
      // console.log(this.getStruttura(Canto.strutturaDefaultLabel).getSchema());
    }
  }

  /**
   * Aggiunge una stanza e aggiorna lo schema
   * @param {Stanza} stanza
   * @param {boolean} isBreve
   * @param {StrutturaStanza} schema
   * @param {string} commento
   */
  addStanza(stanza, isBreve = false, schema = null, commento = null) {
    this.initData();
    const cmt = commento || stanza?.commento || null;
    switch (stanza.data.type) {
      case "strofa":
        this.data.strofe.push(stanza);
        this.getStruttura(Canto.strutturaDefaultLabel).addComponenteByRef("strofa", stanza.getId(), isBreve, schema, cmt);
        // this.getStruttura(Canto.strutturaDefaultLabel).addComponente("strofa", isBreve, schema, commento);
        break;
      case "ritornello":
        this.data.ritornelli.push(stanza);
        this.getStruttura(Canto.strutturaDefaultLabel).addComponenteByRef("ritornello", stanza.getId(), isBreve, schema, cmt);
        // this.getStruttura(Canto.strutturaDefaultLabel).addComponente("ritornello", isBreve, schema, commento);
        break;
      case "pre-chorus":
        this.data["pre-chorus"].push(stanza);
        this.getStruttura(Canto.strutturaDefaultLabel).addComponenteByRef("pre-chorus", stanza.getId(), isBreve, schema, cmt);
        // this.getStruttura(Canto.strutturaDefaultLabel).addComponente("pre-chorus", isBreve, schema, commento);
        break;
      case "bridge":
        this.data.bridge.push(stanza);
        this.getStruttura(Canto.strutturaDefaultLabel).addComponenteByRef("bridge", stanza.getId(), isBreve, schema, cmt);
        // this.getStruttura(Canto.strutturaDefaultLabel).addComponente("bridge", isBreve, schema, commento);
        break;
      default :
        console.warn(`Tipo stanza non supportato: '${stanza.data.type}'`);
    }
  }

  /**
   * Crea un canto a partire da un array di object
   * @param {Array<{ type: string, contenuto: Array<string> }>} canto
   * @returns {Canto}
   */
  fromBlocks(canto) {
    if (!Array.isArray(canto)) return;

    let ids = { "strofa": 0, "ritornello": 0 };
    for (let i=0; i<canto.length; i++) {
      const type = canto[i].type;
      const blocco = canto[i].contenuto;
      if (blocco.length === 0) continue; 
      else if (blocco.length === 1) {
        if (Strumentale.isValid(blocco[0])) {
          const strumentale = new Strumentale().fromString(blocco[0]);
          if (type === "intro") this.addIntroOutro(strumentale, null, "intro");
          else if (type === "outro") this.addIntroOutro(strumentale, null, "outro");
          else this.addStrumentale(strumentale);
        }
        else {
          // console.log(true);
          const stanza = new Stanza();
          stanza.setId(ids[type]++);
          stanza.setType(type);
          stanza.fromString(blocco);
          this.addStanza(stanza);
        }
      }
      else if (blocco.length > 1) {
        const stanza = new Stanza();
        stanza.setId(ids[type]++);
        stanza.setType(type);
        stanza.fromString(blocco);
        this.addStanza(stanza);
      }
    }

    this.buildSingleComponents();
    return this;
  }

  /**
   * Elabora un canto scritto con la codifica della CUSB-App 1.0 e genera un nuovo oggetto Canto
   * @param {string} testoCodificato
   * @returns {Canto}
   */
  static fromOldEncode(testoCodificato) {
    const righe = testoCodificato.trim().split('\n');
    const blocchi = [];

    let bloccoCorrente = {type: null, contenuto: []};
    let inRitornello = false;
    const canto = new Canto();

    for (let riga of righe) {
      riga = riga.trim();
      if (!riga) continue;

      if (riga.startsWith('\\start') || riga.startsWith('\\cmt')) continue;

      else if (riga.startsWith('\\c') || riga.startsWith('\\l')) {
        bloccoCorrente.contenuto.push(riga.replace('\\c ','').replace('\\l ','')); // oppure .trim()
      }

      else if (riga.startsWith('$$')) {
        // toggle ritornello
        if (inRitornello && bloccoCorrente.contenuto.length > 0) {
          bloccoCorrente.type = "ritornello";
          blocchi.push(bloccoCorrente);
          bloccoCorrente = {type: null, contenuto: []};
        }
        if (bloccoCorrente.contenuto.length > 0) {
          if (bloccoCorrente.contenuto.length === 1 && Strumentale.isValid(bloccoCorrente.contenuto[0])) bloccoCorrente.type = "strumentale";
          else bloccoCorrente.type = "strofa";
          blocchi.push(bloccoCorrente);
          bloccoCorrente = {type: null, contenuto: []};
        }
        inRitornello = !inRitornello;
        continue;
      }

      else if (riga.startsWith('$')) {
        // separatore tra blocchi
        if (bloccoCorrente.contenuto.length > 0) {
          if (bloccoCorrente.contenuto.length === 1 && Strumentale.isValid(bloccoCorrente.contenuto[0])) bloccoCorrente.type = "strumentale";
          else bloccoCorrente.type = "strofa";
          blocchi.push(bloccoCorrente);
          bloccoCorrente = {type: null, contenuto: []};
        }
        continue;
      }

      else if (riga.startsWith('\\head')) {
        const titolo = riga.replace('\\head', '').trim();
        // canto.setId(0);
        canto.setTitolo(titolo);
        // const t = new Tonalita();
        // t.setTonalita("DO","M");
        // canto.setInfo(t);
        continue;
      }

      else if (riga.startsWith('\\end')) {
        if (bloccoCorrente.contenuto.length > 0) {
          if (bloccoCorrente.contenuto.length === 1 && Strumentale.isValid(bloccoCorrente.contenuto[0])) bloccoCorrente.type = "strumentale";
          else bloccoCorrente.type = "strofa";
          blocchi.push(bloccoCorrente);
          bloccoCorrente = {type: null, contenuto: []};
        }
      }

      else if (riga.startsWith('\\intro')) {
        const strumentale = { type: "intro", contenuto: [riga.replace('\\intro ', '')]}; // oppure .trim()
        blocchi.push(strumentale);
        continue;
      }

      else if (riga.startsWith('\\outro')) {
        if (bloccoCorrente.contenuto.length > 0) {
          if (bloccoCorrente.contenuto.length === 1 && Strumentale.isValid(bloccoCorrente.contenuto[0])) bloccoCorrente.type = "strumentale";
          else bloccoCorrente.type = "strofa";
          blocchi.push(bloccoCorrente);
          bloccoCorrente = {type: null, contenuto: []};
        }

        const strumentale = { type: "outro", contenuto: [riga.replace('\\outro ', '')]}; // oppure .trim()
        blocchi.push(strumentale);
        continue;
      }
      
    }

    // // salva eventuale blocco residuo
    // if (bloccoCorrente.length > 0) blocchi.push(bloccoCorrente);

    return canto.fromBlocks(blocchi);
  }

  /**
   * Crea una mappa con le componenti singole e le salva in this.components
   */
  buildSingleComponents() {
    if (!this.data) return;

    this.components = new Map();

    // this.setActiveColorForEachStanza();
    this.setSubtypeForEachStrumentale();

    let stanze = new Map();
    if (this.data.strofe) {
      for (const stanza of this.data.strofe) {
        // const html = stanza.toHTML();
        // stanze.push(html);
        stanze.set(stanza.getId(), stanza); // .copy()
      }
      this.components.set("strofe", stanze);
    }

    stanze = new Map();
    if (this.data.ritornelli) {
      for (const stanza of this.data.ritornelli) {
        // const html = stanza.toHTML();
        // stanze.push(html);
        stanze.set(stanza.getId(), stanza); // .copy()
      }
    this.components.set("ritornelli", stanze);
    }
    
    stanze = new Map();
    if (this.data["pre-chorus"]) {
      for (const stanza of this.data["pre-chorus"]) {
        // const html = stanza.toHTML();
        // stanze.push(html);
        stanze.set(stanza.getId(), stanza); // .copy()
      }
      this.components.set("pre-chorus", stanze);
    }

    stanze = new Map();
    if (this.data.bridge) {
      for (const stanza of this.data.bridge) {
        // const html = stanza.toHTML();
        // stanze.push(html);
        stanze.set(stanza.getId(), stanza); // .copy()
      }
      this.components.set("bridge", stanze);
    }

    let strumentali = [];
    if (this.data.strumentali) {
      for (const riga of this.data.strumentali) {
        // const html = riga.toHTML();
        // strumentali.push(html);
        strumentali.push(riga); // .copy()
      }
      this.components.set("strumentali", strumentali);
    }

    strumentali = new Map();
    if (this.data.intro) {
      for (const riga of this.data.intro) {
        // const html = riga.toHTML();
        // strumentali.push(html);
        strumentali.set(riga.label, riga.contenuto); // .copy()
      }
      this.components.set("intro", strumentali);
    }

    strumentali = new Map();
    if (this.data.outro) {
      for (const riga of this.data.outro) {
        // const html = riga.toHTML();
        // strumentali.push(html);
        strumentali.set(riga.label, riga.contenuto); // .copy()
      }
      this.components.set("outro", strumentali);
    }
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = Canto.tagNameDefault) {
    if (!this.data || !Array.isArray(this.data.struttura) || this.data.struttura.length === 0) {
      throw new Error("Struttura canto non definita o malformata");
    }
    if (!(this.components instanceof Map) || this.components.size === 0) this.buildSingleComponents();

    const container = document.createElement(tagName);
    container.className = `canto`;

    if (this.commento) {
      const commentoCanto = document.createElement("div");
      commentoCanto.className = "commento-canto";
      commentoCanto.appendChild(this.commento.toHTML());
      container.appendChild(commentoCanto);

      // direttamente dentro container, senza box
      // this.commento.addClass("commento-canto");
      // container.appendChild(this.commento.toHTML("div"));
    }

    const struttura = this.getStruttura(this.strutturaSelected).getSchema();
    // console.log(struttura);

    for (const { componente, posizione, schema, commento, isBreve } of struttura) {
      let elt = null;

      let blocco = null;
      switch (componente) {
        case "intro": {
          blocco = this.components.get("intro")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            elt = blocco.update(null, true);
          }
          break;
        }

        case "strofa": {
          blocco = this.components.get("strofe")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            if (isBreve) blocco.setIsBreve(isBreve); else blocco.setIsBreve();
            elt = blocco.update(null, true);
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
          }
          break;
        }

        case "ritornello": {
          blocco = this.components.get("ritornelli")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            if (isBreve) blocco.setIsBreve(isBreve); else blocco.setIsBreve();
            elt = blocco.update(null, true);
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
          }
          break;
        }

        case "pre-chorus": {
          blocco = this.components.get("pre-chorus")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            if (isBreve) blocco.setIsBreve(isBreve); else blocco.setIsBreve();
            elt = blocco.update(null, true);
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
          }
          break;
        }

        case "bridge": {
          blocco = this.components.get("bridge")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            if (isBreve) blocco.setIsBreve(isBreve); else blocco.setIsBreve();
            elt = blocco.update(null, true);
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
          }
          break;
        }

        case "strumentale": {
          blocco = this.components.get("strumentali")?.[posizione];
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            elt = blocco.update(null, true);
          }
          break;
        }

        case "outro": {
          blocco = this.components.get("outro")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            elt = blocco.update(null, true);
          }
          break;
        }

        default:
          console.warn(`Componente non gestito: ${componente}`);
      }

      if (elt) container.appendChild(elt);
    }

    this.containerHTML = container;
  }

  /**
   * Ritorna la rappresentazione testuale del canto
   * @param {boolean} voci
   * @returns {string}
   */
  toString(voci = true) {
    let str = [];

    this.buildSingleComponents();

    if (this.data && this.data.titolo) str.push(this.data.titolo);
    if (this.commento) str.push(this.commento.toString());

    const struttura = this.getStruttura(this.strutturaSelected).getSchema();
    for (const { componente, posizione, schema, commento, isBreve } of struttura) {
      switch (componente) {
        case "intro": {
          const blocco = this.components.get("intro")?.get(posizione);
          if (blocco) { str.push(blocco.toString()); }
          break;
        }

        case "strofa": {
          const blocco = this.components.get("strofe")?.get(posizione);
          if (blocco) {
            let elt = blocco;
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
            if (blocco) { str.push(elt.toString(voci)); }
          }
          break;
        }

        case "ritornello": {
          const blocco = this.components.get("ritornelli")?.get(posizione);
          if (blocco) {
            let elt = blocco;
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
            if (blocco) { str.push(elt.toString(voci)); }
          }
          break;
        }

        case "pre-chorus": {
          const blocco = this.components.get("pre-chorus")?.get(posizione);
          if (blocco) {
            let elt = blocco;
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
            if (blocco) { str.push(elt.toString(voci)); }
          }
          break;
        }

        case "bridge": {
          const blocco = this.components.get("bridge")?.get(posizione);
          if (blocco) {
            let elt = blocco;
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
            if (blocco) { str.push(elt.toString(voci)); }
          }
          break;
        }

        case "strumentale": {
          const blocco = this.components.get("strumentali")?.[posizione];
          if (blocco) { str.push(blocco.toString()); }
          break;
        }

        case "outro": {
          const blocco = this.components.get("outro")?.get(posizione);
          if (blocco) { str.push(blocco.toString()); }
          break;
        }

        default:
          console.warn(`Componente non gestito: ${componente}`);
      }
    }
    return str.length > 0 ? str.join('\n\n') : "";
  }

  toEditor() {
    this.buildSingleComponents();
    let obj = {
      titolo : this.data.titolo,
      commento : this.commento?.toString() || null,
      info : {
        tonalita : this.data.info.tonalita.toString(),
        metro : this.data.info?.metro || null,
        tempo : this.data.info.tempo ? {
          velocita : this.data.info.tempo?.velocita || null,
          bpm : this.data.info.tempo?.bpm || null
        } : null
      }
    };

    const struttura = this.getStruttura(this.strutturaSelected).getSchema();
    let blocchi = [];
    for (const { componente, posizione, schema, commento, isBreve } of struttura) {
      switch (componente) {
        case "intro": {
          const blocco = this.components.get("intro")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            blocchi.push(blocco.toEditor());
          }
          break;
        }

        case "strofa": {
          const blocco = this.components.get("strofe")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            if (isBreve) blocco.setIsBreve(isBreve); else blocco.setIsBreve();
            let elt = blocco;
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
          if (blocco) { blocchi.push(elt.toEditor()); }
          }
          break;
        }

        case "ritornello": {
          const blocco = this.components.get("ritornelli")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            if (isBreve) blocco.setIsBreve(isBreve); else blocco.setIsBreve();
            let elt = blocco;
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
          if (blocco) { blocchi.push(elt.toEditor()); }
          }
          break;
        }

        case "pre-chorus": {
          const blocco = this.components.get("pre-chorus")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            if (isBreve) blocco.setIsBreve(isBreve); else blocco.setIsBreve();
            let elt = blocco;
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
          if (blocco) { blocchi.push(elt.toEditor()); }
          }
          break;
        }

        case "bridge": {
          const blocco = this.components.get("bridge")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            if (isBreve) blocco.setIsBreve(isBreve); else blocco.setIsBreve();
            let elt = blocco;
            if (schema) { elt = blocco.clone(); elt.setSchema(schema); elt.activeColor(this.color); elt = elt.update(); }
          if (blocco) { blocchi.push(elt.toEditor()); }
          }
          break;
        }

        case "strumentale": {
          const blocco = this.components.get("strumentali")?.[posizione];
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            blocchi.push(blocco.toEditor());
          }
          break;
        }

        case "outro": {
          const blocco = this.components.get("outro")?.get(posizione);
          if (blocco) {
            if (commento) blocco.addCommento(commento); else blocco.removeCommento();
            blocchi.push(blocco.toEditor());
          }
          break;
        }

        default:
          console.warn(`Componente non gestito: ${componente}`);
      }
    }
    obj["contenuto"] = blocchi;

    return obj;
  }

  fromEditor(cantoObj) {
    if (cantoObj.titolo) this.setTitolo(cantoObj.titolo);
    if (cantoObj.commento) this.addCommento(cantoObj.commento);
    if (cantoObj.info) {
      const tonalita = new Tonalita().fromString(cantoObj.info.tonalita);
      const metro = cantoObj.info.metro || null;
      const tempo = cantoObj.info.tempo || null;
      this.setInfo(tonalita, metro, tempo);
    }
    if (cantoObj.contenuto) this.fromBlocksEditor(cantoObj.contenuto);

    return this;
  }

  /**
   * Ricostruisce il contenuto del Canto a partire da un array di blocchi in formato "editor".
   * @param {Array<object>} blocchiEditor
   * @returns {Canto}
   */
  fromBlocksEditor(blocchiEditor) {
    if (!Array.isArray(blocchiEditor)) return;

    let ids = { "strofa": 0, "ritornello": 0, "pre-chorus": 0, "bridge": 0 };
    const strumentaleTypes = ["intro", "outro", "strumentale"];
    // const stanzaTypes = ["strofa", "ritornello", "pre-chorus", "bridge"];

    for (const blocco of blocchiEditor) {
      if (!blocco || !blocco.type || !blocco.contenuto) continue;

      if (strumentaleTypes.includes(blocco.type)) {
        const strum = new Strumentale();
        strum.fromEditor(blocco);

        if (blocco.type === "intro") {
          this.addIntroOutro(strum, null, "intro");
        } else if (blocco.type === "outro") {
          this.addIntroOutro(strum, null, "outro");
        } else {
          this.addStrumentale(strum);
        }
      } else {
        const stanza = new Stanza();
        stanza.setId(ids[blocco.type]++);
        // stanza.setType(blocco.type);
        stanza.fromEditor(blocco);
        this.addStanza(stanza, stanza.isBreve);
      }
    }

    this.buildSingleComponents();
    return this;
  }

  /**
   * Costruisce e restituisce il blocco HTML del canto
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = Canto.tagNameDefault, clone = false) {
    if (!tagName) tagName = Canto.tagNameDefault;
    if (!this.containerHTML || tagName !== Canto.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = Canto.tagNameDefault, clone = false) {
    this.buildSingleComponents();
    this.buildContainerHTML();
    return this.toHTML(tagName, clone);
  }

  /**
   * Genera il JSON come oggetto
   * @returns {Object|null}
   */
  toJSONObject() {
    if (!this.data) return null;

    const obj = {
      type: this.type,
      // id: this.data.id,
      titolo: this.data.titolo,
      info: {
        tonalita: this.data.info.tonalita?.toJSONObject?.() ?? null
      }
    };

    // if (this.commento) obj.commento = this.commento;
    if (this.data.info.metro) obj.info.metro = this.data.info.metro;
    if (this.data.info.tempo) {
      obj.info.tempo = {
        velocita: this.data.info.tempo.velocita
      }
      if (this.data.info.tempo.bpm) obj.info.tempo.bpm = this.data.info.tempo.bpm;
    }

    if (Array.isArray(this.data.intro) && this.data.intro.length > 0) {
      obj.intro = this.data.intro.map(i => ({
        label: i.label,
        contenuto: i.contenuto?.toJSONObject?.() ?? null
      })).filter(i => i.contenuto);
    }

    if (Array.isArray(this.data.outro) && this.data.outro.length > 0) {
      obj.outro = this.data.outro.map(i => ({
        label: i.label,
        contenuto: i.contenuto?.toJSONObject?.() ?? null
      })).filter(i => i.contenuto);
    }

    if (Array.isArray(this.data.strofe) && this.data.strofe.length > 0) {
      obj.strofe = this.data.strofe
        .map(s => s?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }

    if (Array.isArray(this.data.ritornelli) && this.data.ritornelli.length > 0) {
      obj.ritornelli = this.data.ritornelli
        .map(r => r?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }

    if (Array.isArray(this.data["pre-chorus"]) && this.data["pre-chorus"].length > 0) {
      obj["pre-chorus"] = this.data["pre-chorus"]
        .map(pc => pc?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }

    if (Array.isArray(this.data.bridge) && this.data.bridge.length > 0) {
      obj.bridge = this.data.bridge
        .map(b => b?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }

    if (Array.isArray(this.data.strumentali) && this.data.strumentali.length > 0) {
      obj.strumentali = this.data.strumentali
        .map(s => s?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }

    if (Array.isArray(this.data.struttura) && this.data.struttura.length > 0) {
      obj.struttura = this.data.struttura.map(s => ({
        label: s.label,
        struttura: s.struttura?.toJSONObject?.() ?? null
      })).filter(s => s.struttura);
    }

    return obj;
  }
  
  /**
   * Genera il JSON come stringa
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify(this.toJSONObject(), null, 2);
  }

  /**
   * Restituisce una copia dell'oggetto
   * @returns {Canto}
   */
  clone() {
    return new Canto(this.toJSONObject());
  }

  /**
   * Carica il canto da un file JSON
   * @param {String} filepath 
   * @returns {Canto}
   */
  static async loadFromFile(filepath) {
    try {
      const res = await fetch(filepath);
      if (!res.ok) throw new Error("Errore fetch");
      const json = await res.json();
      return new Canto(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento del canto:", err);
    }
  }
}

export { Canto };
