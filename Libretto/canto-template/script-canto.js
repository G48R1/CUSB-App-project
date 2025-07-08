import { Canto } from "/App/Canto.js";
import { CANTI_DIR, INDICE_CANTI_DIR } from "/App/config/config.js";
import { joinPath } from "/App/config/utils.js";

// già definiti nello script di canto.html
// const main = document.querySelector('main');
// const tone = document.getElementById("tonality");
// const mode = document.getElementById("mode");

function abilitaToggleStrofaBreve() {
  document.querySelectorAll('.stanza-box').forEach(box => {
    box.onclick = () => {
      const [stanzaEl, breveEl] = box.children;
      if (!stanzaEl || !breveEl) return;
      stanzaEl.classList.toggle('hidden');
      breveEl.classList.toggle('hidden');
    };
  });
}

function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

async function loadCanto(filepath) {
  const canto = await Canto.loadFromFile(filepath);
  main.textContent = null;

  // console.log(filepath);

  main.appendChild(canto.toHTML());
  // document.getElementById("song-title").textContent = title;

  if (!checkbox.checked) visualizeChords(); // default: non visualizzati
  abilitaToggleStrofaBreve();


  tone.textContent = canto.getTonalita().getTono();
  mode.textContent = canto.getTonalita().getModo();

  setFontSize();
}

document.addEventListener('DOMContentLoaded', async () => {
  const path = joinPath(CANTI_DIR, getQueryParam('path')); //getQueryParam('path');
  const title = getQueryParam('title');
  if (!path) return;
  const id = parseInt(getQueryParam('numero'));
  if (isNaN(id)) return;

  // Carico l’indice
  fetch(joinPath(INDICE_CANTI_DIR, 'indice_canti.json'))
    .then(response => response.json())
    .then(data => {
      const cantoData = data.find(c => c.numero === id);
      const select = document.getElementById('variant-select');
      const linkEntries = Object.entries(cantoData.link);

      linkEntries.forEach(([label, path]) => {
        const option = document.createElement('option');
        option.value = joinPath(CANTI_DIR, path);
        option.textContent = label;
        select.appendChild(option);
      });

      select.addEventListener('change', () => {
        loadCanto(select.value);
      });
    })
    .catch(error => {
      console.error('Errore nel caricamento dei canti:', error);
      main.innerHTML = '<p>Errore nel caricamento dei canti.</p>';
    });

  // console.log(path);

  const canto = await Canto.loadFromFile(path);
  main.appendChild(canto.toHTML());
  document.getElementById("song-title").textContent = title;

  visualizeChords(); // default: non visualizzati
  abilitaToggleStrofaBreve();

  tone.textContent = canto.getTonalita().getTono();
  mode.textContent = canto.getTonalita().getModo();

  setFontSize();
});

