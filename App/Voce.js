import Ajv from "https://esm.sh/ajv@8";
import { RigaVoce } from './RigaVoce.js';
import { camelToKebab, getSchema } from './config/utils.js';

class Voce {

  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "span";

  constructor(json = null) {
    this.type = "voce";
    this.data = json ? {
      registro : json.registro || null,
      voce : json.voce || null,
      assegnata : json.assegnata || null,
      pentagramma : json.pentagramma || null
    } : null;
    if (this.data) {
      this.data.righe_testo = json.righe_testo.map(riga => (
        {
          ref_riga : riga.ref_riga,
          testo : new RigaVoce(riga.testo, this.data.registro, this.data.voce, this.data.assegnata)
        })
      );
    }
    this.index = 0;
    this.componentsHTML = new Map();
    this.containerHTML = null;
    this.containerClassList = new Set();

    this.buildSingleComponentsHTML();
  }

  /**
   * Carica il file JSON-schema
   * @returns {Object}
   */
  static async loadSchema() {
    this.schema = await (await fetch(getSchema("voce-unico"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente una voce sulla base di un JSON-schema
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

  setRegistro(registro = null) {
    if (!this.data) this.data = {};
    this.data.registro = registro;
  }
  setVoce(voce = null) {
    if (!this.data) this.data = {};
    this.data.voce = voce;
  }
  setAssegnata(assegnata = null) {
    if (!this.data) this.data = {};
    this.data.assegnata = assegnata;
  }
  setPentagramma(pentagramma = null) {
    if (!this.data) this.data = {};
    this.data.pentagramma = pentagramma;
  }
  initData() {
    if (!this.data) {this.setRegistro(); this.setVoce(); this.setAssegnata(); this.setPentagramma();};
  }

  /**
   * Aggiorna le classi di tutte le righe di voce
   */
  updateRighe() {
    if (this.data.righe_testo) {
      for (const riga of this.data.righe_testo) {
        this.updateRiga(riga);
        riga.testo.buildSingleComponentsHTML();
      }
    }
    this.buildSingleComponentsHTML();
  }

  /**
   * Aggiorna le classi di un oggetto RigaVoce con quelle di questo oggetto
   * @param {RigaVoce} riga
   */
  updateRiga(riga) {
    riga.setClassList([this.data.registro, this.data.voce, this.data.assegnata].filter(Boolean));
    riga.buildSingleComponentsHTML();
  }

  /**
   * Costruisce un oggetto Voce da una lista di coppie (Number,RigaVoce)
   * @param {List<Object>} righeVoce
   * @returns {Voce} oggetto generato
   */
  setRighe(righeVoce = []) {
    if (!this.data) this.initData();
    this.data.righe_testo = righeVoce;
    return this;
  }

  /**
   * Costruisce un oggetto Voce da una Map di oggetti RigaVoce indicizzati dal riferimento di riga
   * @param {Map<number,string>} righeVoce
   * @returns {Voce} oggetto generato
   */
  fromMapString(righeVoce) {
    if (!this.data || !this.data.righe_testo) this.setRighe();
    for (const [key, value] of righeVoce.entries()) {
      this.addRigaVoceAsString(key, value);
    }
    return this;
  }

  /**
   * Costruisce una coppia (Number,RigaVoce) da una coppia (Number,String) e la aggiunge alla mappa
   * @param {number} ref_riga
   * @param {string} riga
   */
  addRigaVoceAsString(ref_riga, riga, overwrite = false) {
    if (!this.data || !this.data.righe_testo) this.setRighe();
    const rigaVoce = new RigaVoce().fromString(riga, this.data.registro, this.data.voce, this.data.assegnata);
    this.addRigaVoce(ref_riga, rigaVoce, overwrite);
  }

  /**
   * Aggiunge una coppia (Number,RigaVoce) alla mappa
   * @param {number} ref_riga 
   * @param {RigaVoce} rigaVoce 
   * @param {boolean} overwrite 
   */
  addRigaVoce(ref_riga, rigaVoce, overwrite = false) {
    if (!this.data || !this.data.righe_testo) this.setRighe();

    this.updateRiga(rigaVoce);
    const index = this.data.righe_testo.findIndex(r => r.ref_riga === ref_riga);

    if (index !== -1) {
      if (overwrite) {
        this.data.righe_testo[index].testo = rigaVoce;
      } else {
        console.warn(`⚠️ ref_riga ${ref_riga} già presente. Riga non aggiunta.`);
        return;
      }
    } else {
      this.data.righe_testo.push({ ref_riga: ref_riga, testo: rigaVoce });
    }

    this.buildSingleComponentsHTML();
  }

  /**
   * Crea le componenti HTML singole e le salva in this.componentsHTML
   */
  buildSingleComponentsHTML() {
    if (!this.data) return;

    this.componentsHTML = new Map();

    for (const blocco of this.data.righe_testo) {
      const html = blocco.testo.toHTML();
      this.componentsHTML.set(blocco.ref_riga, html);
    }
  }

  /**
   * Restituisce una coppia ref_riga, riga voce (utile per restituirle in ordine)
   * @returns { {ref_riga : number, testo : RigaVoce} }
   */
  nextCouple() {
    if (this.data && this.data.righe_testo && this.index < this.data.righe_testo.length) return this.data.righe_testo[this.index++];
    return null;
  }

  /**
   * Restituisce una riga voce (utile per restituirle in ordine)
   * @returns {RigaVoce}
   */
  next() {
    return this.nextCouple()?.testo || null;
  }

  resetIndex() {
    this.index = 0;
  }

  /**
   * Trova una riga voce dato un riferimento di riga
   * @param {number} ref
   * @returns {RigaVoce}
   */
  getRigaVoce(ref) {
    if (!this.data || !this.data.righe_testo) return null;

    const found = this.data.righe_testo.find(r => r.ref_riga === ref);
    return found ? found.testo : null;
  }

  /**
   * Restituisce una RigaVoce (HTML) dato un riferimento di riga
   * @param {number} ref
   * @returns {HTMLElement}
   */
  getByRefHTML(ref) {
    return this.componentsHTML.get(ref) || null;
  }

  /**
   * Aggiunge una classe a una singola componente target HTML
   * @param {string} classe classe da aggiungere
   * @param {string | number} target componente target (se Number : riferimento riga)
   */
  addClass(classe, target = "container") {
    if (target === "container") {
      this.containerClassList.add(classe);
      return;
    }
    const elt = this.componentsHTML.get(target);
    if (elt instanceof HTMLElement) {
      elt.classList.add(classe);
    }
  }

  /**
   * Sostituisce l'intera lista this.containerClassList con quella fornita
   * @param {Set|Array<String>} classList nuova lista di classi (CSS) per il container
   */
  setClassList(classList) {
    this.containerClassList = classList instanceof Set ? classList : new Set(classList);
  }

  /**
   * Ritorna la rappresentazione testuale della riga
   * @returns {string}
   */
  toString() {
    return this.data.righe_testo.map(elt => elt.testo.toString()).join("\n");
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = Voce.tagNameDefault) {
    if (!(this.componentsHTML instanceof Map) || this.componentsHTML.size === 0) this.buildSingleComponentsHTML();

    const container = document.createElement(tagName);
    container.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi

    for (const component of this.componentsHTML.values()) {
      container.appendChild(component);
      container.appendChild(document.createElement("br"));
    }

    this.containerHTML = container;
  }

  /**
   * Costruisce e restituisce il blocco HTML della voce
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = Voce.tagNameDefault, clone = false) {
    if (!tagName) tagName = Voce.tagNameDefault;
    if (!this.containerHTML || tagName !== Voce.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = Voce.tagNameDefault, clone = false) {
    this.buildSingleComponentsHTML();
    this.buildContainerHTML();
    return this.toHTML(tagName, clone);
  }

  /**
   * @param {string} type 
   */
  setType(type) {
    this.type = type;
  }

  /**
   * Genera il JSON
   * @returns {JSON}
   */
  toJSONObject() {
    if (!this.data) return null;

    const obj = {
      type: this.type
    };

    if (this.data.registro) obj.registro = this.data.registro;
    if (this.data.voce) obj.voce = this.data.voce;
    if (this.data.assegnata) obj.assegnata = this.data.assegnata;
    if (this.data.righe_testo) {
      obj.righe_testo = this.data.righe_testo
        ?.map(riga => {
          if (typeof riga?.testo?.toJSONObject === "function") {
            return {
              ref_riga: riga.ref_riga,
              testo: riga.testo.toJSONObject()
            };
          }
          return null;
        })
        .filter(Boolean)
    }
    if (this.data.pentagramma) obj.pentagramma = this.data.pentagramma;

    return obj;
  }

  /**
   * Genera il JSON (come stringa)
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify(this.toJSONObject(), null, 2);
  }

  /**
   * Restituisce una copia dell'oggetto
   * @returns {Voce}
   */
  clone() {
    return new Voce(this.toJSONObject());
  }

  /**
   * Costruisce un oggetto di classe Voce da un file json
   * @param {JSON} filepath file json
   * @returns {Voce} voce
   */
  static async loadFromFile(filepath) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error("Errore fetch");

      const json = await response.json();
      return new Voce(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento della voce:", err);
    }
  }
}

export { Voce }