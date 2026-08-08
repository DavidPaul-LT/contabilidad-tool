import { useState, useCallback, useRef } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Configurar worker de pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface InvoiceUploaderProps {
  onTextExtracted: (text: string, filename: string) => void;
}

export const InvoiceUploader = ({ onTextExtracted }: InvoiceUploaderProps) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setStatus("Extrayendo texto de la imagen...");
    setProgress(0);

    const result = await Tesseract.recognize(file, "spa+eng", {
      logger: (m: any) => {
        if (m.status === "recognizing text") {
          setProgress(Math.round(m.progress * 100));
        }
        setStatus(m.status);
      },
    });

    return result.data.text;
  };

  const processPDF = async (file: File) => {
    setStatus("Extrayendo texto del PDF...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      setStatus(`Procesando página ${i} de ${pdf.numPages}...`);
      setProgress((i / pdf.numPages) * 50);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText +=
        textContent.items.map((item: any) => item.str).join(" ") + "\n";
    }

    setProgress(60);
    return fullText;
  };

  const processFile = useCallback(
    async (file: File) => {
      setProcessing(true);
      setProgress(0);
      setStatus("");

      try {
        let text = "";
        const fileName = file.name;

        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          text = await processPDF(file);
        } else if (file.type.startsWith("image/")) {
          text = await processImage(file);
        } else {
          throw new Error("Formato no soportado. Usa PDF o imagen (JPG, PNG).");
        }

        if (!text.trim()) {
          toast.warning("No se pudo extraer texto del archivo");
        } else {
          onTextExtracted(text, fileName);
          toast.success(`Texto extraído de ${fileName}`);
        }
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Error al procesar el archivo");
      } finally {
        setProcessing(false);
        setProgress(0);
        setStatus("");
      }
    },
    [onTextExtracted],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      processFile(file);
    },
    [processFile],
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <Card className="border-2 border-dashed border-slate-300 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Upload className="h-5 w-5 text-emerald-600" />
          Subir factura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`relative rounded-xl p-8 text-center transition-all ${
            dragActive
              ? "bg-emerald-50 border-emerald-400"
              : "bg-slate-50 hover:bg-slate-100"
          } border-2 border-dashed cursor-pointer`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {processing ? (
            <div className="space-y-3">
              <Loader2 className="mx-auto h-12 w-12 text-emerald-600 animate-spin" />
              <p className="text-sm text-slate-700 font-medium">{status}</p>
              <Progress value={progress} className="w-full max-w-xs mx-auto" />
              <p className="text-xs text-slate-500">{progress}%</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center gap-3">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <ImageIcon className="h-6 w-6 text-emerald-700" />
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <div>
                <p className="text-base font-medium text-slate-800">
                  Arrastra tu factura aquí
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  o haz clic para seleccionar (PDF, JPG, PNG)
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};