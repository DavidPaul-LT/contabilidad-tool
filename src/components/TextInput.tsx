import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2 } from "lucide-react";

interface TextInputProps {
  onExtract: (text: string) => void;
}

export const TextInput = ({ onExtract }: TextInputProps) => {
  const [text, setText] = useState("");

  const handleExtract = () => {
    if (!text.trim()) return;
    onExtract(text);
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Wand2 className="h-5 w-5 text-purple-600" />
          O pegar texto manualmente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Pega aquí el texto de la factura (copiado de un PDF, email, etc.)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <Button
          onClick={handleExtract}
          disabled={!text.trim()}
          className="mt-3 bg-purple-600 hover:bg-purple-700"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Extraer datos
        </Button>
      </CardContent>
    </Card>
  );
};