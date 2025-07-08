import { RigaTesto } from './RigaTesto.js';
import { camelToKebab } from './config/utils.js';

class RigaVoce extends RigaTesto{

  constructor(riga = null, registro = null, voce = null, assegnata = null) {

    super(riga);
    this.setClassList([registro, voce, assegnata].filter(Boolean));
    this.setType("riga-voce");
    this.buildSingleComponentsHTML();
  }

  /**
   * Costruisce un oggetto RigaVoce da una stringa
   * @param {String} rigaVoce
   * @returns {RigaVoce} oggetto generato
   */
  fromString(rigaVoce, registro = null, voce = null, assegnata = null) {
    this.setClassList([registro, voce, assegnata].filter(Boolean));
    super.fromString(rigaVoce);
    return this;
  }

  /**
   * Ritorna la rappresentazione testuale della riga
   * @returns {string}
   */
  toString() {
    let str = this.data.contenuto.map(elt => elt.toString()).join('');
    if (this.data.commento) str += ` ${this.data.commento.toString()}`;
    return str;
  }

  /**
   * Genera l'HTML del container
   * @param {string} tagName
   */
  buildContainerHTML(tagName = RigaTesto.tagNameDefault) {
    const container = document.createElement(tagName);

    container.className = Array.from(new Set([...this.containerClassList, camelToKebab(this.constructor.name)])).join(" ");  // sovrascrive le classi
    for (const component of this.componentsHTML) {
      container.appendChild(component);
    }

    this.containerHTML = container;
  }

  /**
   * Costruisce un oggetto di classe RigaVoce da un file json
   * @param {JSON} filepath file json
   * @returns {RigaVoce} riga voce
   */
  // static async loadFromFile(filepath) {
  //   try {
  //     const response = await fetch(filepath);
  //     if (!response.ok) throw new Error("Errore fetch");

  //     const json = await response.json();
  //     return new RigaVoce(json);
  //   } catch (err) {
  //     console.error("❌ Errore nel caricamento della riga voce:", err);
  //   }
  // }
}

export { RigaVoce }