export function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function rowsToCsv(rows) {
  return rows.join("\n");
}

export function sendCsv(res, filename, rows) {
  const csv = rowsToCsv(rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}