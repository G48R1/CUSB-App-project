import { joinPath } from "../App/config/utils.js";
import { INDICE_CANTI_DIR } from "../App/config/config.js";

const TIPI_CANTO = ["ingresso", "eucarestia", "finale"]; // aggiorna con tutti i tipi possibili

const nav = document.querySelector('nav');

const typeFilterWrapper = document.createElement('div');
typeFilterWrapper.className = 'type-filter';

const typeLabel = document.createElement('label');
typeLabel.setAttribute('for', 'type-filter');
typeLabel.textContent = 'Tipo:';

const typeSelect = document.createElement('select');
typeSelect.id = 'type-filter';

const allOption = document.createElement('option');
allOption.value = '';
allOption.textContent = 'Tutti';
typeSelect.appendChild(allOption);

TIPI_CANTO.forEach(tipo => {
  const option = document.createElement('option');
  option.value = tipo;
  option.textContent = tipo;
  typeSelect.appendChild(option);
});

typeFilterWrapper.appendChild(typeLabel);
typeFilterWrapper.appendChild(typeSelect);

// Inserisco dopo la search bar
document.querySelector('.search').appendChild(typeFilterWrapper);


// Attendo che il DOM sia caricato
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');

  let data = [];
  // fetch('./indice-canti/indice-canti.json')
  fetch(joinPath(INDICE_CANTI_DIR, 'indice-canti.json'))
    .then(response => response.json())
    .then(json => {
      // Svuoto il main prima di inserire i canti
      main.innerHTML = '';

      data = json;
      data.forEach(canto => {
        const container = document.createElement('div');
        container.className = 'song';
        const titleDiv = document.createElement('div');
        titleDiv.className = 'song-title cursor-pointer';

        const numero = document.createElement("span");
        numero.className = 'numero-canto'
        numero.textContent = canto.numero + 1;  // visualizza contando da 1 (non da 0)

        const link = document.createElement('a');
        const path = canto.link.default ? canto.link.default : Object.values(canto.link)[0];
        link.href = `./canto-template/canto.html?path=${encodeURIComponent(path)}&title=${encodeURIComponent(canto.name)}&numero=${canto.numero}`;
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

  // const searchBar = document.getElementById('search-bar');

  // searchBar.addEventListener('input', (e) => {
  //   const searchTerm = e.target.value.toLowerCase();

  //   document.querySelectorAll('.song').forEach(song => {
  //     const text = song.textContent.toLowerCase();
  //     song.style.display = text.includes(searchTerm) ? '' : 'none';
  //   });
  // });



  const searchBar = document.getElementById('search-bar');
  const typeFilter = document.getElementById('type-filter');

  function applyFilters() {
    const searchTerm = searchBar.value.toLowerCase();
    const selectedType = typeFilter.value;

    document.querySelectorAll('.song').forEach(song => {
      const text = song.textContent.toLowerCase();
      const songIndex = [...song.parentElement.children].indexOf(song); // stesso ordine dei dati
      const songData = data[songIndex]; // da usare come riferimento

      const matchesSearch = text.includes(searchTerm);
      const matchesType =
        selectedType === '' || (songData.type && songData.type.includes(selectedType));

      song.style.display = matchesSearch && matchesType ? '' : 'none';
    });
  }

  searchBar.addEventListener('input', applyFilters);
  typeFilter.addEventListener('change', applyFilters);



});
