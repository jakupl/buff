// saveData.js
// Zależności: node-fetch (v2.x dla require). `npm install node-fetch@2`
// Ustawienie: export PRICE_MP_API_KEY="your_api_key"

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_URL = 'https://api.pricempire.com/v4/trader/items/prices?app_id=730&sources=buff163,skins&currency=USD&avg=false&median=false&inflation_threshold=-1';
const OUTPUT_FILE = path.resolve(__dirname, 'buffPriceList.json'); // zmień nazwę, jeśli chcesz

async function fetchAndSave() {
  const apiKey = "d87b7114-fed2-4935-b92f-05dcce192f94";
  if (!apiKey) {
    console.error('Brak PRICE_MP_API_KEY w zmiennych środowiskowych. Ustaw: export PRICE_MP_API_KEY="your_api_key"');
    process.exitCode = 1;
    return;
  }

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      // jeśli potrzebujesz timeoutu, obsłuż go wyżej lub użyj AbortController
    });
  } catch (err) {
    console.error('Błąd połączenia z API:', err);
    return;
  }

  if (!res.ok) {
    console.error(`Błąd API: HTTP ${res.status} ${res.statusText}`);
    const txt = await res.text().catch(()=>null);
    if (txt) console.error('Treść odpowiedzi:', txt);
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error('Nie udało się sparsować JSON z odpowiedzi:', err);
    return;
  }

  if (!Array.isArray(data)) {
    console.error('Oczekiwano tablicy jako odpowiedzi. Otrzymano:', typeof data);
    return;
  }

  // Transformacja: bierzemy tylko provider_key === 'buff163'
  const out = data.reduce((acc, item) => {
    if (!item || typeof item.market_hash_name !== 'string' || !Array.isArray(item.prices)) return acc;

    // Znajdź pierwszy obiekt w prices z provider_key 'buff163'
    const buffRec = item.prices.find(p => p && p.provider_key === 'buff163');

    // Jeśli brak price lub count — pomijamy (możesz zmienić, żeby wpisywać null/0)
    if (!buffRec || typeof buffRec.price === 'undefined' || typeof buffRec.count === 'undefined') return acc;

    // price z API prawdopodobnie w "centach" — użytkownik prosił o podzielenie przez 100
    const priceDivided = Number(buffRec.price) / 100;

    // Zabezpieczenia: upewnij się, że liczby są sensowne
    if (!isFinite(priceDivided)) return acc;
    const stock = Number(buffRec.count);
    if (!Number.isFinite(stock)) return acc;

    acc.push({
      market_hash_name: item.market_hash_name,
      price: priceDivided,        // cena po podzieleniu przez 100
      stock: stock,               // count -> stock
      updated_at: buffRec.updated_at || null
    });
    return acc;
  }, []);

  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2), 'utf8');
    console.log(`Zapisano ${out.length} rekordów do ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Błąd zapisu pliku:', err);
  }
}

// jeśli uruchamiasz ten plik bezpośrednio: node saveData.js
if (require.main === module) {
  fetchAndSave().catch(err => {
    console.error('Nieoczekiwany błąd:', err);
  });
}

// eksport funkcji do użycia w innych częściach projektu
module.exports = {
  fetchAndSave
};
