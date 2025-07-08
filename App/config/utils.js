import { SCHEMA_DIR } from "./config.js"

function joinPath(...parts) {
  return parts
    .map((part, i) => {
      if (i === 0) return part.replace(/\/+$/, '');
      return part.replace(/^\/+|\/+$/g, '');
    })
    .filter(Boolean)
    .join('/');
}

// restituisce un nome valido della cartella del canto
function folderValidName(filename) { return filename.replace("'","-").replace(" ","_"); }

function isAccordo(elt) { return elt.type === "accordo"; }
function isCommento(elt) { return elt.type === "commento"; }
function isTonalita(elt) { return elt.type === "tonalita"; }
function isRigaAccordo(elt) { return elt.type === "riga-accordo"; }
function isStrumentale(elt) { return elt.type === "strumentale"; }
function isRigaTesto(elt) { return elt.type === "riga-testo"; }
function isVoce(elt) { return elt.type === "voce"; }
function isStrofa(elt) { return elt.type === "strofa"; }
function isRitornello(elt) { return elt.type === "ritornello"; }
function isPreChorus(elt) { return elt.type === "pre-chorus"; }
function isBridge(elt) { return elt.type === "bridge"; }
function isMoltiplicatore(elt) { return elt.type === "moltiplicatore"; }
function isCanto(elt) { return elt.type === "canto"; }

function camelToKebab(str) { return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(); }

function getSchema(str) { return joinPath(SCHEMA_DIR, camelToKebab(str)+".schema.json") }


export {
    joinPath, folderValidName, isAccordo, isCommento, isTonalita, isRigaAccordo, isStrumentale, isRigaTesto, isVoce, isStrofa, isRitornello, isPreChorus, isBridge, isMoltiplicatore, isCanto, camelToKebab, getSchema
}