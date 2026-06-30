'use client'

import { clsx } from 'clsx'
import type { GenesisHqKanbanColumn, GenesisHqKanbanCard } from '@/lib/genesis-hq/types'
import { GENESIS_HQ_KANBAN_COLUMN_COLORS } from '@/lib/genesis-hq/constants'
import { PriorityBadge } from './atoms'

export function KanbanBoard({
  columns,
  isOwner,
  onMoveCard,
}: {
  columns: GenesisHqKanbanColumn[]
  isOwner: boolean
  onMoveCard: (cardId: string, columnKey: GenesisHqKanbanColumn['key']) => void
}) {
  if (columns.length === 0) {
    return (
      <div className="text-center py-16 text-slate-600">
        <div className="font-mono text-sm">No kanban data yet</div>
        <div className="text-[11px] mt-1">Seed Genesis HQ from the Admin tab to load the board</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {columns.map((column) => (
        <KanbanColumn key={column.id} column={column} isOwner={isOwner} onMoveCard={onMoveCard} />
      ))}
    </div>
  )
}

function KanbanColumn({
  column,
  isOwner,
  onMoveCard,
}: {
  column: GenesisHqKanbanColumn
  isOwner: boolean
  onMoveCard: (cardId: string, columnKey: GenesisHqKanbanColumn['key']) => void
}) {
  const cards = column.cards ?? []
  return (
    <div
      className="rounded-lg border p-2 space-y-2 min-h-[200px]"
      style={{ borderColor: `${column.color}30`, background: `${column.color}08` }}
      onDragOver={(e) => isOwner && e.preventDefault()}
      onDrop={(e) => {
        if (!isOwner) return
        const cardId = e.dataTransfer.getData('text/plain')
        if (cardId) onMoveCard(cardId, column.key)
      }}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-mono font-bold" style={{ color: column.color }}>{column.label}</span>
        <span className="text-[9px] text-slate-500 font-mono">{cards.length}</span>
      </div>
      {cards.map((card) => <KanbanCard key={card.id} card={card} isOwner={isOwner} />)}
    </div>
  )
}

function KanbanCard({ card, isOwner }: { card: GenesisHqKanbanCard; isOwner: boolean }) {
  return (
    <div
      draggable={isOwner}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', card.id)}
      className={clsx(
        'rounded-md p-2 bg-atlas-panel border border-white/10 text-[11px] text-slate-300',
        isOwner ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      )}
      style={{ borderLeftColor: GENESIS_HQ_KANBAN_COLUMN_COLORS[card.column_key], borderLeftWidth: 3 }}
    >
      <div className="mb-1.5">{card.text}</div>
      <div className="flex items-center justify-between">
        {card.phase_label && <span className="text-[9px] text-slate-500">{card.phase_label}</span>}
        <PriorityBadge priority={card.priority} />
      </div>
    </div>
  )
}
