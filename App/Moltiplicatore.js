import Ajv from "https://esm.sh/ajv@8";
import { Commento } from './Commento.js';

class Moltiplicatore {
  static _ajv = new Ajv();
  static _validate = null;

  constructor(json = null) {
    this.type = "moltiplicatore";
    this.data = json ? {
      moltiplicatore : new Commento(json.moltiplicatore),
      start : json.start,
      end : json.end
    } : null;
  }

  /**
   * Costruisce un oggetto Moltiplicatore da una stringa
   * @param {string} moltiplicatore
   * @param {number} start
   * @param {number} end
   * @returns {Moltiplicatore}
   */
  fromString(moltiplicatore, start, end) {
    this.data = {
      moltiplicatore : new Commento().fromString(moltiplicatore),
      start : start,
      end : end
    };
    return this;
  }
  /**
   * Carica il file JSON-schema
   */
  static async loadSchema() {
    this.schema = await (await fetch(getSchema("moltiplicatore"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente un moltiplicatore sulla base di un JSON-schema
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
}

export { Moltiplicatore }