import Ajv from "https://esm.sh/ajv@8";
import { camelToKebab, getSchema } from './config/utils.js';

class Accordo {

  static VALID_CHARS = /^[A-ZadmsuioØø#b/0-9()+°\-]+$/;
  static BASE_REGEX = /^(DO#?|REb?|RE#?|MIb?|MI|FA#?|SOLb?|SOL#?|LAb?|LA#?|SIb?|SI)/;
  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "span";

  constructor(json = null) {
    this.type = "accordo";
    this.data = json ? {
      base: json.base,
      extra: json.extra || {}
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
    this.schema = await (await fetch(getSchema("accordo"))).json();
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
   * Controlla se la stringa contiene un accordo valido
   * @param {String} accordo
   * @returns {Boolean}
   */
  static isValid(accordo) {
    if (typeof accordo !== "string" || !Accordo.VALID_CHARS.test(accordo)) {
      // throw new Error("Accordo non valido: contiene caratteri non ammessi");
      return false;
    }

    const matchBase = accordo.match(Accordo.BASE_REGEX);
    if (!matchBase) {
      // throw new Error("Accordo non valido: base non riconosciuta");
      return false;
    }
    return true;
  }

  /**
   * Costruisce un oggetto Accordo da una stringa
   * @param {String} accordo
   * @returns {Accordo} oggetto generato
   */
  fromString(accordo) {
    if (!Accordo.isValid(accordo)) throw new Error("Formato non valido");
    const matchBase = accordo.match(Accordo.BASE_REGEX);

    const base = matchBase[0];
    const rest = accordo.slice(base.length);

    // Parsing alterazione ed eventuale slash
    let alterazione = null;
    let slash = null;

    const slashIsPresent = rest.includes("/");
    if (slashIsPresent) {
      slash = {}
      alterazione = rest.split("/")[0] || null;
      const slashTemp = rest.split("/")[1];
      if (!isNaN(parseInt(slashTemp))) {
        slash.extra = parseInt(slashTemp);
      } else {
        slash.basso = slashTemp;
      }
    }
    else {
      alterazione = rest;
    }

    // Validazione finale
    const noteValide = ["DO", "DO#", "REb", "RE", "RE#", "MIb", "MI", "FA", "FA#", "SOLb", "SOL", "SOL#", "LAb", "LA", "LA#", "SIb", "SI"];
    if (!noteValide.includes(base)) {
      throw new Error(`Nota base non valida: ${base}`); // da gestire
    }

    if (slash?.basso && !noteValide.includes(slash.basso)) {
      throw new Error(`Nota al basso non valida: ${slash.basso}`); // da gestire
    }
    if (slash?.extra && (slash.extra < 0 || slash.extra > 13)) {
      throw new Error(`Nota slash non valida: ${slash.extra}`); // da gestire
    }

    this.data = {
      base,
      extra: {}
    };

    if (alterazione) {
      this.data.extra.alterazione = alterazione;
    }

    if (slash) {
      this.data.extra.slash = slash;
    }

    this.buildSingleComponentsHTML();

    return this;
  }

  /**
   * Crea le componenti HTML singole e le salva in this.componentsHTML
   */
  buildSingleComponentsHTML() {
    this.componentsHTML.base = document.createElement("span");
    this.componentsHTML.base.className = ["accordo-base","transpose-js"].join(' ');
    if (this.data?.base) {
      this.componentsHTML.base.textContent = this.data.base;
    }

    this.componentsHTML.alterazione = document.createElement("span");
    this.componentsHTML.alterazione.className = "alterazione";
    if (this.data?.extra.alterazione) {
      this.componentsHTML.alterazione.textContent = this.data.extra.alterazione;
    }

    const slash = document.createElement("span");
    if (this.data?.extra.slash) {
      if (this.data.extra.slash?.basso) {
        slash.className = ["accordo-basso","transpose-js"].join(' ');
        slash.textContent = this.data.extra.slash.basso;
      }
      else if (this.data.extra.slash?.extra !== undefined) {
        slash.textContent = this.data.extra.slash.extra;
      }
      this.componentsHTML.basso = slash;
    }
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
   * @returns {String} rappresentazione testuale dell'accordo
   */
  toString() {
    let result = this.data.base;

    if (this.data.extra.alterazione) {
      result += this.data.extra.alterazione;
    }

    if (this.data.extra.slash) {
      result += '/';
      result += this.data.extra.slash.basso || this.data.extra.slash.extra;
    }

    return result;
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = Accordo.tagNameDefault) {
    if (Object.keys(this.componentsHTML).length === 0) this.buildSingleComponentsHTML();
    const container = document.createElement(tagName);
    container.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi

    container.appendChild(this.componentsHTML.base);
    if (this.componentsHTML.alterazione) {
        container.appendChild(this.componentsHTML.alterazione);
    }
    if (this.componentsHTML.basso) {
        container.appendChild(document.createTextNode("/"));
        container.appendChild(this.componentsHTML.basso);
    }

    this.containerHTML = container;
  }

  /**
   * Costruisce e restituisce il blocco HTML dell'accordo
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = Accordo.tagNameDefault, clone = false) {
    if (!tagName) tagName = Accordo.tagNameDefault;
    if (!this.containerHTML || tagName !== Accordo.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = Accordo.tagNameDefault, clone = false) {
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
    let obj = { type: this.type };
    if (this.data) {
      obj.base = this.data.base;
      if (this.data.extra && this.data.extra instanceof Object && Object.keys(this.data.extra).length > 0) obj.extra = this.data.extra;
    }
    return obj;
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
   * @returns {Accordo}
   */
  clone() {
    return new Accordo(this.toJSONObject());
  }

  /**
   * Costruisce un oggetto di classe Accordo da un file json
   * @param {JSON} filepath file json
   * @returns {Accordo} accordo
   */
  static async loadFromFile(filepath) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error("Errore fetch");

      const json = await response.json();
      return new Accordo(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento dell'accordo:", err);
    }
  }
}

export { Accordo };
