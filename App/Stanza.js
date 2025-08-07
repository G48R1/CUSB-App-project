import Ajv from "https://esm.sh/ajv@8";
import { RigaTesto } from './RigaTesto.js';
import { RigaAccordi } from './RigaAccordi.js';
import { Voce } from './Voce.js';
import { Moltiplicatore } from './Moltiplicatore.js';
import { StrutturaStanza } from "./StrutturaStanza.js";
import { camelToKebab, getSchema } from './config/utils.js';
import { Commento } from "./Commento.js";

class Stanza {

  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "div";

  constructor(json = null, schema = null) {
    this.type = "stanza";
    this.data = json ? {
      type : json.type,
      id : json.id,
      righe_accordi : (json.righe_accordi || []).map(r => new RigaAccordi(r)),
      righe_testo : (json.righe_testo || []).map(r => new RigaTesto(r)),
      assegnata : json.assegnata || null,
      righe_assegnate : json.righe_assegnate || [],
      seconde_voci : (json.seconde_voci || []).map(v => new Voce(v)),
      moltiplicatore : new Moltiplicatore(json.moltiplicatore) || null,

      breve : json.breve ? new RigaTesto(json.breve) : null,
      schema : schema ? new StrutturaStanza(schema) : new StrutturaStanza(json.schema),
    } : null;
    this.commento = null;
    this.breveHTML = null;
    this.isBreve = false;
    this.componentsHTML = new Map();
    this.containerHTML = null;
    this.containerClassList = new Set();

    this.color = false;

    if (json) {
      if (json.breve) this.data.breve.setType("stanza-breve");
      if (this.data.assegnata) this.containerClassList.add(this.data.assegnata);
    }

    this.buildSingleComponentsHTML();
  }

  /**
   * Carica il file JSON-schema
   */
  static async loadSchema() {
    this.schema = await (await fetch(getSchema("stanza-unico"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente una stanza sulla base di un JSON-schema
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
    if (this.data.righe_accordi === undefined) this.data.righe_accordi = [];
    if (this.data.righe_testo === undefined) this.data.righe_testo = [];
    if (this.data.righe_assegnate === undefined) this.data.righe_assegnate = [];
    if (this.data.seconde_voci === undefined) this.data.seconde_voci = [];
    if (this.data.schema === undefined) this.data.schema = new StrutturaStanza();
  }

  /**
   * Assegna l'id della strofa
   * @param {number} id
   */
  setId(id) {
    this.initData();
    this.data.id = id;
  }

  /**
   * @returns {number}
   */
  getId() {
    return this.data?.id || null;
  }

  /**
   * Restituisce in un oggetto la versione stringa della stanza
   * @returns {object}
   */
  toEditor() {
    let obj = {
      // type : this.getType(),
      commento : this.commento,
      breve : this.data.breve.toString(),
      isBreve : this.isBreve,
      moltiplicatore : this.data.moltiplicatore,
      contenuto : this.toString(false),
      voci : this.data.seconde_voci.forEach(v => ({
        registro : v.getRegistro(),
        voce : v.getVoce(),
        assegnata : v.getAssegnata(),
        testo : v.toString()
      }))
    }
    return obj;
  }

  /**
   * Aggiunge una riga accordi e aggiorna lo schema
   * @param {RigaAccordi} rigaAccordi 
   */
  addRigaAccordi(rigaAccordi) {
    this.initData();
    this.data.righe_accordi.push(rigaAccordi);
    this.data.schema.addComponente("accordi");
  }

  /**
   * Aggiunge una riga testo e aggiorna lo schema
   * @param {RigaTesto} rigaTesto 
   */
  addRigaTesto(rigaTesto) {
    this.initData();
    this.data.righe_testo.push(rigaTesto);
    this.data.schema.addComponente("testo");
  }

  /**
   * @param {string} moltiplicatore 
   * @param {number} start 
   * @param {number} end 
   */
  addMoltiplicatore(moltiplicatore, start, end) {
    this.initData();
    this.data.moltiplicatore = new Moltiplicatore().fromString(moltiplicatore, start, end);
  }

  /**
   * @param {string} assegnata 
   */
  setAssegnata(assegnata) {
    if (!this.data) this.data = {};
    this.data.assegnata = assegnata;
    this.containerClassList.add(this.data.assegnata);
  }

  /**
   * Aggiunge un'assegnazione di riga
   * @param {{ ref_riga: number, assegnata: string }} rigaAssegnata 
   */
  addRigaAssegnata(rigaAssegnata) {
    this.initData();
    this.data.righe_assegnate.push(rigaAssegnata);
  }

  /**
   * @param {Voce} voce 
   */
  addVoce(voce) {
    this.initData();
    this.data.seconde_voci.push(voce);
  }

  /**
   * Restituisce un array dei nomi delle seconde voci
   * @param {Array<string>} label ['registro' | 'voce' | 'assegnata']
   * @returns {Set<string>}
   */
  getNomiSecondeVoci(label = ['registro']) {
    if (!Array.isArray(this.data.seconde_voci)) return;
    let voci = new Set();
    if (label.includes("registro")) {
      this.data.seconde_voci.forEach(v => {
        if (v.data.registro) voci.add(v.data.registro);
      })
    }
    if (label.includes("voce")) {
      this.data.seconde_voci.forEach(v => {
        if (v.data.voce) voci.add(v.data.voce);
      })
    }
    if (label.includes("assegnata")) {
      this.data.seconde_voci.forEach(v => {
        if (v.data.assegnata) voci.add(v.data.assegnata);
      })
    }
    return voci;
  }

  /**
   * Aggiunge la versione breve della strofa
   * @param {RigaTesto | string} breve 
   */
  setBreve(breve) {
    if (!this.data) this.data = {};
    this.data.breve = !(breve instanceof RigaTesto) ? new RigaTesto().fromString(breve) : breve.copy();
    this.data.breve.setType("stanza-breve");
  }

  /**
   * @param {boolean} bool 
   */
  setIsBreve(bool = false) {
    this.isBreve = bool;
  }

  /**
   * Aggiunge un commento/appunto alla strofa
   * @param {string|Commento} commento 
   */
  addCommento(commento) {
    this.commento = commento instanceof Commento ? commento : new Commento().fromString(commento);
    this.commento.addClass("commento-stanza");
  }

  removeCommento() {
    this.commento = null;
  }

  /**
   * @param {StrutturaStanza|JSON} schema 
   */
  setSchema(schema) {
    this.initData();
    this.data.schema = schema instanceof StrutturaStanza ? schema : new StrutturaStanza(schema);
  }

  /**
   * @returns {StrutturaStanza}
   */
  getSchema() {
    return this.data?.schema || null;
  }

  /**
   * Attiva o disattiva i colori per la strofa
   * @param {boolean} bool 
   */
  activeColor(bool = false) {
    this.color = bool;
    if (bool) this.containerClassList.add("active-color");
    else this.containerClassList.delete("active-color");
  }

  /**
   * Costruisce un oggetto Stanza da un array di stringhe (riconosce solo righe di testo e righe di accordi)
   * @param {Array<string>} righe 
   * @returns {Stanza} oggetto generato
   */
  fromString(righe) {
    for (const riga of righe) {
      if (RigaAccordi.isValid(riga)) this.addRigaAccordi(new RigaAccordi().fromString(riga));
      else this.addRigaTesto(new RigaTesto().fromString(riga));
    }
    return this;
  }

  /**
   * Crea le componenti HTML singole e le salva in this.componentsHTML
   */
  buildSingleComponentsHTML() {
    if (!this.data) return;

    this.componentsHTML = new Map();

    let righe = [];
    if (this.data.righe_accordi) {
      for (const riga of this.data.righe_accordi) {
        const html = riga.toHTML();
        righe.push(html);
      }
      this.componentsHTML.set("righe_accordi", righe);
    }

    righe = [];
    this.data.righe_testo.forEach(r => righe.push(r)); // si potrebbe inserire un clone di ogni riga al posto dell'originale, per permettere di avere una stessa riga più volte nella stessa stanza, ma poi tutte le modifiche non sarebbero salvate
    if (Array.isArray(this.data.righe_assegnate) && !this.data.assegnata) {
      for (const assegnata of this.data.righe_assegnate) {
        righe[assegnata.ref_riga].addClass(assegnata.assegnata);
      }
    }
    if (this.data.seconde_voci) {
      for (const voce of this.data.seconde_voci) {
        let riga = voce.nextCouple();
        while (riga) {
          righe[riga.ref_riga].addVoce(riga.testo);
          riga = voce.nextCouple();
        }
        voce.resetIndex();
      }
    }
    righe = righe.map(r => r.toHTML());
    this.componentsHTML.set("righe_testo", righe);

    if (this.data.breve) this.breveHTML = this.data.breve.toHTML();
    else {
      const breve = this.data.righe_testo[0].copy();
      breve.setType("stanza-breve");
      breve.buildSingleComponentsHTML(); // superfuo
      breve.buildContainerHTML();  // superfluo
      this.breveHTML = breve.toHTML();
    }
  }

  /**
   * Aggiunge una classe a una singola componente target HTML
   * utilizzabile da codice, non da editor
   * @param {string} classe classe da aggiungere
   * @param {string} target componente target
   */
  addClass(classe, target="container") {
    if (target === "container") {
      this.containerClassList.add(classe);
      return;
    }
    const elt = this.componentsHTML.get(target);
    if (Array.isArray(elt)) {
      elt.forEach(e => {
        if (e instanceof HTMLElement) e.classList.add(classe);
      });
    }
  }

  /**
   * Sostituisce l'intera lista this.containerClassList con quella fornita
   * @param {Set|Array<string>} classList nuova lista di classi (CSS) per il container
   */
  setClassList(classList) {
    this.containerClassList = classList instanceof Set ? classList : new Set(classList);
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = Stanza.tagNameDefault) {
    if (!this.data || !this.data.schema || !this.data.schema.data || !Array.isArray(this.data.schema.data.schema)) {
      throw new Error("Schema stanza non definito o malformato");
    }
    if (!(this.componentsHTML instanceof Map) || this.componentsHTML.size === 0) this.buildSingleComponentsHTML();

    const container = document.createElement(tagName);
    container.className = `stanza-box ${this.data.type}-box`;

    const containerStanza = document.createElement("div");
    containerStanza.className = Array.from(new Set([...this.containerClassList, "stanza", this.data.type, "cursor-pointer"])).join(" ");  // sovrascrive le classi
    containerStanza.setAttribute(`${this.data.type}-id`, this.data.id);

    if (this.commento) containerStanza.appendChild(this.commento.toHTML("div"));

    const schema = this.data.schema.getSchema();

    for (const { componente, posizione } of schema) {
      let elt = null;

      let riga = null;
      switch (componente) {
        case "testo": {
          riga = this.componentsHTML.get("righe_testo")?.[posizione];
          if (riga) elt = riga;
          break;
        }

        case "accordi": {
          riga = this.componentsHTML.get("righe_accordi")?.[posizione];
          if (riga) elt = riga;
          break;
        }

        default:
          console.warn(`Componente non gestito: ${componente}`);
      }

      if (elt) containerStanza.appendChild(elt);
    }
    
    const containerBreve = document.createElement("div");
    containerBreve.appendChild(this.breveHTML);
    containerBreve.classList.add("breve-box");
    (this.isBreve ? containerStanza : containerBreve).classList.add("hidden");

    container.appendChild(containerStanza);
    container.appendChild(containerBreve);

    this.containerHTML = container;
  }

  /**
   * Ritorna la rappresentazione testuale della strofa
   * @param {boolean} voci
   * @returns {string}
   */
  toString(voci = false) {
    let str = [];
    if (this.commento) str.push(this.commento.toString());
    let righeTesto = [];
    this.data.righe_testo.forEach(r => righeTesto.push(r.clone()));
    if (this.data.seconde_voci) {
      for (const voce of this.data.seconde_voci) {
        console.log(voce.index);
        let riga = voce.nextCouple();
        while (riga) {
          righeTesto[riga.ref_riga].addVoce(riga.testo);
          riga = voce.nextCouple();
        }
        voce.resetIndex();
      }
    }
    righeTesto = righeTesto.map(r => r.toString(voci));
    let righeAccordi = [];
    this.data.righe_accordi.forEach(r => righeAccordi.push(r.toString()));

    const schema = this.data.schema.getSchema();
    for (const { componente, posizione } of schema) {
      switch (componente) {
        case "testo": {
          const riga = righeTesto[posizione];
          if (riga) str.push(riga);
          break;
        }

        case "accordi": {
          const riga = righeAccordi[posizione];
          if (riga) str.push(riga);
          break;
        }

        default:
          console.warn(`Componente non gestito: ${componente}`);
      }
    }
    return str.join("\n");
  }

  /**
   * Costruisce e restituisce il blocco HTML della stanza
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = Stanza.tagNameDefault, clone = false) {
    if (!tagName) tagName = Stanza.tagNameDefault;
    if (!this.containerHTML || tagName !== Stanza.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = Stanza.tagNameDefault, clone = false) {
    this.buildSingleComponentsHTML();
    this.buildContainerHTML();
    return this.toHTML(tagName, clone);
  }

  /**
   * @param {string} type 
   */
  setType(type) {
    this.initData();
    this.data.type = type;
  }

  getType() {
    return this.data.type;
  }

  /**
   * Genera il JSON come oggetto
   * @returns {Object|null}
   */
  toJSONObject() {
    if (!this.data) return null;

    const obj = {
      type: this.data.type,
      id: this.data.id,
    };

    if (this.data.assegnata) obj.assegnata = this.data.assegnata;
    if (Array.isArray(this.data.righe_accordi) && this.data.righe_accordi.length > 0) {
      obj.righe_accordi = this.data.righe_accordi
        .map(r => r?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }

    if (Array.isArray(this.data.righe_testo) && this.data.righe_testo.length > 0) {
      obj.righe_testo = this.data.righe_testo
        .map(r => r?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }

    if (Array.isArray(this.data.righe_assegnate) && this.data.righe_assegnate.length > 0) {
      obj.righe_assegnate = this.data.righe_assegnate
        .map(r => ({ ref_riga: r.ref_riga, assegnata: r.assegnata }));
    }

    if (Array.isArray(this.data.seconde_voci) && this.data.seconde_voci.length > 0) {
      obj.seconde_voci = this.data.seconde_voci
        .map(v => v?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }

    if (this.data.moltiplicatore?.toJSONObject) {
      obj.moltiplicatore = this.data.moltiplicatore.toJSONObject();
    }

    if (this.data.breve?.toJSONObject) {
      obj.breve = this.data.breve.toJSONObject();
    }

    if (this.data.schema?.toJSONObject) {
      obj.schema = this.data.schema.toJSONObject();
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
   * @returns {Stanza}
   */
  clone() {
    return new Stanza(this.toJSONObject());
  }

  /**
   * Costruisce un oggetto di classe Stanza da un file json
   * @param {JSON} filepath file json
   * @returns {Stanza} Stanza
   */
  static async loadFromFile(filepath) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error("Errore fetch stanza");
      const json = await response.json();
      return new Stanza(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento della stanza:", err);
    }
  }
}

export { Stanza };
