// saveData.js
// Zależności: node-fetch (v2.x dla require). `npm install node-fetch@2`
// Ustawienie: export PRICE_MP_API_KEY="your_api_key"

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_URL = 'https://api.pricempire.com/v4/trader/items/prices?app_id=730&sources=buff163,skins&currency=USD&avg=false&median=false&inflation_threshold=-1';
const OUTPUT_FILE = path.resolve(__dirname, 'buffPriceList.json'); // zmień nazwę, jeśli chcesz

async function fetchAndSave() {
  const apiKey = process.env.PRICE_MP_API_KEY || 'd87b7114-fed2-4935-b92f-05dcce192f94'; // pobieraj z env
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

  // Zbudujemy obiekt wynikowy: { updated_at: "...", "market_hash_name": { price, stock }, ... }
  const resultObj = {};
  let latestTimestamp = null; // będzie trzymac najnowszy updated_at (Date)

  for (const item of data) {
    if (!item || typeof item.market_hash_name !== 'string' || !Array.isArray(item.prices)) continue;

    const buffRec = item.prices.find(p => p && p.provider_key === 'buff163');
    if (!buffRec || typeof buffRec.price === 'undefined' || typeof buffRec.count === 'undefined') continue;

    const priceDivided = Number(buffRec.price) / 100;
    if (!isFinite(priceDivided)) continue;
    const stock = Number(buffRec.count);
    if (!Number.isFinite(stock)) continue;

    // Spróbuj sparsować updated_at z rekordu; jeśli nie ma, pomin lub nie aktualizuj timestampu
    let recTs = null;
    if (buffRec.updated_at) {
      const parsed = Date.parse(buffRec.updated_at);
      if (!Number.isNaN(parsed)) recTs = new Date(parsed);
    }

    if (recTs) {
      if (!latestTimestamp || recTs > latestTimestamp) latestTimestamp = recTs;
    }

    // Wstawiamy parę: klucz = market_hash_name, wartość = { price, stock }
    // Uwaga: nazwy mogą się powtarzać — ostatni wpis nadpisze wcześniejszy
    resultObj[item.market_hash_name] = {
      price: priceDivided,
      stock: stock
    };
  }

  // jeśli nie znaleziono żadnego updated_at w danych, użyj aktualnego czasu
  const updatedAtIso = (latestTimestamp ? latestTimestamp.toISOString() : new Date().toISOString());

  // Stwórz finalny obiekt z updated_at na górze
  const finalObj = Object.assign({ updated_at: updatedAtIso }, resultObj);

  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalObj, null, 2), 'utf8');
    // policz ile pozycji (bez pola updated_at)
    const count = Object.keys(finalObj).length - (finalObj.updated_at ? 1 : 0);
    console.log(`Zapisano ${count} rekordów do ${OUTPUT_FILE} (updated_at: ${updatedAtIso})`);
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
