import Ajv from "https://esm.sh/ajv@8";
import { camelToKebab, getSchema } from './config/utils.js';

class StrutturaStanza {

  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;

  constructor(json = null) {
    this.type = "struttura-stanza";
    this.data = json ? {
      schema : json.schema.map(comp => (
        {
          componente : comp.componente,
          posizione : comp.posizione
        }
      ))
    } : null;
    this.indexIn = {
      testo: 0,
      accordi: 0
    };
    this.indexOut = 0;
  }

  /**
   * Aggiunge una nuova coppia componente, posizione
   * @param {string} componente 
   * @param {number} posizione 
   */
  addComponenteByRef(componente, posizione) {
    if (!this.data) { this.data = {}; this.data.schema = []; }
    this.data.schema.push({ componente : componente, posizione : posizione });
  }

  /**
   * Aggiunge una nuova coppia componente, posizione (calcolata automaticamente)
   * @param {string} componente 
   */
  addComponente(componente) {
    if (!this.data) { this.data = {}; this.data.schema = []; }
    this.data.schema.push({ componente : componente, posizione : this.indexIn[componente]++ });
  }

  /**
   * @returns {Array<{ componente: string, posizione: number }>}
   */
  getSchema() {
    return this.data?.schema ?? [];
  }

  /**
   * Carica il file JSON-schema
   * @returns {Object}
   */
  static async loadSchema() {
    this.schema = await (await fetch(getSchema("struttura-stanza"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente una struttura stanza sulla base di un JSON-schema
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
   * @param {JSON} schema 
   */
  setSchema(schema) {
    this.data = {
      schema : schema.schema.map(comp => (
        {
          componente : comp.componente,
          posizione : comp.posizione
        }
      ))
    };
  }

  /**
   * @param {Map<string, number>} schema 
   */
  setSchemaFromMap(schema) {
    this.data = {
      schema: Array.from(schema.entries()).map(([key, value]) => ({
        componente: key,
        posizione: value
      }))
    };
  }

  /**
   * Restituisce il prossimo elemento dello schema, oppure null se ha finito
   * @returns {{ componente: string, posizione: number } | null}
   */
  next() {
    if (this.data && this.data.schema && this.indexOut < this.data.schema.length) return this.data.schema[this.indexOut++];
    return null;
  }

  resetIndexIn() {
    this.indexIn = {
      testo: 0,
      accordi: 0
    };
  }

  resetIndexOut() {
    this.indexOut = 0;
  }

  /**
   * Genera il JSON come oggetto
   * @returns {Object|null}
   */
  toJSONObject() {
    if (!this.data) return null;

    const obj = {
      type: this.type,
    };
    if (this.data.schema) {
      obj.schema = this.data.schema
        ?.map(riga => ({
          componente: riga.componente,
          posizione: riga.posizione
        }))
        .filter(Boolean)
    }
    return obj;
  }

  /**
   * Genera il JSON come stringa
   * @returns {String}
   */
  toJSON() {
    return JSON.stringify(this.toJSONObject(), null, 2);
  }

  /**
   * Restituisce una copia dell'oggetto
   * @returns {StrutturaStanza}
   */
  clone() {
    return new StrutturaStanza(this.toJSONObject());
  }
}

export { StrutturaStanza }