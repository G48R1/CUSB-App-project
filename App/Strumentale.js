import Ajv from "https://esm.sh/ajv@8";
import { RigaAccordi } from './RigaAccordi.js';
import { Commento } from './Commento.js';
import { camelToKebab, getSchema } from './config/utils.js';

class Strumentale {

  static REGEX = /^(?:(\w+)\s*:)?(\s*.+?\s*)([^\w\s]\s*[x×X]?\s*\d+[x×X]?\s*[^\w\s])?$/;
  static REGEX_WITH_LABEL = /^(?:(\w+)\s*:)(\s*.+?\s*)([^\w\s]\s*[x×X]?\s*\d+[x×X]?\s*[^\w\s])?$/;
  // static REGEX = /^(?:(\w+):)?([\s\S]*?)([^\w\s][xX×]\d+[^\w\s])?$/;
  static validSubtype = ["strumentale", "intro", "outro"];
  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "div";

  constructor(json = null) {
    this.type = "strumentale";
    this.subtype = "strumentale";
    this.data = json ? {
      label : json.label || "",
      contenuto : new RigaAccordi(json.contenuto),
      moltiplicatore : json.moltiplicatore ? new Commento(json.moltiplicatore) : null
    } : null;
    this.commento = null;
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
    this.schema = await (await fetch(getSchema("strumentale-unico"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente una riga strumentale sulla base di un JSON-schema
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
   * Controlla se la stringa è una stringa valida come riga strumentale
   * @param {String} strumentale
   * @returns {Boolean}
   */
  static isValid(strumentale, mustHaveLabel = false) {
    const match = strumentale.match(mustHaveLabel ? Strumentale.REGEX_WITH_LABEL : Strumentale.REGEX);
    if (!match) return false;

    const contenuto = match[2]?.trim();
    return RigaAccordi.isValid(contenuto);
  }

  /**
   * Aggiunge un commento/appunto alla strofa
   * @param {string|Commento} commento 
   */
  addCommento(commento) {
    this.commento = commento instanceof Commento ? commento : new Commento().fromString(commento);
    this.commento.addClass("commento-strumentale");
  }

  removeCommento() {
    this.commento = null;
  }

  /**
   * Separa una stringa in token
   * @param {String} str
   * @returns {Object}
   */
  static splitIntoChunks(str) {
    const match = str.match(Strumentale.REGEX);
    if (!match) return [null, null, null];

    const label = match[1] || "";
    const contenuto = match[2];
    const moltiplicatore = match[3] ? match[3] : null;

    // console.log(contenuto);
    return [label, contenuto, moltiplicatore];
  }

  /**
   * Costruisce un oggetto Strumentale da una stringa
   * @param {String} strumentale
   * @returns {Strumentale} oggetto generato
   */
  fromString(strumentale) {
    if (!Strumentale.isValid(strumentale))  throw new Error("La riga non ha un formato valido come parte strumentale");

    const [label, contenuto, moltiplicatore] = Strumentale.splitIntoChunks(strumentale);
    // console.log(label);
    // console.log(contenuto);
    // console.log(moltiplicatore);

    this.data = {
      label,
      contenuto: new RigaAccordi().fromString(contenuto),
      moltiplicatore: moltiplicatore ? new Commento().fromString(moltiplicatore) : null
    };

    this.buildSingleComponentsHTML();

    return this;
  }

  /**
   * Crea le componenti HTML singole e le salva in this.componentsHTML
   */
  buildSingleComponentsHTML() {
    if (!this.data) return;

    const label = document.createElement("span");
    label.className = "label";
    const l = this.data.label || this.subtype;
    label.classList.add(l);
    label.textContent = l;
    this.componentsHTML.label = label;
    if (this.data.contenuto) {
      const contenuto = this.data.contenuto.toHTML();
      this.componentsHTML.contenuto = contenuto;
    }
    if (this.data.moltiplicatore) {
      this.data.moltiplicatore.addClass("moltiplicatore-riga");
      const moltiplicatore = this.data.moltiplicatore.toHTML();
      this.componentsHTML.moltiplicatore = moltiplicatore;
    }    
  }

  /**
   * Aggiunge una classe a una singola componente target HTML
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
   * Ritorna la rappresentazione testuale della riga
   * @returns {String}
   */
  toString() {
    let str = [];
    if (this.commento) str.push(this.commento.toString());
    str.push((this.data.label || this.subtype) + ":" + this.data.contenuto.toString() + (this.data.moltiplicatore ? + this.data.moltiplicatore?.toString() || "" : ""));
    return str.join('\n');
  }

  fromEditor(strumentaleObj) {
    if (strumentaleObj.subtype) this.setSubType(strumentaleObj.subtype);
    if (strumentaleObj.commento) this.addCommento(strumentaleObj.commento);
    if (strumentaleObj.contenuto) this.fromString(strumentaleObj.contenuto);

    this.buildSingleComponentsHTML();
  }

  /**
   * Restituisce in un oggetto la versione stringa della riga strumentale
   * @returns {object}
   */
  toEditor() {
    let obj = {
      type : this.subtype,
      commento : this.commento?.toString() || null,
      contenuto : (this.data.label || this.subtype) + ":" + this.data.contenuto.toString() + (this.data.moltiplicatore ? this.data.moltiplicatore?.toString() || "" : "")
    };
    return obj;
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = Strumentale.tagNameDefault) {
    if (Object.keys(this.componentsHTML).length === 0) this.buildSingleComponentsHTML();
    const container = document.createElement(tagName);
    container.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi

    if (this.commento) container.appendChild(this.commento.toHTML("div"));

    Object.values(this.componentsHTML).forEach(component => {
      container.appendChild(component);
    });
    this.containerHTML = container;
  }

  /**
   * Costruisce e restituisce il blocco HTML della riga strumentale
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = Strumentale.tagNameDefault, clone = false) {
    if (!tagName) tagName = Strumentale.tagNameDefault;
    if (!this.containerHTML || tagName !== Strumentale.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = Strumentale.tagNameDefault, clone = false) {
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
   * @param {String} type 
   */
  setSubType(type) {
    if (Strumentale.validSubtype.includes(type)) this.subtype = type;
    else console.warn(`Sottotipo '${type}' non valido. Scegliere tra ` + Strumentale.validSubtype.join(', '));
  }

  /**
   * Genera il JSON
   * @returns {JSON}
   */
  toJSONObject() {
    if (!this.data) return { type: this.type };

    const obj = {
      type: this.type
    };

    if (this.data.label) obj.label = this.data.label || this.subtype;
    if (this.data.contenuto) obj.contenuto = this.data.contenuto?.toJSONObject?.() ?? null;
    if (this.data.moltiplicatore) obj.moltiplicatore = this.data.moltiplicatore.toJSONObject?.() ?? null;

    return obj;
  }

  /**
   * Genera il JSON (come stringa)
   * @returns {String}
   */
  toJSON() {
    return JSON.stringify(this.toJSONObject(), null, 2);
  }

  /**
   * Restituisce una copia dell'oggetto
   * @returns {Strumentale}
   */
  clone() {
    return new Strumentale(this.toJSONObject());
  }

  /**
   * Costruisce un oggetto di classe Strumentale da un file json
   * @param {JSON} filepath file json
   * @returns {Strumentale} riga strumentale
   */
  static async loadFromFile(filepath) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error("Errore fetch");

      const json = await response.json();
      return new Strumentale(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento dello strumentale:", err);
    }
  }
}

export { Strumentale };
