/**
 * Transparencia de precios del fixture sintético.
 * Dos variaciones consecutivas necesitan tres cierres (t0, t1, t2).
 * No publica coeficientes, dosis, distancias ni la fórmula del motor.
 */
export function buildPublicPriceInputs(race, ranking) {
  if (!race || !Array.isArray(race.entries) || race.entries.length !== 12 ||
      !Array.isArray(ranking) || ranking.length !== 12) {
    throw new Error('Acta incompleta: se requieren doce corredores');
  }
  const bySymbol = new Map(race.entries.map(entry => [entry.symbol, entry]));
  if (bySymbol.size !== 12) throw new Error('Acta inválida: símbolos repetidos');
  const seen = new Set();
  const rows = ranking.map((profile, position) => {
    const symbol = profile?.entry?.symbol;
    const entry = bySymbol.get(symbol);
    if (!entry || seen.has(symbol)) throw new Error('Clasificación inválida');
    seen.add(symbol);
    const prices = [entry.priceAtStart, entry.priceAtMid, entry.priceAtFinish];
    if (!prices.every(value => typeof value === 'number' && Number.isFinite(value) && value > 0)) {
      throw new Error('Faltan cotizaciones válidas para ' + symbol);
    }
    const variation1 = 100 * (prices[1] / prices[0] - 1);
    const variation2 = 100 * (prices[2] / prices[1] - 1);
    const nearlyEqual = (a,b) => Math.abs(a-b) <= 1e-9 * Math.max(1,Math.abs(a),Math.abs(b));
    if (!nearlyEqual(variation1, entry.input1) || !nearlyEqual(variation2, entry.input2)) {
      throw new Error('Los precios no coinciden con los inputs usados por el motor: ' + symbol);
    }
    return Object.freeze({
      position: position + 1,
      symbol,
      name: String(entry.name || symbol),
      // Round-trip decimal of the original Float32-backed fixture number; never fabricate decimals.
      prices: Object.freeze(prices.map(value => String(value)))
    });
  });
  return Object.freeze({
    day: race.day,
    raceNumber: race.number,
    mode: 'synthetic-demo',
    priceCount: rows.length * 3,
    inputCount: rows.length * 2,
    rows: Object.freeze(rows)
  });
}
function cell(tag, content) {
  const element = document.createElement(tag);
  element.textContent = content;
  return element;
}
export function mountPriceTransparency(host, getSelectedRace) {
  if (!host) throw new Error('Falta el contenedor para la auditoría');
  const details = document.createElement('details');
  details.className = 'crp-price-transparency';
  details.style.cssText = 'margin-top:20px;padding:14px;border:1px solid #3d5b4b;border-radius:7px;background:#091b15;';
  const summary = document.createElement('summary');
  summary.textContent = 'VER LAS COTIZACIONES UTILIZADAS EN ESTA CARRERA';
  summary.style.cssText = 'cursor:pointer;font-weight:800;letter-spacing:.04em;color:#d8c08c;';
  details.append(summary);
  const description = document.createElement('p');
  description.style.cssText = 'font-size:12px;line-height:1.6;color:#b4cabb;';
  description.textContent = 'Fixture de demostración con precios sintéticos. El motor utiliza dos variaciones porcentuales consecutivas por caballo: cada variación requiere dos cierres y ambas comparten el precio intermedio. Por eso se muestran tres precios por corredor (36 cotizaciones para 24 inputs), sin revelar el algoritmo propietario.';
  details.append(description);
  const scroller = document.createElement('div');
  scroller.style.cssText = 'overflow-x:auto;max-width:100%';
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;';
  const head = document.createElement('thead');
  const headings = document.createElement('tr');
  ['Puesto','Caballo','Precio inicial','Precio minuto 1','Precio minuto 2'].forEach(value => headings.append(cell('th',value)));
  head.append(headings);
  table.append(head);
  const body = document.createElement('tbody');
  table.append(body);
  scroller.append(table);
  details.append(scroller);
  host.append(details);
  function refresh() {
    details.open = false;
    body.replaceChildren();
    try {
      const {race,ranking} = getSelectedRace();
      const audit = buildPublicPriceInputs(race,ranking);
      for (const row of audit.rows) {
        const tr = document.createElement('tr');
        [String(row.position),row.symbol,...row.prices].forEach(value => {
          const td = cell('td',value);
          td.style.cssText = 'padding:8px;border-bottom:1px solid #30493b;white-space:nowrap;';
          tr.append(td);
        });
        body.append(tr);
      }
    } catch (error) {
      const message = document.createElement('p');
      message.textContent = 'No se pudieron validar los precios de esta carrera: ' + error.message;
      body.replaceChildren();
      const tr=document.createElement('tr'),td=document.createElement('td');
      td.colSpan=5;td.append(message);tr.append(td);body.append(tr);
      details.open=true;
    }
  }
  refresh();
  return { refresh };
}
