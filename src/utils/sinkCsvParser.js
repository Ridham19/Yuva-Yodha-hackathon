// Sink (Cities, Factories, Houses, Transit) CSV Parser and Serializer for GridPulse SCADA
// Handles RFC-4180 CSV parsing with quote support and type coercion

/**
 * Parses raw CSV text into array of electricity demand sink objects
 * @param {string} csvText
 * @returns {Array<Object>}
 */
export function parseSinksCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = [];
  let currentRow = [];
  let currentToken = '';
  let inQuotes = false;

  // Character by character parser to correctly handle quoted strings with commas and newlines
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // Skip CRLF
      currentRow.push(currentToken.trim());
      if (currentRow.some(col => col.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  // Push final token/row if exists
  if (currentToken.length > 0 || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    if (currentRow.some(col => col.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.trim().toLowerCase());

  const getColIndex = (name) => {
    return headers.findIndex(h => h.replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  };

  const idxId = getColIndex('id');
  const idxName = getColIndex('name');
  const idxCategory = getColIndex('category');
  const idxCity = getColIndex('city');
  const idxState = getColIndex('state');
  const idxLat = getColIndex('latitude') !== -1 ? getColIndex('latitude') : getColIndex('lat');
  const idxLng = getColIndex('longitude') !== -1 ? getColIndex('longitude') : getColIndex('lng');
  const idxRegion = getColIndex('region');
  const idxPeakDemandMw = getColIndex('peakdemandmw');
  const idxBaseDemandMw = getColIndex('basedemandmw');
  const idxCurrentDemandMw = getColIndex('currentdemandmw');
  const idxLoadShedPct = getColIndex('loadshedpct');
  const idxVoltageLevelKv = getColIndex('voltagelevelkv');
  const idxConnectedSubstation = getColIndex('connectedsubstation');
  const idxDiscomOperator = getColIndex('discomoperator') !== -1 ? getColIndex('discomoperator') : getColIndex('operator');
  const idxDescription = getColIndex('description');
  const idxStatus = getColIndex('status');
  const idxDrActive = getColIndex('dractive');
  const idxPriorityLevel = getColIndex('prioritylevel');

  const sinks = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || !row[idxId || 0]) continue;

    const lat = parseFloat(row[idxLat] || '0') || 20.0;
    const lng = parseFloat(row[idxLng] || '0') || 78.0;
    const peakDemand = parseFloat(row[idxPeakDemandMw] || '500') || 500;
    const baseDemand = row[idxBaseDemandMw] !== undefined && row[idxBaseDemandMw] !== ''
      ? parseFloat(row[idxBaseDemandMw])
      : Math.round(peakDemand * 0.85);

    const currentDemand = row[idxCurrentDemandMw] !== undefined && row[idxCurrentDemandMw] !== ''
      ? parseFloat(row[idxCurrentDemandMw])
      : baseDemand;

    const sinkObj = {
      id: row[idxId] || `SNK-${i}`,
      name: row[idxName] || `Demand Center ${i}`,
      category: (row[idxCategory] || 'CITY_METRO').toUpperCase(),
      city: row[idxCity] || '',
      state: row[idxState] || 'India',
      coordinates: [lat, lng],
      region: (row[idxRegion] || 'WR').toUpperCase(),
      peakDemandMw: peakDemand,
      baseDemandMw: baseDemand,
      currentDemandMw: currentDemand,
      loadShedPct: parseFloat(row[idxLoadShedPct] || '0') || 0,
      voltageLevelKv: parseFloat(row[idxVoltageLevelKv] || '66') || 66,
      connectedSubstation: row[idxConnectedSubstation] || 'Main Regional Substation',
      discomOperator: row[idxDiscomOperator] || 'State Distribution Utility',
      operator: row[idxDiscomOperator] || 'State Distribution Utility',
      description: row[idxDescription] || '',
      status: (row[idxStatus] || 'NORMAL').toUpperCase(),
      drActive: String(row[idxDrActive]).toLowerCase() === 'true',
      priorityLevel: (row[idxPriorityLevel] || 'TIER_1_CRITICAL').toUpperCase()
    };

    sinks.push(sinkObj);
  }

  return sinks;
}

/**
 * Serializes an array of demand sink objects back into CSV format
 * @param {Array<Object>} sinks
 * @returns {string}
 */
export function sinksToCsv(sinks) {
  const headers = [
    'id',
    'name',
    'category',
    'city',
    'state',
    'latitude',
    'longitude',
    'region',
    'peakDemandMw',
    'baseDemandMw',
    'currentDemandMw',
    'loadShedPct',
    'voltageLevelKv',
    'connectedSubstation',
    'discomOperator',
    'description',
    'status',
    'drActive',
    'priorityLevel'
  ];

  const escapeCol = (val) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [headers.join(',')];

  sinks.forEach(s => {
    const lat = Array.isArray(s.coordinates) ? s.coordinates[0] : (s.latitude || 0);
    const lng = Array.isArray(s.coordinates) ? s.coordinates[1] : (s.longitude || 0);

    const values = [
      escapeCol(s.id),
      escapeCol(s.name),
      escapeCol(s.category),
      escapeCol(s.city),
      escapeCol(s.state),
      lat,
      lng,
      escapeCol(s.region),
      s.peakDemandMw,
      s.baseDemandMw,
      s.currentDemandMw,
      s.loadShedPct || 0,
      s.voltageLevelKv,
      escapeCol(s.connectedSubstation),
      escapeCol(s.discomOperator || s.operator || ''),
      escapeCol(s.description),
      escapeCol(s.status || 'NORMAL'),
      s.drActive ? 'true' : 'false',
      escapeCol(s.priorityLevel || 'TIER_1_CRITICAL')
    ];

    rows.push(values.join(','));
  });

  return rows.join('\n');
}
