import { motion } from "framer-motion";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  maxLength?: number;
}

export function NumberPad({
  value,
  onChange,
  onEnter,
  maxLength = 10,
}: NumberPadProps) {
  const handlePress = (char: string) => {
    if (value.length < maxLength) {
      onChange(value + char);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  const buttons = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    ".", "0", "⌫",
  ];

  return (
    <Card className="border-0 bg-muted/30">
      <CardContent className="p-3">
        {/* Display */}
        <div className="mb-3 p-3 bg-background rounded-lg border text-right">
          <span className="text-2xl font-mono font-bold">
            {value || "0"}
          </span>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {buttons.map((btn) => (
            <motion.div
              key={btn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={btn === "⌫" ? "outline" : "secondary"}
                className="w-full h-12 text-lg font-medium"
                onClick={() => {
                  if (btn === "⌫") {
                    handleBackspace();
                  } else {
                    handlePress(btn);
                  }
                }}
              >
                {btn === "⌫" ? <Delete className="w-5 h-5" /> : btn}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            variant="outline"
            className="h-12"
            onClick={handleClear}
          >
            Clear
          </Button>
          {onEnter && (
            <Button
              className="h-12"
              onClick={onEnter}
            >
              Enter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default NumberPad;
