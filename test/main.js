import { CANTI_DIR, dirCantoExample } from '../App/config/config.js'
import { joinPath, folderValidName } from '../App/config/utils.js'
// import { Accordo } from "../App/Accordo.js";
// import { Commento } from "../App/Commento.js";
import { Tonalita } from "../App/Tonalita.js";
// import { RigaAccordi } from "../App/RigaAccordi.js";
// import { RigaTesto } from "../App/RigaTesto.js";
// import { Strumentale } from "../App/Strumentale.js";
// import { Voce } from "../App/Voce.js";
import { RigaVoce } from '../App/RigaVoce.js';
// import { Stanza } from "../App/Stanza.js";
import { Canto } from '../App/Canto.js';


// function doubleEscape(str) {
//   let result = (String.raw({raw:[str]})).replace(/\\/g, "\\\\");
//   return result;//String.raw({raw:[result]});
// }

(async () => {
  const main = document.querySelector("main");
  let filepath;
  let response;
  
  /*************************************************************/
  // from json
  /*************************************************************/
  filepath = joinPath(CANTI_DIR, dirCantoExample, "canto.json");

  // validation
  await Canto.loadSchema();
  response = await fetch(filepath);
  const jsonCanto = await response.json();
  console.log("JSON canto: "+(await Canto.validate(jsonCanto)).valid);

  // load
  const canto = await Canto.loadFromFile(filepath);
  main.appendChild(canto.toHTML());

  // console.log(canto.toJSON());


  /*************************************************************/
  // from old encode
  /*************************************************************/
  const stringCantoFromOldEncode = String.raw`\head CHIAMATI PER NOME
\intro   RE SOL LA
\start
$$
\c            RE              LA
\l Veniamo da Te chiamati per nome
\c             RE                    SOL9
\l che festa Signore, tu cammini con noi.
\c             RE                    LA
\l Ci parli di Te, per noi spezzi il pane
\c             RE                     SOL9
\l Ti riconosciamo il cuore arde: sei Tu!
\c           SI- LA        SOL9 LA 
\l E noi tuo popolo, siamo qui.
$$
\c SOL                   SI-7
\l Siamo come terra ed argilla
\c      RE                LA
\l e la Tua parola ci plasmerà.
\c SOL                     SI-
\l Brace pronta per la scintilla
\c        RE            SOL           LA
\l Il tuo spirito soffierà, c’infiammerà.
$$
\c            RE              LA
\l Veniamo da Te chiamati per nome
\c             RE                    SOL9
\l che festa Signore, tu cammini con noi.
\c             RE                    LA
\l Ci parli di Te, per noi spezzi il pane
\c             RE                     SOL9
\l Ti riconosciamo il cuore arde: sei Tu!
\c           SI- LA        SOL9 LA 
\l E noi tuo popolo, siamo qui.
$$
\c SOL                 SI-7
\l Siamo come semi nel solco
\c      RE                       LA
\l come vigna che il suo frutto darà.
\c SOL                 SI-
\l grano del Signore risorto,
\c        RE             SOL        LA
\l la Sua messe che fiorirà d’eternità.
$$
\c            RE              LA
\l Veniamo da Te chiamati per nome
\c             RE                    SOL9
\l che festa Signore, Tu cammini con noi.
\c             RE                    LA
\l Ci parli di Te, per noi spezzi il pane
\c             RE                     SOL9
\l Ti riconosciamo il cuore arde: sei Tu!
\c           SI- LA        SOL9 LA 
\l E noi tuo popolo, siamo qui.
\c           SI- LA        SOL LA 
\l E noi tuo popolo, siamo qui,   
\c       RE
\l Siamo qui.
$$
\end`;

  const cantoFromOldEncode = Canto.fromOldEncode(stringCantoFromOldEncode);
  cantoFromOldEncode.setId(5);
  cantoFromOldEncode.setInfo(new Tonalita().fromString("REm"));
  main.appendChild(cantoFromOldEncode.update());
  
  // json
  console.log(cantoFromOldEncode.toJSON());

  // main.appendChild(cantoFromOldEncode.clone().toHTML());

})();
