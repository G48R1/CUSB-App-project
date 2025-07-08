import Ajv from "https://esm.sh/ajv@8";
import { camelToKebab, getSchema } from './config/utils.js';

class Commento {

  static SEPARATORI_SIMMETRICI = {
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">"
  };
  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "span";

  constructor(json = null) {
    this.type = "commento";
    this.data = json ? {
      contenuto: json.contenuto,
      sep_ext_sx : json.sep_ext_sx || '',
      sep_ext_dx : json.sep_ext_dx || ''
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
    this.schema = await (await fetch(getSchema("commento"))).json();
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
   * Controlla se la stringa contiene un commento valido
   * Formato atteso: <sep_ext_sx><contenuto><sep_ext_dx>
   * con:
   * sep_ext_sx = sep_ext_dx (simmetrici)
   * N.B. in realtà la classe accetta qualsiasi formato perché di default
   * i delimitatori esterni sono facoltativi
   * @param {String} commento
   * @returns {Boolean}
   */
  static isValid(commento) {
    if (typeof commento !== 'string' || commento.length < 2) return false;

    const sinistro = Commento.readLeadingSeparators(commento);
    const destro = Commento.readTrailingSeparators(commento);

    if (!sinistro || !destro) return false;

    const expectedDestro = Commento.getSymmetricSeparator(sinistro);
    if (expectedDestro !== destro) return false;

    return true;
  }

  /**
   * Controlla se il commento è di tipo moltiplicatore
   * @param {String} commento 
   * @returns 
   */
  static isMoltiplicatore(commento) {
    return Commento.isValid(commento) && (commento.includes("x") || commento.includes("×")) && commento.match(/0-9/);
  }

  /**
   * Estrae il separatore iniziale da una stringa
   * @param {string} str
   * @returns {string}
   */
  static readLeadingSeparators(str) {
    let sep = '';
    for (let i=0; i<str.length; i++) {
      const ch = str[i];
      if (/[\w\s.,;àèéìòù']/.test(ch)) break;
      sep += ch;
    }
    return sep.length ? sep : null;
  }

  /**
   * Estrae il separatore finale da una stringa
   * @param {string} str
   * @returns {string}
   */
  static readTrailingSeparators(str) {
    let sep = '';
    for (let i=str.length - 1; i>=0; i--) {
      const ch = str[i];
      if (/[\w\s.,;àèéìòù']/.test(ch)) break;
      sep = ch + sep;
    }
    return sep.length ? sep : null;
  }

  /**
   * Costruisce il separatore destro simmetrico
   * @param {string} sepSinistro
   * @returns {string}
   */
  static getSymmetricSeparator(sepSinistro) {
    let result = '';
    for (let i=sepSinistro.length - 1; i>=0; i--) {
      const ch = sepSinistro[i];
      const closing = Commento.SEPARATORI_SIMMETRICI[ch] || ch;
      if (!closing) return null;
      result += closing;
    }
    return result;
  }

  /**
   * Costruisce un oggetto Commento da una stringa
   * Formato atteso: <sep_ext_sx><contenuto><sep_ext_dx>
   * @param {String} commento
   * @returns {Commento} oggetto generato
   */
  fromString(commento) {
    const regex = /^([^\w\s]+)?(.+?)([^\w\s]+)?$/;
    const match = commento.match(regex);

    if (!match) {
      throw new Error("Formato commento non valido"); // da gestire
    }

    const [, sep_ext_sx = '', contenuto, sep_ext_dx = ''] = match;

    this.data = {
      contenuto : contenuto.replace(/\s/g,"\u00A0"), //.trim()
      sep_ext_sx : sep_ext_sx || '',
      sep_ext_dx : sep_ext_dx || ''
    }

    this.buildSingleComponentsHTML();

    return this;
  }

  /**
   * Crea le componenti HTML singole e le salva in this.componentsHTML
   */
  buildSingleComponentsHTML() {
    const sx = document.createElement("span");
    sx.className = ["sep", "sx"].join(' ');
    if (this.data?.sep_ext_sx) {
      sx.textContent = this.data.sep_ext_sx;
    }
    this.componentsHTML.sep_ext_sx = sx;

    const contenuto = document.createElement("span");
    contenuto.className = "commento-contenuto";
    if (this.data?.contenuto) {
      contenuto.textContent = this.data.contenuto;
    }
    this.componentsHTML.contenuto = contenuto;

    const dx = document.createElement("span");
    dx.className = ["sep", "dx"].join(' ');
    if (this.data?.sep_ext_dx) {
      dx.textContent = this.data.sep_ext_dx;
    }
    this.componentsHTML.sep_ext_dx = dx;
  }

  /**
   * Aggiunge una classe a una singola componente target HTML
   * utilizzabile da codice, non da editor
   * @param {String} classe classe da aggiungere
   * @param {String} target componente target
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
   * @param {Set|Array<String>} classList nuova lista di classi (CSS) per il container
   */
  setClassList(classList) {
    this.containerClassList = classList instanceof Set ? classList : new Set(classList);
  }

  /**
   * @returns {String} rappresentazione testuale del commento
   */
  toString() {
    return this.data.sep_ext_sx + this.data.contenuto + this.data.sep_ext_dx;
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = Commento.tagNameDefault) {
    if (Object.keys(this.componentsHTML).length === 0) this.buildSingleComponentsHTML();
    const container = document.createElement(tagName);
    container.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi

    if (this.componentsHTML.sep_ext_sx) {
      container.appendChild(this.componentsHTML.sep_ext_sx);
    }

    container.appendChild(this.componentsHTML.contenuto);

    if (this.componentsHTML.sep_ext_dx) {
      container.appendChild(this.componentsHTML.sep_ext_dx);
    }

    this.containerHTML = container;
  }

  /**
   * Costruisce e restituisce il blocco HTML del commento
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = Commento.tagNameDefault, clone = false) {
    if (!tagName) tagName = Commento.tagNameDefault;
    if (!this.containerHTML || tagName !== Commento.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = Commento.tagNameDefault, clone = false) {
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
   * Genera una copia dell'oggetto
   * @returns {Commento}
   */
  copy() {
    const newObj = new Commento({
      contenuto: this.data?.contenuto,
      sep_ext_sx: this.data?.sep_ext_sx,
      sep_ext_dx: this.data?.sep_ext_dx
    });
    newObj.containerClassList = new Set([...this.containerClassList]);
    newObj.componentsHTML = {};  // verrà ricostruito da buildSingleComponentsHTML
    newObj.containerHTML = null;
    newObj.buildSingleComponentsHTML();
    return newObj;
  }

  /**
   * Restituisce una copia dell'oggetto
   * @returns {Commento}
   */
  clone() {
    return new Commento(this.toJSONObject());
  }

  /**
   * Costruisce un oggetto di classe Commento da un file json
   * @param {JSON} filepath file json
   * @returns {Commento} commento
   */
  static async loadFromFile(filepath) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error("Errore fetch");

      const json = await response.json();
      return new Commento(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento del commento:", err);
    }
  }
}

export { Commento };
