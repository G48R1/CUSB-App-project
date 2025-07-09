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

  console.log(canto.toJSON());


  /*************************************************************/
  // from old encode
  /*************************************************************/
  const stringCantoFromOldEncode = String.raw`\head OGGI TI CHIAMO
\intro DO  SIb  FA  DO
\start
\c DO                  SIb
\l Oggi ti chiamo alla vita
\c              FA                   DO
\l t'invito a seguirmi, a venire con Me.
\c DO                         SIb
\l Apri i tuoi occhi e il tuo cuore
\c           FA            DO
\l dimentica tutto e segui Me.
\c LA-             FA       SOL             DO
\l Non avere più paura di lasciare quel che hai,
\c    LA-              FA        SOL
\l il senso vero della vita troverai.
$$
\c      DO          FA          DO          FA
\l Seguirò la Tua parola, mio Signore io verrò,
\c        LA-        FA         RE-       SOL
\l con la mano nella Tua sempre io camminerò,
\c       DO          RE-              SOL
\l dammi oggi la Tua forza ed il Tuo amore.
\c      DO         FA          DO       FA
\l Canterò canzoni nuove, canterò felicità,
\c       LA-            FA           RE-        SOL
\l ed il fuoco del Tuo amore nel mio mondo porterò,
\c      DO          RE-         SOL
\l canterò che solo Tu sei libertà.
$$
\c DO                  SIb
\l Oggi ti chiamo all'amore
\c              FA                  DO
\l t'invito a seguirmi, a stare con Me.
\c DO                SIb
\l Apri le porte del cuore
\c              FA               DO
\l allarga i confini del dono di te.
\c   LA-               FA         SOL         DO
\l Accogli tutti nella pace con fiducia e verità,
\c    LA-            FA         SOL
\l l'amore vero ti darà la libertà.
$$
\c      DO          FA          DO          FA
\l Seguirò la Tua parola, mio Signore io verrò,
\c        LA-        FA         RE-       SOL
\l con la mano nella Tua sempre io camminerò,
\c       DO          RE-              SOL
\l dammi oggi la Tua forza ed il Tuo amore.
\c      DO         FA          DO       FA
\l Canterò canzoni nuove, canterò felicità,
\c       LA-            FA           RE-        SOL
\l ed il fuoco del Tuo amore nel mio mondo porterò,
\c      DO          RE-         SOL
\l canterò che solo Tu sei libertà.
$$
\cmt (stoppato)
\c DO                  SIb
\l Oggi ti chiamo alla gioia,
\c              FA                   DO
\l t'invito a seguirmi, a venire con Me.
\c DO                    SIb
\l Sai quanto vale un sorriso,
\c             FA                 DO
\l può dare speranza a chi non ne ha.
\c    LA-                 FA         SOL          DO
\l La gioia è segno della vita che rinasce dentro te,
\c     LA-                 FA          SOL
\l e annuncia ad ogni uomo pace e libertà.
$$
\c      DO          FA          DO          FA
\l Seguirò la Tua parola, mio Signore io verrò,
\c        LA-        FA         RE-       SOL
\l con la mano nella Tua sempre io camminerò,
\c       DO          RE-              SOL
\l dammi oggi la Tua forza ed il Tuo amore.
\c      DO         FA          DO       FA
\l Canterò canzoni nuove, canterò felicità,
\c       LA-            FA           RE-        SOL
\l ed il fuoco del Tuo amore nel mio mondo porterò,
\c      DO          RE-         SOL
\l canterò che solo Tu sei libertà.
$$
\outro DO  SIb  FA  DO
\end`;

  const cantoFromOldEncode = Canto.fromOldEncode(stringCantoFromOldEncode);
  cantoFromOldEncode.setId(5);
  cantoFromOldEncode.setInfo(new Tonalita().fromString("REm"));
  main.appendChild(cantoFromOldEncode.update());
  
  // json
  console.log(cantoFromOldEncode.toJSON());

  // main.appendChild(cantoFromOldEncode.clone().toHTML());

})();
