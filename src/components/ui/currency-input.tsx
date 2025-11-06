import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: string
  onValueChange?: (value: string) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("")

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCurrency(value))
      }
    }, [value])

    const formatCurrency = (val: string) => {
      if (!val) return ""
      
      // Remove tudo que não é número
      const numbers = val.replace(/\D/g, "")
      
      if (!numbers) return ""
      
      // Converte para número (em centavos)
      const amount = parseInt(numbers) / 100
      
      // Formata como moeda brasileira
      return amount.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const formatted = formatCurrency(inputValue)
      setDisplayValue(formatted)
      
      // Retorna o valor numérico sem formatação
      const numbers = inputValue.replace(/\D/g, "")
      const numericValue = numbers ? (parseInt(numbers) / 100).toString() : ""
      
      if (onValueChange) {
        onValueChange(numericValue)
      }
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn("pl-10", className)}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
