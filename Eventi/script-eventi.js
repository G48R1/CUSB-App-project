
import { INDICE_EVENTI_DIR, EVENTO_TEMPLATE_DIR } from "../App/config/config.js";
import { joinPath } from "../App/config/utils.js";

fetch(joinPath(INDICE_EVENTI_DIR, './indice-eventi.json'))
  .then(response => response.json())
  .then(eventi => {
    const main = document.querySelector('main');

    eventi.forEach((evento, index) => {
      // Crea il link
      const link = document.createElement('a');
      link.href = joinPath(EVENTO_TEMPLATE_DIR, `evento.html?evento=${index}`);
      link.classList.add('evento-link');

      // Contenuto dell'evento
      const eventoDiv = document.createElement('div');
      eventoDiv.classList.add('evento');

      const titolo = document.createElement('h3');
      titolo.textContent = evento.titolo;

      const data = document.createElement('p');
      data.textContent = `📅 ${evento.data}`;

      eventoDiv.appendChild(titolo);
      eventoDiv.appendChild(data);
      link.appendChild(eventoDiv);

      main.appendChild(link);
    });
  })
  .catch(error => console.error('Errore nel caricamento eventi:', error));
