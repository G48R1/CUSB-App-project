import Ajv from "https://esm.sh/ajv@8";
import { camelToKebab, getSchema } from './config/utils.js';
import { Commento } from "./Commento.js";
import { StrutturaStanza } from "./StrutturaStanza.js";

class StrutturaCanto {

  static schema = null;
  static _ajv = new Ajv();
  static _validate = null;

  constructor(json = null) {
    this.type = "struttura-canto";
    this.data = json ? {
      schema : json.schema.map(comp => (
        {
          componente : comp.componente,
          posizione : comp.posizione,
          schema : comp.schema ? new StrutturaStanza(comp.schema) : null,
          commento : comp.commento ? comp.commento : null,
          isBreve : comp.isBreve
        }
      ))
    } : null;
    this.indexIn = {
      intro : 0,
      strofa : 0,
      ritornello : 0,
      "pre-chorus" : 0,
      bridge : 0,
      strumentale : 0,
      outro : 0
    };
    this.indexOut = 0;
  }

  /**
   * Carica il file JSON-schema
   * @returns {Object}
   */
  static async loadSchema() {
    this.schema = await (await fetch(getSchema("struttura-canto-unico"))).json();
    return this.schema;
  }

  /**
   * Controlla la validità di un file JSON contenente una struttura canto sulla base di un JSON-schema
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
   * Aggiunge una nuova coppia componente, posizione
   * @param {string} componente
   * @param {number|string} posizione
   * @param {boolean} isBreve
   * @param {StrutturaStanza} schema
   * @param {string|Commento} commento
   */
  addComponenteByRef(componente, posizione, isBreve = false, schema = null, commento = null) {
    if (!this.data) { this.data = {}; this.data.schema = []; }
    this.data.schema.push({
      componente : componente,
      posizione : posizione,
      schema : schema,
      commento : commento instanceof Commento ? commento.toString() : commento,
      isBreve : isBreve
    });
  }

  /**
   * Aggiunge una nuova coppia componente, posizione (calcolata automaticamente)
   * @param {string} componente
   * @param {boolean} isBreve
   * @param {StrutturaStanza} schema
   * @param {string|Commento} commento
   */
  addComponente(componente, isBreve = false, schema = null, commento = null) {
    if (!this.data) { this.data = {}; this.data.schema = []; }
    this.data.schema.push({
      componente : componente,
      posizione : this.indexIn[componente]++,
      schema : schema,
      commento : commento instanceof Commento ? commento.toString() : commento,
      isBreve : isBreve
    });
  }

  /**
   * @returns {Array<{ componente: string, posizione: number|string, schema: StrutturaStanza, commento: string, isBreve: boolean }>}
   */
  getSchema() {
    return this.data?.schema ?? [];
  }

  /**
   * @param {JSON} schema 
   */
  setSchema(schema) { // TODO: riscrivere
    this.data = {
      schema : schema.schema.map(comp => (
        {
          componente : comp.componente,
          posizione : comp.posizione,
          schema : comp.schema ? new StrutturaStanza(comp.schema) : null,
          commento : comp.commento ?? null,
          isBreve : comp.isBreve ?? false
        }
      ))
    };
  }

  /**
   * Restituisce il prossimo elemento dello schema, oppure null se ha finito
   * @returns {{ componente: string, posizione: number|string, schema: StrutturaStanza, commento: string, isBreve: boolean } | null}
   */
  next() {
    if (this.data && this.data.schema && this.indexOut < this.data.schema.length) return this.data.schema[this.indexOut++];
    return null;
  }

  resetIndexIn() {
    this.indexIn = {
      intro : 0,
      strofa : 0,
      ritornello : 0,
      "pre-chorus" : 0,
      bridge : 0,
      strumentale : 0,
      outro : 0
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
        ?.map(riga => {
          const result = {};
          if (riga.componente != null) result.componente = riga.componente;
          if (riga.posizione != null) result.posizione = riga.posizione;
          if (riga.schema != null) result.schema = riga.schema.toJSONObject?.() ?? riga.schema;
          if (riga.commento != null) result.commento = riga.commento;
          if (riga.isBreve) result.isBreve = riga.isBreve;  // si può anche mettere if (riga.isBreve != null) se si vuole scrivere sempre l'attributo isBreve anche quando è false
          return result;
        })
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
   * @returns {StrutturaCanto}
   */
  clone() {
    return new StrutturaCanto(this.toJSONObject());
  }
}

export { StrutturaCanto }