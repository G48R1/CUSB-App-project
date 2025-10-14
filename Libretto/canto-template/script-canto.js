import { Canto } from "../../App/Canto.js";
import { Tonalita } from "../../App/Tonalita.js";
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

/**
 * Calcola l'intervallo di tonalità tra la tonalità di default e quella da impostare e traspone della quantità delta
 * @param {string} newTonality
 * @param {string} oldTonality
 */
function changeTonality(newTonality, oldTonality) {
  const newTonalityObj = new Tonalita().fromString(newTonality);
  transpose(oldTonality.interval(newTonalityObj));
}

async function loadCanto(filepath) {
  const canto = await Canto.loadFromFile(filepath);
  main.textContent = null;

  // console.log(filepath);

  main.appendChild(canto.toHTML());
  // document.getElementById("song-title").textContent = title;

  if (!checkbox.checked) visualizeChordsBool(false); //visualizeChords(); // default: non visualizzati
  abilitaToggleStrofaBreve();

  document.getElementById("double-columns-checkbox").checked = false; // azzero slider cols2
  // document.querySelector(".canto").classList.remove("cols2");

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
  const tonalityToSet = getQueryParam('tonality');

  // Carico l’indice
  fetch(joinPath(INDICE_CANTI_DIR, 'indice-canti.json'))
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

      select.value = path;
      select.addEventListener('change', () => {
        loadCanto(select.value);
      });

      console.log(cantoData);

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
      
      if (cantoData.scores) {
        const scoreEntries = Object.entries(cantoData.scores);
        const scoreContainer = document.getElementById("scores");

        scoreEntries.forEach(([label, scorePath]) => {
          const container = document.createElement("div");
          container.className = "score-box";

          const labelDiv = document.createElement("label");
          labelDiv.textContent = label;

          const fullPath = joinPath(CANTI_DIR, scorePath);
          const ext = scorePath.split('.').pop().toLowerCase();

          let previewEl;

          if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) {
            // 📸 IMMAGINE
            const img = document.createElement("img");
            img.src = fullPath;
            img.alt = `Partitura: ${label}`;
            img.className = "score-preview";
            img.style.maxWidth = "150px";
            img.style.maxHeight = "150px";
            img.style.objectFit = "cover";
            img.style.cursor = "pointer";
            img.style.borderRadius = "8px";
            img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
            img.style.transition = "transform 0.2s ease";

            img.addEventListener("mouseenter", () => {
              img.style.transform = "scale(1.05)";
            });
            img.addEventListener("mouseleave", () => {
              img.style.transform = "scale(1)";
            });

            // clic per aprire in nuova scheda
            img.addEventListener("click", () => window.open(fullPath, "_blank"));
            previewEl = img;

          } else if (ext === "pdf") {
            // 📄 PDF
            const pdfDiv = document.createElement("div");
            pdfDiv.className = "pdf-preview";
            pdfDiv.textContent = "📄 Apri PDF";
            pdfDiv.style.width = "150px";
            pdfDiv.style.height = "150px";
            pdfDiv.style.display = "flex";
            pdfDiv.style.alignItems = "center";
            pdfDiv.style.justifyContent = "center";
            pdfDiv.style.background = "#f3f3f3";
            pdfDiv.style.borderRadius = "8px";
            pdfDiv.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
            pdfDiv.style.cursor = "pointer";
            pdfDiv.style.transition = "background 0.2s ease";

            pdfDiv.addEventListener("mouseenter", () => {
              pdfDiv.style.background = "#e8e8e8";
            });
            pdfDiv.addEventListener("mouseleave", () => {
              pdfDiv.style.background = "#f3f3f3";
            });
            pdfDiv.addEventListener("click", () => window.open(fullPath, "_blank"));

            previewEl = pdfDiv;

          } else {
            // Tipo non supportato
            const unknown = document.createElement("p");
            unknown.textContent = `Formato non supportato: ${ext}`;
            previewEl = unknown;
          }

          container.appendChild(labelDiv);
          container.appendChild(previewEl);
          scoreContainer.appendChild(container);
        });
      }

      // if (cantoData.scores) {
      //   const scoreEntries = Object.entries(cantoData.scores);
      //   const scoreContainer = document.getElementById("scores");

      //   scoreEntries.forEach(([label, scorePath]) => {
      //     const container = document.createElement("div");
      //     container.className = "score-box";

      //     const labelDiv = document.createElement("label");
      //     labelDiv.textContent = label;

      //     const img = document.createElement("img");
      //     img.src = joinPath(CANTI_DIR, scorePath);
      //     img.alt = `Partitura: ${label}`;
      //     img.className = "score-preview";

      //     // Anteprima piccola, possiamo limitare la dimensione via CSS o inline:
      //     img.style.maxWidth = "150px";
      //     img.style.maxHeight = "150px";
      //     img.style.objectFit = "cover";
      //     img.style.cursor = "pointer";
      //     img.style.borderRadius = "8px";
      //     img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      //     img.style.transition = "transform 0.2s ease";

      //     // Effetto hover
      //     img.addEventListener("mouseenter", () => {
      //       img.style.transform = "scale(1.05)";
      //     });
      //     img.addEventListener("mouseleave", () => {
      //       img.style.transform = "scale(1)";
      //     });

      //     container.appendChild(labelDiv);
      //     container.appendChild(img);
      //     scoreContainer.appendChild(container);

      //     // visualizzazione estesa
      //     img.onclick = () => window.open(img.src, "_blank");
      //   });
      // }
    })
    .catch(error => {
      console.error('Errore nel caricamento dei canti:', error);
      main.innerHTML = '<p>Errore nel caricamento dei canti.</p>';
    });

  const canto = await Canto.loadFromFile(path);
  main.appendChild(canto.toHTML());
  document.getElementById("song-title").textContent = title;

  visualizeChordsBool(false); //visualizeChords(); // default: non visualizzati
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
  const optionAll = document.createElement('option');
  optionAll.value = "all";  // o anche ""
  optionAll.textContent = "tutte";
  voices.appendChild(optionAll);
  const optionNone = document.createElement('option');
  optionNone.value = "none";
  optionNone.textContent = "nessuna";
  voices.appendChild(optionNone);
  voices.value = "all";

  voices.addEventListener('change', () => {
    visualizeVoice(voices.value);
  });

  if (tonalityToSet) changeTonality(tonalityToSet, canto.getTonalita());

});

