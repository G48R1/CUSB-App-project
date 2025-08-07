
import { joinPath } from "../../App/config/utils.js";
import { INDICE_EVENTI_DIR, CANTO_TEMPLATE_DIR } from "../../App/config/config.js";

// Funzione per ottenere parametri da URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  const titleElt = document.getElementById('title');
  const eventoIndex = parseInt(getQueryParam('evento'), 10);
  const dataEventoSpan = document.getElementById('data-evento');

  fetch(joinPath(INDICE_EVENTI_DIR, './indice-eventi.json'))
    .then(response => response.json())
    .then(eventi => {
      const evento = eventi[eventoIndex];

      if (!evento) {
        main.innerHTML = `<p>Evento non trovato.</p>`;
        return;
      }

      titleElt.textContent = evento.titolo.toUpperCase();
      if (dataEventoSpan) {
        dataEventoSpan.textContent = `📅 ${evento.data}`;
      }

      // Canti
      evento.canti.forEach(canto => {
        const iframe = document.createElement('iframe');
        iframe.className = 'iframe-song';
        iframe.setAttribute('scrolling', 'no');
        iframe.id = `iframe-${canto.numero}`;

        const path = canto.link;
        iframe.src = joinPath(CANTO_TEMPLATE_DIR, "canto.html") +
          `?path=${encodeURIComponent(path)}&title=${encodeURIComponent(canto.name)}&numero=${canto.numero}` +
          (canto.tonality ? `&tonality=${encodeURIComponent(canto.tonality)}` : "");

        iframe.onload = () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const buttons = iframeDoc.querySelectorAll('nav button');
            buttons.forEach(btn => btn.style.display = 'none');
          } catch (e) {
            console.warn(`CORS - Impossibile accedere a ${iframe.id}:`, e);
          }
        };

        main.appendChild(iframe);
      });
    })
    .catch(error => {
      console.error('Errore nel caricamento:', error);
      main.innerHTML = '<p>Errore nel caricamento dell\'evento.</p>';
    });

  // Gestione resize da iframe
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'resize-iframe') {
      document.querySelectorAll('iframe.iframe-song').forEach(iframe => {
        if (iframe.contentWindow === event.source) {
          iframe.style.height = event.data.height + 'px';
        }
      });
    }
  });
});
