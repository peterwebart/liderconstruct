'use client'

import { Search } from 'lucide-react'
import React, { useState } from 'react'

import { Button, Input, QuantityStepper } from '@/components/ui'

/** Stateful demos for the gallery (client island). */
export function InteractiveDemos(): React.JSX.Element {
  const [qty, setQty] = useState(2)
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-4">
      <QuantityStepper value={qty} onChange={setQty} />
      <Button
        loading={loading}
        onClick={() => {
          setLoading(true)
          setTimeout(() => setLoading(false), 1200)
        }}
      >
        Adaugă în comandă
      </Button>
      <Input
        iconStart={<Search className="size-4" />}
        placeholder="Caută produs, SKU, brand…"
        className="w-72"
      />
    </div>
  )
}
