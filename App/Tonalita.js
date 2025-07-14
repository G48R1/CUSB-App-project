import Ajv from "https://esm.sh/ajv@8";
import { camelToKebab, getSchema } from './config/utils.js';

class Tonalita {

  static REGEX = /^(DO#?|REb?|RE#?|MIb?|MI|FA#?|SOLb?|SOL#?|LAb?|LA#?|SIb?|SI)\s*(M|m)$/;
  static tonalitaBase = ["DO","REb","RE","MIb","MI","FA","FA#","SOL","LAb","LA","SIb","SI"]
  // static tonalita_cast = [0,1,0,1,0,1,0,0,1,0,1,0]  // 0=#, 1=b
  static tonalitaDiesis = ["DO","DO#","RE","RE#","MI","FA","FA#","SOL","SOL#","LA","LA#","SI"]
  static tonalitaBemolle = ["DO","REb","RE","MIb","MI","FA","SOLb","SOL","LAb","LA","SIb","SI"]

  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "span";

  constructor(json = null) {
    this.type = "tonalita";
    this.data = json ? {
      tono: json.tono,
      modo : json.modo,
    } : null;
    this.componentsHTML = {};
    this.containerHTML = null;
    this.containerClassList = new Set();

    this.buildSingleComponentsHTML();
  }

  /**
   * Carica il file JSON-schema
   * @returns {Object}
   */
  static async loadSchema() {
    this.schema = await (await fetch(getSchema("tonalita"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente un accordo sulla base di un JSON-schema
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
   * Controlla se la stringa contiene una tonalità valida
   * @param {string} tonalita
   * @returns {boolean}
   */
  static isValid(tonalita) {
    if (typeof tonalita !== "string" || !Tonalita.REGEX.test(tonalita)) {
      // throw new Error("Formato tonalità non valido"); // da gestire
      return false;
    }
    return true;
  }

  getTono() { return this.data.tono; }
  getTonoHTML() { return this.componentsHTML.tono; }
  getModo() { return this.data.modo; }
  getModoHTML() { return this.componentsHTML.modo; }

  /**
   * Imposta la tonalità
   * @param {string} tono 
   * @param {string} modo 
   */
  setTonalita(tono, modo) {
    if (Tonalita.isValid(tono+modo)) {
      this.data = {
        tono : tono,
        modo : modo
      }
      return;
    }
    console.warn("Formato di tono o modo errati");
  }

  /**
   * Calcola la distanza in semitoni tra due tonalità
   * @param {Tonalita} tonality1
   * @param {Tonalita} tonality2
   * @returns {number} tonality2 - tonality1 (in semitoni)
   */
  static calculateInterval(tonality1, tonality2) {
    if (tonality1.getModo() !== tonality2.getModo()) {
      console.warn("Impossibile calcolare l'intervallo se le tonalità non hanno stesso modo.");
      return;
    }
    let toneIndex1 = Tonalita.tonalitaBase.findIndex(t => t === tonality1.getTono());
    if (toneIndex1 === -1) toneIndex1 = Tonalita.tonalitaDiesis.findIndex(t => t === tonality1.getTono());
    if (toneIndex1 === -1) toneIndex1 = Tonalita.tonalitaBemolle.findIndex(t => t === tonality1.getTono());
    if (toneIndex1 === -1) return;
    let toneIndex2 = Tonalita.tonalitaBase.findIndex(t => t === tonality2.getTono());
    if (toneIndex2 === -1) toneIndex2 = Tonalita.tonalitaDiesis.findIndex(t => t === tonality2.getTono());
    if (toneIndex2 === -1) toneIndex2 = Tonalita.tonalitaBemolle.findIndex(t => t === tonality2.getTono());
    if (toneIndex2 === -1) return;

    return toneIndex2 - toneIndex1;
  }

  /**
   * Calcola la distanza in semitoni da un'altra tonalità.
   * Se positiva allora la tonalità passata come argomento è più alta di questa
   * @param {Tonalita} tonalita
   * @returns {number} tonalita - this (in semitoni)
   */
  interval(tonalita) {
    if (this.getModo() !== tonalita.getModo()) {
      console.warn("Impossibile calcolare l'intervallo se le tonalità non hanno stesso modo.");
      return;
    }
    let thisToneIndex = Tonalita.tonalitaBase.findIndex(t => t === this.getTono());
    if (thisToneIndex === -1) thisToneIndex = Tonalita.tonalitaDiesis.findIndex(t => t === this.getTono());
    if (thisToneIndex === -1) thisToneIndex = Tonalita.tonalitaBemolle.findIndex(t => t === this.getTono());
    if (thisToneIndex === -1) return;
    let otherToneIndex = Tonalita.tonalitaBase.findIndex(t => t === tonalita.getTono());
    if (otherToneIndex === -1) otherToneIndex = Tonalita.tonalitaDiesis.findIndex(t => t === tonalita.getTono());
    if (otherToneIndex === -1) otherToneIndex = Tonalita.tonalitaBemolle.findIndex(t => t === tonalita.getTono());
    if (otherToneIndex === -1) return;

    return otherToneIndex - thisToneIndex;
  }

  /**
   * Costruisce un oggetto Tonalita da una stringa
   * Formato atteso: <Tono><Modo>
   * @param {string} commento
   * @returns {Tonalita} oggetto generato
   */
  fromString(tonalita) {
    const match = tonalita.match(Tonalita.REGEX);

    if (!match) {
      throw new Error("Formato tonalità non valido"); // da gestire
    }

    const [, tono, modo] = match;

    this.data = {
      tono : tono,
      modo : modo
    }

    this.buildSingleComponentsHTML();

    return this;
  }

  /**
   * Crea le componenti HTML singole e le salva in this.componentsHTML
   */
  buildSingleComponentsHTML() {
    const tono = document.createElement("span");
    tono.className = "tono";
    if (this.data?.tono) {
      tono.textContent = this.data.tono;
    }
    this.componentsHTML.tono = tono;

    const modo = document.createElement("span");
    modo.className = "modo";
    if (this.data?.modo) {
      modo.textContent = this.data.modo;
    }
    this.componentsHTML.modo = modo;
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
    const elt = this.componentsHTML[target];
    if (elt instanceof HTMLElement) {
      elt.classList.add(classe);
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
   * @returns {string} rappresentazione testuale del commento
   */
  toString() {
    return `${this.data.tono}${this.data.modo}`;
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = Tonalita.tagNameDefault) {
    if (Object.keys(this.componentsHTML).length === 0) this.buildSingleComponentsHTML();
    const container = document.createElement(tagName);
    container.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi

    container.appendChild(this.componentsHTML.tono);
    container.appendChild(this.componentsHTML.modo);

    this.containerHTML = container;
  }

  /**
   * Costruisce e restituisce il blocco HTML della tonalita
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = Tonalita.tagNameDefault, clone = false) {
    if (!tagName) tagName = Tonalita.tagNameDefault;
    if (!this.containerHTML || tagName !== Tonalita.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = Tonalita.tagNameDefault, clone = false) {
    this.buildSingleComponentsHTML();
    this.buildContainerHTML();
    return this.toHTML(tagName, clone);
  }

  /**
   * @param {String} type 
   */
  setType(type) {
    this.type = type;
  }

  /**
   * Genera il JSON
   * @returns {JSON}
   */
  toJSONObject() {
    return {
      type: this.type,
      ...this.data
    };
  }

  /**
   * Genera il JSON (come stringa)
   * @returns {String}
   */
  toJSON() {
    return JSON.stringify(this.toJSONObject(),null,2);
  }

  /**
   * Restituisce una copia dell'oggetto
   * @returns {Tonalita}
   */
  clone() {
    return new Tonalita(this.toJSONObject());
  }

  /**
   * Costruisce un oggetto di classe Tonalita da un file json
   * @param {JSON} filepath file json
   * @returns {Tonalita} tonalità
   */
  static async loadFromFile(filepath) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error("Errore fetch");

      const json = await response.json();
      return new Tonalita(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento della tonalità:", err);
    }
  }
}

export { Tonalita };
