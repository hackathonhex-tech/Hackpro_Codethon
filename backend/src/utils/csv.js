export const parseCsv = (csvString) => {
  if (!csvString || !csvString.trim()) return [];
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let inQuotes = false;
    let currentValue = '';

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^["']|["']$/g, ''));

    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] || '';
    });
    results.push(obj);
  }

  return results;
};

export const toCsv = (rows, headers) => {
  if (!rows || !rows.length) return '';
  const resolvedHeaders = headers || Object.keys(rows[0]);
  const headerLine = resolvedHeaders.join(',');
  const lines = rows.map((row) =>
    resolvedHeaders
      .map((header) => {
        const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(',')
  );
  return [headerLine, ...lines].join('\n');
};
