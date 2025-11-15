// saveData.js
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.BUFF_API_KEY || ""; // lepiej trzymać klucz w GitHub Secret
if (!API_KEY) {
  console.warn("Nie ustawiono BUFF_API_KEY. Używasz przykładowego URL (jeśli podałeś w kodzie).");
}

const url = process.env.BUFF_API_URL || `https://skins-table.com/api_v2/items?apikey=${API_KEY}&app=730&site=BUFF.163`;
const outDir = path.join(process.cwd(), 'docs'); // zapis do docs/ (GitHub Pages)
const outFile = path.join(outDir, 'buffPriceList.json');

async function saveData() {
  try {
    // upewnij się, że katalog docs istnieje
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);

    const data = await response.json();

    const transformed = { items: {} };

    for (const [name, values] of Object.entries(data.items || {})) {
      const price = values.p;
      const stock = values.c;

      if (typeof stock === 'number' && stock >= 1) {
        transformed.items[name] = {
          price: price,
          stock: stock,
        };
      }
    }

    // dodaj timestamp (przydatne debugowanie)
    transformed.generated_at = new Date().toISOString();

    fs.writeFileSync(outFile, JSON.stringify(transformed, null, 2), 'utf-8');
    console.log(`Dane zapisane -> ${outFile}`);
  } catch (err) {
    console.error("Błąd pobierania danych:", err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

saveData();
