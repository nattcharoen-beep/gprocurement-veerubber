import fetch from 'node-fetch';

(async () => {
  const res = await fetch('https://process5.gprocurement.go.th/egp-aann09-web/594.e8b320afcf06acbe.js');
  const text = await res.text();

  let pos = 0;
  while ((pos = text.indexOf('keywordSearch', pos)) !== -1) {
    console.log('--- keywordSearch at pos ' + pos + ' ---');
    console.log(text.substring(pos - 100, pos + 250));
    pos += 15;
  }
})();
