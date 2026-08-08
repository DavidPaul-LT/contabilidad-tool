import * as XLSX from "xlsx";

export interface InvoiceData {
  fecha: string;
  numeroFactura: string;
  proveedor: string;
  nif: string;
  baseImponible: number;
  tipoIVA: number;
  cuotaIVA: number;
  total: number;
  rawText?: string;
}

const cleanAmount = (str: string): number => {
  if (!str) return 0;
  // Eliminar símbolos de moneda, espacios y reemplazar coma decimal por punto
  const cleaned = str
    .replace(/[€$£¥]/g, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // eliminar puntos de millares
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const extractInvoiceData = (text: string): InvoiceData => {
  const data: InvoiceData = {
    fecha: "",
    numeroFactura: "",
    proveedor: "",
    nif: "",
    baseImponible: 0,
    tipoIVA: 21,
    cuotaIVA: 0,
    total: 0,
    rawText: text,
  };

  // 1. Fecha - varios formatos comunes
  const fechaPatterns = [
    /(?:fecha|date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
  ];
  for (const pattern of fechaPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.fecha = normalizeDate(match[1]);
      if (data.fecha) break;
    }
  }

  // 2. Número de factura
  const numFacturaPatterns = [
    /(?:n[º°ºo]?\s*(?:de\s*)?factura|factura\s*n[º°ºo]?|invoice\s*(?:number|no\.?))[:\s#]*([a-zA-Z0-9\-\/\.]{2,20})/i,
    /(?:fra\.?|fac\.?)[:\s#]*([a-zA-Z0-9\-\/\.]{2,20})/i,
    /\b(F-\d{4,}|FACTURA\s*\d+|[A-Z]{2,4}[\-\/]?\d{3,})/i,
  ];
  for (const pattern of numFacturaPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.numeroFactura = match[1].trim();
      break;
    }
  }

  // 3. NIF/CIF del proveedor
  const nifPatterns = [
    /(?:nif|cif|n\.i\.f|c\.i\.f|vat)[:\s]*([A-Z]?\d{7,8}[A-Z0-9]?)/i,
    /\b([A-HJ-NP-SUVW]\d{8})\b/, // CIF español
    /\b(\d{8}[A-Z])\b/, // NIF español
    /\b([XYZ]\d{7,8}[A-Z])\b/, // NIE
  ];
  for (const pattern of nifPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.nif = match[1].toUpperCase();
      break;
    }
  }

  // 4. Proveedor - buscar en las primeras líneas (después del logo/encabezado)
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2);
  // Buscar líneas que parezcan nombres de empresa (con S.L., S.A., etc. o en mayúsculas)
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    if (
      /\b(S\.?L\.?(U)?\.?|S\.?A\.?|S\.?C\.?|S\.?R\.?L\.?|LIMITED|LTD\.?|INC\.?|CORP\.?|GMBH|S\.?L\.?\s+U\.?T\.?E\.?)\b/i.test(
        line,
      )
    ) {
      data.proveedor = line;
      break;
    }
  }
  // Si no se encontró, tomar la primera línea con mayúsculas predominantes
  if (!data.proveedor) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.length > 3 && line.length < 60 && /[A-Z]/.test(line)) {
        data.proveedor = line;
        break;
      }
    }
  }

  // 5. Importes - buscar base imponible, IVA y total
  // Total - suele ser el número más grande o estar marcado como TOTAL
  const totalPatterns = [
    /(?:total\s*(?:factura|a\s*pagar|importe)?|importe\s*total|total\s*€)[:\s]*([\d.,]+)\s*€?/i,
    /\bTOTAL[:\s]+([\d.,]+)\b/i,
  ];

  // Base imponible
  const basePatterns = [
    /(?:base\s*imponible|subtotal|base)[:\s]*([\d.,]+)\s*€?/i,
  ];

  // Cuota IVA
  const ivaPatterns = [
    /(?:cuota\s*iva|i\.?v\.?a\.?|cuota)[:\s]*([\d.,]+)\s*€?/i,
  ];

  // Tipo de IVA
  const tipoIVAPatterns = [
    /(?:tipo\s*iva|i\.?v\.?a\.?\s*(\d{1,2})\s*%)/i,
    /(\d{1,2})\s*%\s*iva/i,
    /(\d{1,2})\s*%/,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.total = cleanAmount(match[1]);
      break;
    }
  }

  for (const pattern of basePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.baseImponible = cleanAmount(match[1]);
      break;
    }
  }

  for (const pattern of ivaPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.cuotaIVA = cleanAmount(match[1]);
      break;
    }
  }

  for (const pattern of tipoIVAPatterns) {
    const match = text.match(pattern);
    if (match) {
      const t = parseInt(match[1]);
      if (t === 0 || t === 4 || t === 10 || t === 21) {
        data.tipoIVA = t;
        break;
      }
    }
  }

  // Si tenemos base y cuota pero no total, calcular
  if (data.total === 0 && data.baseImponible > 0 && data.cuotaIVA > 0) {
    data.total = data.baseImponible + data.cuotaIVA;
  }
  // Si tenemos total y cuota pero no base, calcular
  else if (data.baseImponible === 0 && data.total > 0 && data.cuotaIVA > 0) {
    data.baseImponible = data.total - data.cuotaIVA;
  }
  // Si tenemos total y base pero no cuota, calcular según tipo
  else if (data.cuotaIVA === 0 && data.total > 0 && data.baseImponible > 0) {
    data.cuotaIVA = data.total - data.baseImponible;
    if (data.tipoIVA > 0 && data.baseImponible > 0) {
      const calculatedTipo = Math.round(
        (data.cuotaIVA / data.baseImponible) * 100,
      );
      if ([0, 4, 10, 21].includes(calculatedTipo)) {
        data.tipoIVA = calculatedTipo;
      }
    }
  }

  return data;
};

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  // Detectar formato y convertir a YYYY-MM-DD
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length !== 3) return dateStr;

  let year: string, month: string, day: string;

  // Si el primer componente tiene 4 dígitos, es YYYY-MM-DD
  if (parts[0].length === 4) {
    [year, month, day] = parts;
  } else {
    [day, month, year] = parts;
    if (year.length === 2) {
      year = (parseInt(year) > 50 ? "19" : "20") + year;
    }
  }

  const d = day.padStart(2, "0");
  const m = month.padStart(2, "0");
  return `${year}-${m}-${d}`;
};

export const exportToExcel = (
  invoices: InvoiceData[],
  filename: string = "facturas.xlsx",
) => {
  // Formato compatible con software contable español (Sage, A3, ContaPlus)
  const data = invoices.map((inv) => ({
    Fecha: inv.fecha,
    "Nº Factura": inv.numeroFactura,
    Proveedor: inv.proveedor,
    NIF: inv.nif,
    "Base Imponible": inv.baseImponible,
    "Tipo IVA (%)": inv.tipoIVA,
    "Cuota IVA": inv.cuotaIVA,
    Total: inv.total,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Ajustar ancho de columnas
  worksheet["!cols"] = [
    { wch: 12 }, // Fecha
    { wch: 15 }, // Nº Factura
    { wch: 35 }, // Proveedor
    { wch: 12 }, // NIF
    { wch: 14 }, // Base Imponible
    { wch: 10 }, // Tipo IVA
    { wch: 12 }, // Cuota IVA
    { wch: 12 }, // Total
  ];

  // Formato numérico para columnas de importes
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = 4; C <= 7; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellRef];
      if (cell) {
        cell.z = "#,##0.00";
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas");

  // Añadir hoja con resumen por proveedor
  const resumen = invoices.reduce(
    (acc, inv) => {
      const key = inv.nif || inv.proveedor || "Sin identificar";
      if (!acc[key]) {
        acc[key] = {
          Proveedor: inv.proveedor || "Sin nombre",
          NIF: inv.nif,
          "Nº Facturas": 0,
          "Base Imponible": 0,
          "Cuota IVA": 0,
          Total: 0,
        };
      }
      acc[key]["Nº Facturas"]++;
      acc[key]["Base Imponible"] += inv.baseImponible;
      acc[key]["Cuota IVA"] += inv.cuotaIVA;
      acc[key].Total += inv.total;
      return acc;
    },
    {} as Record<string, any>,
  );

  const resumenSheet = XLSX.utils.json_to_sheet(Object.values(resumen));
  resumenSheet["!cols"] = [
    { wch: 35 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  XLSX.writeFile(workbook, filename);
};