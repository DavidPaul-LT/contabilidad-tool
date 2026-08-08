import { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { InvoiceUploader } from "@/components/InvoiceUploader";
import { InvoiceTable } from "@/components/InvoiceTable";
import { TextInput } from "@/components/TextInput";
import {
  extractInvoiceData,
  exportToExcel,
  type InvoiceData,
} from "@/lib/invoiceExtractor";
import { showSuccess, showError } from "@/utils/toast";
import {
  FileSpreadsheet,
  Sparkles,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

const Index = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  const handleTextExtracted = (text: string, filename: string) => {
    try {
      const data = extractInvoiceData(text);
      setInvoices((prev) => [...prev, data]);
      showSuccess(`Factura ${filename} procesada`);
    } catch (err) {
      showError("Error al extraer datos");
    }
  };

  const handleExtractFromText = (text: string) => {
    try {
      const data = extractInvoiceData(text);
      setInvoices((prev) => [...prev, data]);
      showSuccess("Datos extraídos del texto");
    } catch (err) {
      showError("Error al extraer datos");
    }
  };

  const handleExport = () => {
    if (invoices.length === 0) {
      showError("No hay facturas para exportar");
      return;
    }
    const filename = `facturas_${new Date().toISOString().split("T")[0]}.xlsx`;
    exportToExcel(invoices, filename);
    showSuccess(`Archivo ${filename} descargado`);
  };

  const stats = {
    count: invoices.length,
    total: invoices.reduce((acc, inv) => acc + inv.total, 0),
    base: invoices.reduce((acc, inv) => acc + inv.baseImponible, 0),
    iva: invoices.reduce((acc, inv) => acc + inv.cuotaIVA, 0),
  };

  const features = [
    {
      icon: FileSpreadsheet,
      title: "OCR inteligente",
      desc: "Lee PDFs e imágenes automáticamente",
      bg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: BarChart3,
      title: "Editable y ordenable",
      desc: "Revisa y corrige antes de exportar",
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: CheckCircle2,
      title: "Excel listo",
      desc: "Formato compatible con tu app contable",
      bg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  const statCards = [
    {
      label: "Facturas",
      value: String(stats.count),
      color: "text-slate-700",
    },
    {
      label: "Base Imp.",
      value: `${stats.base.toFixed(2)} €`,
      color: "text-blue-700",
    },
    {
      label: "Total IVA",
      value: `${stats.iva.toFixed(2)} €`,
      color: "text-amber-700",
    },
    {
      label: "Total",
      value: `${stats.total.toFixed(2)} €`,
      color: "text-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/40">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">FacturaScan</h1>
              <p className="text-xs text-slate-500">Facturas → Excel contable</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Extracción automática con OCR</span>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        {invoices.length === 0 && (
          <section className="text-center max-w-3xl mx-auto py-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Automatiza tu contabilidad
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Convierte tus facturas en{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                datos contables
              </span>
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              Sube una foto o PDF de tu factura y obtén los datos listos para
              importar en Sage, A3, ContaPlus o cualquier software contable.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {features.map((item, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                >
                  <div
                    className={`${item.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}
                  >
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        {invoices.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map((stat, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
              >
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Uploader y entrada manual */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceUploader onTextExtracted={handleTextExtracted} />
          <TextInput onExtract={handleExtractFromText} />
        </section>

        {/* Tabla de facturas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">
              Facturas procesadas
            </h3>
          </div>
          <InvoiceTable
            invoices={invoices}
            onUpdate={setInvoices}
            onExport={handleExport}
          />
        </section>
      </main>

      <footer className="mt-16 pb-8">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;