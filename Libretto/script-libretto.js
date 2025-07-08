import { joinPath } from "../App/config/utils.js";
import { INDICE_CANTI_DIR } from "../App/config/config.js";

// Attendi che il DOM sia caricato
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');

  // fetch('./indice-canti/indice_canti.json')
  fetch(joinPath(INDICE_CANTI_DIR, 'indice_canti.json'))
    .then(response => response.json())
    .then(data => {
      // Svuota il main prima di inserire i canti
      main.innerHTML = '';

      data.forEach(canto => {
        const container = document.createElement('div');
        container.className = 'song';
        const titleDiv = document.createElement('div');
        titleDiv.className = 'song-title cursor-pointer';

        const numero = document.createElement("span");
        numero.className = 'numero-canto'
        numero.textContent = canto.numero;

        const link = document.createElement('a');
        link.href = `./canto-template/canto.html?path=${encodeURIComponent(canto.link?.default)}&title=${encodeURIComponent(canto.name)}&numero=${canto.numero}`;
        link.textContent = canto.name;

        container.appendChild(numero);

        titleDiv.appendChild(link);
        container.appendChild(titleDiv);
        main.appendChild(container);
      });
    })
    .catch(error => {
      console.error('Errore nel caricamento dei canti:', error);
      main.innerHTML = '<p>Errore nel caricamento dei canti.</p>';
    });

  const searchBar = document.getElementById('search-bar');

  searchBar.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    document.querySelectorAll('.song').forEach(song => {
      const text = song.textContent.toLowerCase();
      song.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });

});
