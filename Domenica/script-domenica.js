
// function openInNewWindow(file=backgroundFilePath) {
//     window.open(file, "_blank");
// }


import { joinPath } from "../App/config/utils.js";
import { CANTO_TEMPLATE_DIR } from "../App/config/config.js";

// function resizeIframe(iframe) {
//   iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
// }

// Attendo che il DOM sia caricato
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');

  fetch('./lista-canti-domenica.json')
    .then(response => response.json())
    .then(data => {
      // Svuoto il main prima di inserire i canti
      main.innerHTML = '';

      data.forEach(canto => {
        const iframe = document.createElement('iframe');
        iframe.className = 'iframe-song';
        iframe.setAttribute('scrolling', 'no');  // deprecato, TODO: trovare una nuova soluzione (magari CSS)
        const iframeId = `iframe-${canto.numero}`;
        iframe.id = iframeId;

        const path = canto.link;
        iframe.src = joinPath(CANTO_TEMPLATE_DIR, "canto.html")+`?path=${encodeURIComponent(path)}&title=${encodeURIComponent(canto.name)}&numero=${canto.numero}`+(canto.tonality ? `&tonality=${encodeURIComponent(canto.tonality)}` : "");

        iframe.onload = () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const buttons = iframeDoc.querySelectorAll('nav button');
            buttons.forEach(btn => btn.style.display = 'none');
          } catch (e) {
            console.warn(`Impossibile accedere al contenuto di ${iframeId} (CORS?):`, e);
          }
        };
        main.appendChild(iframe);
      });
    })
    .catch(error => {
      console.error('Errore nel caricamento dei canti:', error);
      main.innerHTML = '<p>Errore nel caricamento dei canti.</p>';
    });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'resize-iframe') {
      document.querySelectorAll('iframe.iframe-song').forEach(iframe => {
        if (iframe.contentWindow === event.source) {
          iframe.style.height = event.data.height + 'px';
        }
      });
    }
  });

});

