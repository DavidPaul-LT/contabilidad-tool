import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Plus,
} from "lucide-react";
import type { InvoiceData } from "@/lib/invoiceExtractor";
import { showSuccess } from "@/utils/toast";

interface InvoiceTableProps {
  invoices: InvoiceData[];
  onUpdate: (invoices: InvoiceData[]) => void;
  onExport: () => void;
}

type SortField = keyof InvoiceData;
type SortDirection = "asc" | "desc";

export const InvoiceTable = ({
  invoices,
  onUpdate,
  onExport,
}: InvoiceTableProps) => {
  const [sortField, setSortField] = useState<SortField>("fecha");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filter, setFilter] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    let comparison = 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const filteredInvoices = sortedInvoices.filter((inv) => {
    const searchStr =
      `${inv.fecha} ${inv.numeroFactura} ${inv.proveedor} ${inv.nif}`.toLowerCase();
    return searchStr.includes(filter.toLowerCase());
  });

  const updateInvoice = (
    index: number,
    field: keyof InvoiceData,
    value: string | number,
  ) => {
    const updated = [...invoices];
    const realIndex = invoices.indexOf(sortedInvoices[index]);
    updated[realIndex] = { ...updated[realIndex], [field]: value };
    onUpdate(updated);
  };

  const removeInvoice = (index: number) => {
    const realIndex = invoices.indexOf(sortedInvoices[index]);
    const updated = invoices.filter((_, i) => i !== realIndex);
    onUpdate(updated);
    showSuccess("Factura eliminada");
  };

  const addEmptyRow = () => {
    const newInvoice: InvoiceData = {
      fecha: new Date().toISOString().split("T")[0],
      numeroFactura: "",
      proveedor: "",
      nif: "",
      baseImponible: 0,
      tipoIVA: 21,
      cuotaIVA: 0,
      total: 0,
    };
    onUpdate([...invoices, newInvoice]);
    showSuccess("Nueva fila añadida");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  const totals = filteredInvoices.reduce(
    (acc, inv) => ({
      base: acc.base + inv.baseImponible,
      iva: acc.iva + inv.cuotaIVA,
      total: acc.total + inv.total,
    }),
    { base: 0, iva: 0, total: 0 },
  );

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">
          No hay facturas. Sube un archivo o añade una fila manualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <Input
          placeholder="🔍 Buscar por proveedor, NIF o número..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button onClick={addEmptyRow} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Añadir fila
          </Button>
          <Button
            onClick={onExport}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="px-3 py-3 text-left cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("fecha")}
                >
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    Fecha <SortIcon field="fecha" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("numeroFactura")}
                >
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    Nº Factura <SortIcon field="numeroFactura" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("proveedor")}
                >
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    Proveedor <SortIcon field="proveedor" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("nif")}
                >
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    NIF/CIF <SortIcon field="nif" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("baseImponible")}
                >
                  <div className="flex items-center justify-end gap-1 font-semibold text-slate-700">
                    Base Imp. <SortIcon field="baseImponible" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-center cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("tipoIVA")}
                >
                  <div className="flex items-center justify-center gap-1 font-semibold text-slate-700">
                    % IVA <SortIcon field="tipoIVA" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("cuotaIVA")}
                >
                  <div className="flex items-center justify-end gap-1 font-semibold text-slate-700">
                    Cuota IVA <SortIcon field="cuotaIVA" />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("total")}
                >
                  <div className="flex items-center justify-end gap-1 font-semibold text-slate-700">
                    Total <SortIcon field="total" />
                  </div>
                </th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-2 py-2">
                    <Input
                      type="date"
                      value={inv.fecha}
                      onChange={(e) =>
                        updateInvoice(idx, "fecha", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={inv.numeroFactura}
                      onChange={(e) =>
                        updateInvoice(idx, "numeroFactura", e.target.value)
                      }
                      className="h-8 text-xs"
                      placeholder="F-0001"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={inv.proveedor}
                      onChange={(e) =>
                        updateInvoice(idx, "proveedor", e.target.value)
                      }
                      className="h-8 text-xs min-w-[180px]"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={inv.nif}
                      onChange={(e) =>
                        updateInvoice(idx, "nif", e.target.value.toUpperCase())
                      }
                      className="h-8 text-xs w-24"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={inv.baseImponible}
                      onChange={(e) =>
                        updateInvoice(
                          idx,
                          "baseImponible",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="h-8 text-xs w-24 text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Select
                      value={String(inv.tipoIVA)}
                      onValueChange={(v) =>
                        updateInvoice(idx, "tipoIVA", parseInt(v))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="4">4%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="21">21%</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={inv.cuotaIVA}
                      onChange={(e) =>
                        updateInvoice(
                          idx,
                          "cuotaIVA",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="h-8 text-xs w-24 text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={inv.total}
                      onChange={(e) =>
                        updateInvoice(idx, "total", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs w-24 text-right font-semibold"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInvoice(idx)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr>
                <td colSpan={4} className="px-3 py-3 text-right font-bold text-slate-700">
                  TOTALES ({filteredInvoices.length} facturas):
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-800">
                  {totals.base.toFixed(2)} €
                </td>
                <td></td>
                <td className="px-3 py-3 text-right font-bold text-slate-800">
                  {totals.iva.toFixed(2)} €
                </td>
                <td className="px-3 py-3 text-right font-bold text-emerald-700 text-base">
                  {totals.total.toFixed(2)} €
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};