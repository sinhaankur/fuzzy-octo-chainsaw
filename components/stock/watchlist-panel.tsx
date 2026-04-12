'use client'

import { useRef, useState } from 'react'
import { FileUp, ListFilter, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ImportedWatchlistRow } from '@/lib/watchlist-csv'
import { parseWatchlistCsv } from '@/lib/watchlist-csv'
import type { Stock } from '@/lib/stock-data'

interface WatchlistPanelProps {
  stocks: Stock[]
  onAddStock: () => void
  onImportRows: (rows: ImportedWatchlistRow[]) => void
  onRemoveStock: (symbol: string) => void
  onSelectStock: (stock: Stock) => void
}

export function WatchlistPanel({
  stocks,
  onAddStock,
  onImportRows,
  onRemoveStock,
  onSelectStock,
}: WatchlistPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importMessage, setImportMessage] = useState<string>('')

  const countries = new Set(stocks.map((stock) => stock.location.country)).size
  const sectors = new Set(stocks.map((stock) => stock.sector)).size

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const rows = parseWatchlistCsv(text)

      if (rows.length === 0) {
        setImportMessage('No valid rows found in CSV. Add at least a symbol/ticker column with values.')
        return
      }

      onImportRows(rows)
      setImportMessage(`Imported ${rows.length} row(s) from ${file.name}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV import failed.'
      setImportMessage(message)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <Card className="h-full border-border bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Stock Universe</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload CSV to map stock location and line of business.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {stocks.length} symbols
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-2" onClick={onAddStock}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleUploadClick}>
            <FileUp className="h-4 w-4" />
            Upload CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {importMessage ? (
          <p className="text-xs text-muted-foreground">{importMessage}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Expected columns: symbol/ticker, name, business/sector, country, city, latitude, longitude, shares.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <SummaryPill label="Countries" value={countries.toString()} />
          <SummaryPill label="Businesses" value={sectors.toString()} />
          <SummaryPill label="Mapped" value={stocks.filter((stock) => stock.location.country).length.toString()} />
        </div>
      </CardHeader>

      <CardContent className="h-[58vh] overflow-auto pr-2">
        <div className="space-y-2">
          {stocks.map((stock) => (
            <button
              key={stock.symbol}
              type="button"
              onClick={() => onSelectStock(stock)}
              className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-left transition hover:bg-secondary/50"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{stock.symbol}</p>
                  <p className="truncate text-xs text-muted-foreground">{stock.name}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveStock(stock.symbol)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <ListFilter className="h-3.5 w-3.5" />
                <span>
                  {stock.location.city}, {stock.location.country}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">
                  {stock.sector}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {stock.exchange}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {stock.shares.toFixed(2)} shares
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
