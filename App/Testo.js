import { camelToKebab } from './config/utils.js';

class Testo {
  static tagNameDefault = "span";

  constructor(json) {
    this.type = "testo";
    this.data = {
      testo : json?.testo || ""
    }
    this.containerHTML = null;
    this.containerClassList = new Set();
  }

  /**
   * Costruisce un oggetto Testo da una stringa
   * @param {String} testo
   * @returns {Testo} oggetto generato
   */
  fromString(testo) {
    this.data = {
      testo : testo
    };
    return this;
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
    return this.data.testo;
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = Testo.tagNameDefault) {
    const container = document.createElement(tagName);
    container.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi
    container.textContent = this.data.testo;

    this.containerHTML = container;
  }

  /**
   * Costruisce e restituisce il blocco HTML del testo
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = Testo.tagNameDefault, clone = false) {
    if (!tagName) tagName = Testo.tagNameDefault;
    if (!this.containerHTML || tagName !== Testo.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = Testo.tagNameDefault, clone = false) {
    this.buildSingleComponentsHTML();
    this.buildContainerHTML();
    return this.toHTML(tagName, clone);
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
   * @returns {Testo}
   */
  copy() {
    const newObj = new Testo({
      testo: this.data.testo
    });
    newObj.containerClassList = new Set([...this.containerClassList]);
    newObj.containerHTML = null;
    return newObj;
  }

  /**
   * Restituisce una copia dell'oggetto
   * @returns {Testo}
   */
  clone() {
    return new Testo(this.toJSONObject());
  }
}

export { Testo };
