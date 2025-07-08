import Ajv from "https://esm.sh/ajv@8";
import { Commento } from './Commento.js';
import { Testo } from './Testo.js';
import { camelToKebab, getSchema } from './config/utils.js';

class RigaTesto {

  static REGEX = /([^A-Za-zàèéìòù'0-9\s.,;]+[A-Za-zàèéìòù'0-9\s.,;]+[^A-Za-zàèéìòù'0-9\s.,;]+)|([A-Za-zàèéìòù'0-9\s.,;]+)/g;
  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "span";

  constructor(json = null) {
    this.type = "riga-testo";
    this.data = json ? {
      contenuto: json.contenuto.map(item => {
        if (item.type === "testo") return new Testo(item);
        if (item.type === "commento") return new Commento(item);
        throw new Error(`Tipo non supportato: ${item.type}`);
      }),
      commento: json.commento ? new Commento(json.commento) : null
    } : null;
    this.voci = [];
    this.componentsHTML = [];
    this.containerHTML = null;
    this.containerClassList = new Set();

    this.buildSingleComponentsHTML();
  }

  /**
   * Carica il file JSON-schema
   * @returns {Object}
   */
  static async loadSchema() {
    this.schema = await (await fetch(getSchema("riga-testo-unico"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente una riga di testo sulla base di un JSON-schema
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
   * Restituisce un oggetto di tipo Testo o di tipo Commento da una stringa
   * @param {String} chunkStr 
   * @returns {Testo | Commento}
   */
  static parseChunk(chunkStr) {
    if (Commento.isValid(chunkStr)) {
      return new Commento().fromString(chunkStr);
    }
    return new Testo().fromString(chunkStr);
  }

  /**
   * Separa una stringa in token
   * @param {String} str
   * @returns {Array<String>}
   */
  static splitIntoChunks(str) {
    const tokens = [];
    let match;

    while ((match = RigaTesto.REGEX.exec(str)) !== null) {
      if (match[2]) { // Testo alfanumerico: token
        tokens.push(match[2]);
      } else if (match[1]) { // Commento
        tokens.push(match[1]);
      }
    }

    // console.log(tokens);
    return tokens;
  }

  /**
   * Costruisce un oggetto RigaTesto da una stringa
   * @param {String} rigaTesto
   * @returns {RigaTesto} oggetto generato
   */
  fromString(rigaTesto) {
    this.data = {
      contenuto: [],
      commento: null
    };

    const tokens = RigaTesto.splitIntoChunks(rigaTesto);

    const parsedElements = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const parsed = RigaTesto.parseChunk(token);
      // console.log(parsed);
      parsedElements.push(parsed);
    }

    // salvo a parte l'ultimo commento
    if (parsedElements.length > 0) {
      const last = parsedElements[parsedElements.length - 1];
      if (last instanceof Commento) {
        this.data.commento = last;
        parsedElements.pop();
      }
    }

    this.data.contenuto = parsedElements;

    this.buildSingleComponentsHTML();
    return this;
  }

  /**
   * Aggiunge un oggetto RigaVoce alla lista di voci
   * @param {RigaVoce} voce 
   */
  addVoce(voce) {
    if (!voce || !voce.data) {
      throw new Error("Voce non valida o mancante del campo data");
    }
    this.voci.push(voce);
  }

  getVociByRegistro(registro) {
    return this.voci.filter(v => v?.data?.registro && v.data.registro === registro);
  }
  getVociByVoce(voce) {
    return this.voci.filter(v => v?.data?.voce && v.data.voce === voce);
  }
  getVociByAssegnata(assegnata) {
    return this.voci.filter(v => v?.data?.assegnata && v.data.assegnata === assegnata);
  }

  /**
   * Ordina this.voci in base al criterio specificato
   * @param {String} criteria - uno tra: "registro", "voce", "assegnata"
   */
  sortVociBy(criteria = "registro") {
    const validCriteria = ["registro", "voce", "assegnata"];
    if (!validCriteria.includes(criteria)) {
      console.warn(`❗️Criterio '${criteria}' non valido. Usa uno tra: ${validCriteria.join(", ")}`);
      return;
    }

    if (!Array.isArray(this.voci) || this.voci.length === 0) return;

    this.voci.sort((a, b) => {
      const valA = a?.data?.[criteria] ?? "";
      const valB = b?.data?.[criteria] ?? "";
      return valA.localeCompare(valB);
    });
  }

  /**
   * Crea le componenti HTML singole e le salva in this.componentsHTML
   */
  buildSingleComponentsHTML() {
    if (!this.data) return;

    this.componentsHTML = [];

    for (const blocco of this.data.contenuto) {
      const html = blocco.toHTML();
      this.componentsHTML.push(html);
    }
    if (this.data.commento) this.componentsHTML.push(this.data.commento.toHTML());
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
    let targetMapped = [];
    switch (target) {
      case "contenuto": targetMapped = ["testo"]; break;
      case "commenti": targetMapped = ["commento"]; break;
      case "commento": targetMapped = ["commento", "important"]; break;
      default: break;
    }
    
    for (const elt of this.componentsHTML) {
      if (elt instanceof HTMLElement) {
        if (targetMapped.every(t => elt.classList.contains(t))) elt.classList.add(classe);
      }
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
   * Ritorna la rappresentazione testuale della riga
   * @param {boolean} voci
   * @returns {string}
   */
  toString(voci = false) {
    let str = this.data.contenuto.map(elt => elt.toString()).join('');
    if (this.data.commento) str += ` ${this.data.commento.toString()}`;
    if (voci) this.voci.forEach(v => str += ' ' + v.toString());
    return str;
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = RigaTesto.tagNameDefault) {
    if (!this.componentsHTML || this.componentsHTML.length === 0) this.buildSingleComponentsHTML();
    const container = document.createElement(tagName);
    container.className = "riga-testo-e-voce";

    const containerRigaTesto = document.createElement("span");
    containerRigaTesto.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi

    for (const component of this.componentsHTML) {
      containerRigaTesto.appendChild(component);
    }
    container.appendChild(containerRigaTesto);

    if (this.type === "stanza-breve") {
      const puntini = document.createElement("span");
      puntini.innerText = "...";
      container.appendChild(puntini);
    }
    else {
      if (Array.isArray(this.voci) && this.voci.length > 0) {
        const containerVoci = document.createElement("span");
        containerVoci.className = "voci";
        for (const voce of this.voci) {
          containerVoci.appendChild(voce.toHTML());
        }
        container.appendChild(containerVoci);
      }
    }

    this.containerHTML = container;
  }

  /**
   * Costruisce e restituisce il blocco HTML della riga
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = RigaTesto.tagNameDefault, clone = false) {
    if (!tagName) tagName = RigaTesto.tagNameDefault;
    if (!this.containerHTML || tagName !== RigaTesto.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = RigaTesto.tagNameDefault, clone = false) {
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
   * @returns {Object|null}
   */
  toJSONObject() {
    if (!this.data) return null;

    const obj = {
      type: this.type
    };

    if (Array.isArray(this.data.contenuto)) {
      obj.contenuto = this.data.contenuto
        .map(item => item?.toJSONObject?.() ?? null)
        .filter(Boolean);
    }
    if (this.data.commento) obj.commento = this.data.commento?.toJSONObject?.();

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
   * Genera una copia dell'oggetto (senza seconde voci)
   * @returns {RigaTesto}
   */
  copy() {
    const newObj = new RigaTesto();

    newObj.type = this.type;
    newObj.data = {
      contenuto: Array.isArray(this.data.contenuto)
        ? this.data.contenuto.map(item => {
            if (item instanceof Testo) return item.copy();
            if (item instanceof Commento) return item.copy();
            throw new Error("Tipo contenuto non supportato in copy()");
          })
        : [],
      commento: this.data.commento?.copy() || null
    };
    newObj.voci = []; /*Array.isArray(this.voci)
      ? this.voci.map(v => typeof v.copy === "function" ? v.copy() : v)
      : [];*/
    newObj.componentsHTML = [];
    newObj.containerHTML = null;
    newObj.containerClassList = new Set([...this.containerClassList]);

    // newObj.buildSingleComponentsHTML();
    // newObj.buildContainerHTML();
    return newObj;
  }

  /**
   * Restituisce una copia dell'oggetto
   * @returns {RigaTesto}
   */
  clone() {
    return new RigaTesto(this.toJSONObject());
  }

  /**
   * Costruisce un oggetto di classe RigaTesto da un file json
   * @param {JSON} filepath file json
   * @returns {RigaTesto} riga testo
   */
  static async loadFromFile(filepath) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error("Errore fetch");

      const json = await response.json();
      return new RigaTesto(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento della riga testo:", err);
    }
  }
}

export { RigaTesto };
