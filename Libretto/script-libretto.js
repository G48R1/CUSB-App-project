import { joinPath } from "../App/config/utils.js";
import { INDICE_CANTI_DIR } from "../App/config/config.js";

const TIPI_CANTO = ["INGRESSO", "KYRIE", "GLORIA", "ALLELUIA", "SANTO", "AGNELLO", "PACE", "EUCARESTIA", "FINALE"];
const PERIODI = ["ORDINARIO", "AVVENTO", "NATALE", "QUARESIMA", "PASQUA"];

/**
 * Crea un filtro con le specifiche date.
 * @param {string} type
 * @param {string} label
 * @param {Array<string>} options
 * @returns {HTMLElement}
 * 
 */
function createFilter(type, label, options) {
  const filterWrapper = document.createElement('div');
  const className = type + '-filter';
  filterWrapper.className = `${className} filter`;

  const filterLabel = document.createElement('label');
  filterLabel.setAttribute('for', className);
  filterLabel.textContent = label + ":";

  const select = document.createElement('select');
  select.id = className;

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'TUTTI';
  select.appendChild(allOption);

  options.forEach(elt => {
    const option = document.createElement('option');
    option.value = elt;
    option.textContent = elt;
    select.appendChild(option);
  });

  filterWrapper.appendChild(filterLabel);
  filterWrapper.appendChild(select);

  return filterWrapper;
}

const typeFilterWrapper = createFilter("type", "Tipo", TIPI_CANTO);
const timeFilterWrapper = createFilter("time", "Periodo", PERIODI);

const filterBox = document.createElement("div");
filterBox.className = "filter-box",
filterBox.appendChild(typeFilterWrapper);
filterBox.appendChild(timeFilterWrapper);
// Inserisco dopo la search bar
document.querySelector('.search').appendChild(filterBox);




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


  // Filtri di ricerca
  const searchBar = document.getElementById('search-bar');
  const typeFilter = document.getElementById('type-filter');
  const timeFilter = document.getElementById('time-filter');

  function applyFilters() {
    const searchTerm = searchBar.value.toLowerCase();
    const selectedType = typeFilter.value.toLowerCase();
    const selectedTime = timeFilter.value.toLowerCase();

    document.querySelectorAll('.song').forEach(song => {
      const text = song.textContent.toLowerCase();
      const songIndex = [...song.parentElement.children].indexOf(song); // mantiene l'ordine dei dati
      const songData = data[songIndex];

      const matchesSearch = text.includes(searchTerm);
      const matchesFilters =
        (selectedType === '' || (songData.type && songData.type.some(t => t.toLowerCase().includes(selectedType))) && (selectedTime === '' || (songData.time && songData.time.some(t => t.toLowerCase().includes(selectedTime)));

      song.style.display = matchesSearch && matchesFilters ? '' : 'none';
    });
  }

  searchBar.addEventListener('input', applyFilters);
  typeFilter.addEventListener('change', applyFilters);
  timeFilter.addEventListener('change', applyFilters);

});
