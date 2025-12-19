
//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//


const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

                                                                                                                                                                                                                                                                                                                      const API_URL = 'https://api.pricempire.com/v4/trader/items/prices?app_id=730&sources=buff163,skins&currency=USD&avg=false&median=false&inflation_threshold=-1';
const OUTPUT_FILE = path.resolve(__dirname, 'buffPriceList.json'); 

async function fetchAndSave() {
                                                                                                                                                                                                                                                                                                                       const apiKey = 'd87b7114-fed2-4935-b92f-05dcce192f94'; 
  if (!apiKey) {
    console.error('Brak klucza');
    process.exitCode = 1;
    return;
  }
  //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
  
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
  //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
  
  if (!res.ok) {
    console.error(`Błąd API: HTTP ${res.status} ${res.statusText}`);
    const txt = await res.text().catch(()=>null);
    if (txt) console.error('Treść odpowiedzi:', txt);
    return;
  }
//

  //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
  
  let data;
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
  
  try {
    data = await res.json();
  } catch (err) {
    console.error('JSON error:', err);
    return;
  }

  if (!Array.isArray(data)) {
    console.error('Otrzymano:', typeof data);
    return;
  }

  // { updated_at: "...", "market_hash_name": { price, stock }, ... }
  const resultObj = {};
  let latestTimestamp = null; 

  for (const item of data) {
    if (!item || typeof item.market_hash_name !== 'string' || !Array.isArray(item.prices)) continue;

    const buffRec = item.prices.find(p => p && p.provider_key === 'buff163');
    if (!buffRec || typeof buffRec.price === 'undefined' || typeof buffRec.count === 'undefined') continue;

    const priceDivided = Number(buffRec.price) / 100;
    if (!isFinite(priceDivided)) continue;
    const stock = Number(buffRec.count);
    if (!Number.isFinite(stock)) continue;

    let recTs = null;
    if (buffRec.updated_at) {
      const parsed = Date.parse(buffRec.updated_at);
      if (!Number.isNaN(parsed)) recTs = new Date(parsed);
    }

    if (recTs) {
      if (!latestTimestamp || recTs > latestTimestamp) latestTimestamp = recTs;
    }

    resultObj[item.market_hash_name] = {
      price: priceDivided,
      stock: stock
    };
  }

  const updatedAtIso = (latestTimestamp ? latestTimestamp.toISOString() : new Date().toISOString());

  const finalObj = Object.assign({ updated_at: updatedAtIso }, resultObj);

  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalObj, null, 2), 'utf8');
    const count = Object.keys(finalObj).length - (finalObj.updated_at ? 1 : 0);
    console.log(`Zapisano ${count} rekordów do ${OUTPUT_FILE} (updated_at: ${updatedAtIso})`);
  } catch (err) {
    console.error('Błąd zapisu pliku:', err);
  }
}

if (require.main === module) {
  fetchAndSave().catch(err => {
    console.error('Nieoczekiwany błąd:', err);
  });
}

module.exports = {
  fetchAndSave
};



//
//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//
