import { Canto } from "../../App/Canto.js";
import { CANTI_DIR, INDICE_CANTI_DIR } from "../../App/config/config.js";
import { joinPath } from "../../App/config/utils.js";

// già definiti nello script di canto.html
// const main = document.querySelector('main');
// const tone = document.getElementById("tonality");
// const mode = document.getElementById("mode");

function abilitaToggleStrofaBreve() {
  document.querySelectorAll('.stanza-box').forEach(box => {
    box.onclick = () => {
      const [stanzaEl, breveEl] = box.children;
      if (!stanzaEl || !breveEl || !enableTSB) return;
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

      // song variants
      linkEntries.forEach(([label, path]) => {
        const option = document.createElement('option');
        option.value = joinPath(CANTI_DIR, path);
        option.textContent = label;
        select.appendChild(option);
      });

      select.addEventListener('change', () => {
        loadCanto(select.value);
      });

      if (cantoData.audio) {
        const audioEntries = Object.entries(cantoData.audio);
        const audioTracks = document.getElementById("audio-tracks");
        // audio
        audioEntries.forEach(([label, trackPath]) => {
          const container = document.createElement("div");
          container.className = "track-box";

          const labelDiv = document.createElement("label");
          labelDiv.textContent = label;

          const audio = document.createElement("audio");
          audio.controls = true;
          audio.className = "audio-track";

          const source = document.createElement("source");
          source.src = joinPath(CANTI_DIR, trackPath);

          const message = document.createElement("p");
          message.textContent = "";

          audio.appendChild(source);
          audio.appendChild(message);

          container.appendChild(labelDiv);
          container.appendChild(audio);

          audioTracks.appendChild(container);
        })
      }

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

  const voices = document.getElementById('voices-select');
  const voicesList = canto.getNomiSecondeVoci();
  voicesList.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice;
    option.textContent = voice;
    voices.appendChild(option);
  });
  const option = document.createElement('option');
  option.value = "all";
  option.textContent = "tutte";
  voices.appendChild(option);
  voices.value = "all";

  voices.addEventListener('change', () => {
    visualizeVoice(voices.value);
  });

});

