// Power Plant CSV Parser and Serializer for GridPulse SCADA
// Handles RFC-4180 CSV parsing with quote support and type coercion

/**
 * Parses raw CSV text into array of power plant source objects
 * @param {string} csvText
 * @returns {Array<Object>}
 */
export function parsePowerPlantsCsv(csvText) {
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
  const idxLocation = getColIndex('location');
  const idxState = getColIndex('state');
  const idxRiverBasin = getColIndex('riverbasin');
  const idxLat = getColIndex('latitude') !== -1 ? getColIndex('latitude') : getColIndex('lat');
  const idxLng = getColIndex('longitude') !== -1 ? getColIndex('longitude') : getColIndex('lng');
  const idxRegion = getColIndex('region');
  const idxType = getColIndex('type');
  const idxSubtype = getColIndex('subtype');
  const idxCapacityMw = getColIndex('capacitymw');
  const idxCurrentGenMw = getColIndex('currentgenmw');
  const idxMinDispatchMw = getColIndex('mindispatchmw');
  const idxMaxDispatchMw = getColIndex('maxdispatchmw');
  const idxVoltageKv = getColIndex('voltagekv');
  const idxUnitsCount = getColIndex('unitscount');
  const idxUnitDetails = getColIndex('unitdetails');
  const idxFuelType = getColIndex('fueltype');
  const idxOperator = getColIndex('operator');
  const idxDescription = getColIndex('description');
  const idxStatus = getColIndex('status');
  const idxCurtailed = getColIndex('curtailed');
  const idxCorridorTarget = getColIndex('corridortarget');

  const sources = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || !row[idxId || 0]) continue;

    const lat = parseFloat(row[idxLat] || '0') || 20.0;
    const lng = parseFloat(row[idxLng] || '0') || 78.0;
    const capacity = parseFloat(row[idxCapacityMw] || '100') || 100;
    const currentGen = row[idxCurrentGenMw] !== undefined && row[idxCurrentGenMw] !== ''
      ? parseFloat(row[idxCurrentGenMw])
      : Math.round(capacity * 0.85);

    const minDispatch = row[idxMinDispatchMw] !== undefined && row[idxMinDispatchMw] !== ''
      ? parseFloat(row[idxMinDispatchMw])
      : Math.round(capacity * 0.2);

    const maxDispatch = row[idxMaxDispatchMw] !== undefined && row[idxMaxDispatchMw] !== ''
      ? parseFloat(row[idxMaxDispatchMw])
      : capacity;

    const sourceObj = {
      id: row[idxId] || `SRC-${i}`,
      name: row[idxName] || `Power Plant ${i}`,
      location: row[idxLocation] || '',
      state: row[idxState] || 'India',
      riverBasin: idxRiverBasin !== -1 ? row[idxRiverBasin] : undefined,
      coordinates: [lat, lng],
      region: (row[idxRegion] || 'WR').toUpperCase(),
      type: (row[idxType] || 'THERMAL_COAL').toUpperCase(),
      subtype: row[idxSubtype] || 'Base Generation Station',
      capacityMw: capacity,
      currentGenMw: currentGen,
      minDispatchMw: minDispatch,
      maxDispatchMw: maxDispatch,
      voltageKv: parseFloat(row[idxVoltageKv] || '400') || 400,
      unitsCount: parseInt(row[idxUnitsCount] || '1', 10) || 1,
      unitDetails: idxUnitDetails !== -1 ? row[idxUnitDetails] : undefined,
      fuelType: idxFuelType !== -1 ? row[idxFuelType] : undefined,
      operator: row[idxOperator] || 'State / Central Genco',
      description: row[idxDescription] || '',
      status: (row[idxStatus] || 'ONLINE').toUpperCase(),
      curtailed: String(row[idxCurtailed]).toLowerCase() === 'true',
      corridorTarget: row[idxCorridorTarget] || 'SNK-DELHI'
    };

    sources.push(sourceObj);
  }

  return sources;
}

/**
 * Serializes an array of power plant source objects back into CSV format
 * @param {Array<Object>} sources
 * @returns {string}
 */
export function sourcesToCsv(sources) {
  const headers = [
    'id',
    'name',
    'location',
    'state',
    'riverBasin',
    'latitude',
    'longitude',
    'region',
    'type',
    'subtype',
    'capacityMw',
    'currentGenMw',
    'minDispatchMw',
    'maxDispatchMw',
    'voltageKv',
    'unitsCount',
    'unitDetails',
    'fuelType',
    'operator',
    'description',
    'status',
    'curtailed',
    'corridorTarget'
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

  sources.forEach(s => {
    const lat = Array.isArray(s.coordinates) ? s.coordinates[0] : (s.latitude || 0);
    const lng = Array.isArray(s.coordinates) ? s.coordinates[1] : (s.longitude || 0);

    const values = [
      escapeCol(s.id),
      escapeCol(s.name),
      escapeCol(s.location),
      escapeCol(s.state),
      escapeCol(s.riverBasin || ''),
      lat,
      lng,
      escapeCol(s.region),
      escapeCol(s.type),
      escapeCol(s.subtype),
      s.capacityMw,
      s.currentGenMw,
      s.minDispatchMw,
      s.maxDispatchMw,
      s.voltageKv,
      s.unitsCount || 1,
      escapeCol(s.unitDetails || ''),
      escapeCol(s.fuelType || ''),
      escapeCol(s.operator),
      escapeCol(s.description),
      escapeCol(s.status || 'ONLINE'),
      s.curtailed ? 'true' : 'false',
      escapeCol(s.corridorTarget || '')
    ];

    rows.push(values.join(','));
  });

  return rows.join('\n');
}
