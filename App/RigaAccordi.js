import Ajv from "https://esm.sh/ajv@8";
import { Accordo } from './Accordo.js';
import { Commento } from './Commento.js';
import { camelToKebab, getSchema } from './config/utils.js';

class RigaAccordi {

  static REGEX = /([ ⏝_]+)|([^\s⏝_]+)/g;
  static SEP_CHARS = /[ ⏝_]/;
  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;
  static tagNameDefault = "span";

  constructor(json = null) {
    this.type = "riga-accordi";
    this.data = json ? {
      contenuto : json.contenuto.map(item => {
        if (item.type === "accordo") return new Accordo(item);
        if (item.type === "commento") return new Commento(item);
        throw new Error(`Tipo non supportato: ${item.type}`);  // da gestire
      }) || [],
      spazi : json.spazi || []
    } : null;
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
    this.schema = await (await fetch(getSchema("riga-accordi-unico"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente una riga di accordi sulla base di un JSON-schema
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
   * Controlla se la stringa è una stringa valida come riga di accordi
   * @param {String} rigaAccordi
   * @returns {Boolean}
   */
  static isValid(rigaAccordi) {
    const { tokens, separators } = RigaAccordi.splitIntoChunks(rigaAccordi);
    return tokens.some(t => Accordo.isValid(t));
  }

  /**
   * Restituisce un oggetto di tipo Accordo o di tipo Commento da una stringa
   * @param {String} chunkStr 
   * @returns {Accordo | Commento}
   */
  static parseChunk(chunkStr) {
    if (Accordo.isValid(chunkStr)) return new Accordo().fromString(chunkStr);
    if (Commento.isValid(chunkStr)) return new Commento().fromString(chunkStr);
    return null;
  }

  /**
   * Separa una stringa in token, restituendo in un oggetto sia i token che i relativi separatori,
   * con allegata la quantità di ripetizioni
   * @param {String} str
   * @returns {Object}
   */
  static splitIntoChunks(str) {
    let match;
    const tokens = [];
    const separators = [];

    let expectingToken = true;

    while ((match = RigaAccordi.REGEX.exec(str)) !== null) {
      if (match[2]) {  // È un token di testo
        tokens.push(match[2]);
        expectingToken = false;
      } else if (match[1]) {  // È un separatore
        const sepChar = match[1][0];
        const count = match[1].length;
        separators.push([sepChar, count]);  // {sep: sepChar, qta: count}
        expectingToken = true;
      }
    }

    // Se la stringa inizia senza separatori, aggiungo ["", 0] in testa
    if (str && !RigaAccordi.SEP_CHARS.test(str[0])) {
      separators.unshift(["", 0]);
    }

    // console.log("Tokens:", tokens);
    // console.log("Separators:", separators);
    return { tokens, separators };
  }

  /**
   * Costruisce un oggetto RigaAccordi da una stringa
   * @param {String} rigaAccordi
   * @returns {RigaAccordi} oggetto generato
   */
  fromString(rigaAccordi) {
    if (!RigaAccordi.isValid(rigaAccordi)) throw new Error("La riga non presenta accordi");

    const { tokens, separators } = RigaAccordi.splitIntoChunks(rigaAccordi);
    // console.log("Tokens:", tokens);
    // console.log("Separators:", separators[1]);

    this.data = {
      contenuto: [],
      spazi: []
    };
    for (let i=0; i<tokens.length; i++) {
      let parsedElements = RigaAccordi.parseChunk(tokens[i]);
      if (parsedElements === null) {
        let found = false;
        let j = i+1;
        let possibleComment = tokens[i];
        while (j<tokens.length && !found) {
          possibleComment = possibleComment + separators[j][0] + tokens[j];
          parsedElements = RigaAccordi.parseChunk(possibleComment);
          if (parsedElements !== null) {
            found = true;
            i = j;
          }
          j++;
        }
      }
      this.data.contenuto.push(parsedElements);
      const sep = separators[i];
      this.data.spazi.push({ sep: sep[0], qta: sep[1] });
    }
    // se ci sono ulteriori spazi alla fine
    if (separators.length > tokens.length) {
      for (let i=tokens.length; i<separators.length; i++) {
        const sep = separators[i];
        this.data.spazi.push({ sep: sep[0], qta: sep[1] });
      }
    }

    this.buildSingleComponentsHTML();

    return this;
  }

  /**
   * Crea le componenti HTML singole e le salva in this.componentsHTML
   */
  buildSingleComponentsHTML() {
    if (!this.data) return;

    this.componentsHTML = [];

    for (let i=0; i<this.data.contenuto.length; i++) {
      if (this.data.spazi[i]) {
        const spazio = document.createElement("span");
        spazio.className = "spazio";
        const { sep, qta } = this.data.spazi[i];
        spazio.textContent = (sep !== " " ? sep : "\u00A0").repeat(qta);
        this.componentsHTML.push(spazio);
      }
      const blocco = this.data.contenuto[i];
      const html = blocco.toHTML();
      this.componentsHTML.push(html);
    }
    // se ci sono ulteriori spazi alla fine
    if (this.data.spazi.length > this.data.contenuto.length) {
      for (let i=this.data.contenuto.length; i<this.data.spazi.length; i++) {
        const last = document.createElement("span");
        last.className = "spazio";
        const { sep, qta } = this.data.spazi[i];
        last.textContent = (sep !== " " ? sep : "\u00A0").repeat(qta);
        this.componentsHTML.push(last);
      }
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
    let targetMapped = "";
    switch (target) {
      case "contenuto": targetMapped = "accordo"; break;
      case "spazi": targetMapped = "spazio"; break;
      default: break;
    }
    
    for (const elt of this.componentsHTML) {
      if (elt instanceof HTMLElement) {
        if (elt.classList.contains(targetMapped)) elt.classList.add(classe);
      }
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
    return this.data.contenuto.map((item, i) => {
      const str = item.toString();
      const spazioObj = this.data.spazi[i];
      const spazio = spazioObj ? spazioObj.sep.repeat(spazioObj.qta) : "";
      return spazio + str;
    }).join("");
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = RigaAccordi.tagNameDefault) {
    if (!this.componentsHTML || this.componentsHTML.length === 0) this.buildSingleComponentsHTML();
    const container = document.createElement(tagName);
    container.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi

    for (const component of this.componentsHTML) {
      container.appendChild(component);
    }

    this.containerHTML = container;
  }

  /**
   * Costruisce e restituisce il blocco HTML della riga di accordi
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement}
   */
  toHTML(tagName = RigaAccordi.tagNameDefault, clone = false) {
    if (!tagName) tagName = RigaAccordi.tagNameDefault;
    if (!this.containerHTML || tagName !== RigaAccordi.tagNameDefault) this.buildContainerHTML(tagName);
    if (!(this.containerHTML instanceof HTMLElement)) throw Error("L'elemento container non è un HTMLElement");
    return clone ? this.containerHTML.cloneNode(true) : this.containerHTML;
  }

  /**
   * Aggiorna l'HTML e lo restituisce (come toHTML ma con un rebuild forzato)
   * @param {string} tagName
   * @param {boolean} clone
   * @returns {HTMLElement} blocco HTML
   */
  update(tagName = RigaAccordi.tagNameDefault, clone = false) {
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
    if (!this.data) return null;

    const obj = {
      type: this.type
    };

    if (Array.isArray(this.data.contenuto)) {
      obj.contenuto = this.data.contenuto
        .map(item => item?.toJSONObject?.() ?? item)
        .filter(Boolean);
    }
    if (this.data.spazi) obj.spazi = this.data.spazi;

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
   * @returns {RigaAccordi}
   */
  clone() {
    return new RigaAccordi(this.toJSONObject());
  }

  /**
   * Costruisce un oggetto di classe RigaAccordi da un file json
   * @param {JSON} filepath file json
   * @returns {RigaAccordi} riga accordi
   */
  static async loadFromFile(filepath) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error("Errore fetch");

      const json = await response.json();
      return new RigaAccordi(json);
    } catch (err) {
      console.error("❌ Errore nel caricamento della riga accordi:", err);
    }
  }
}

export { RigaAccordi };
