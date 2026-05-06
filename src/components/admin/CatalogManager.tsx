'use client'

/* eslint-disable react-hooks/refs */

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, useTransition } from 'react'
import { GoodGlyph, iconLabels, iconOptions } from '@/lib/icons'
import type { GoodView, PricingMode, SettingsView } from '@/types/domain'

const colorOptions = ['#171717', '#7d7a73', '#d7d2c8', '#f5f1ea', '#d9513f', '#e77d35', '#d7ad35', '#4f9d61']

function makeNewGood(order: number): GoodView {
  return {
    id: `new-${crypto.randomUUID()}`,
    name: 'Новый товар',
    description: 'Краткое описание для калькулятора',
    icon: 'dots',
    color: '#171717',
    pricingMode: 'area',
    pricePerSqm: 0,
    fixedPrice: null,
    enabled: true,
    required: false,
    selectedByDefault: false,
    order,
  }
}

function SortableGoodRow({
  good,
  index,
  onChange,
  onArchive,
}: {
  good: GoodView
  index: number
  onChange: (good: GoodView) => void
  onArchive: (id: string) => void
}) {
  const sortable = useSortable({ id: good.id })
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  }

  function patch(update: Partial<GoodView>) {
    onChange({ ...good, ...update })
  }

  return (
    <motion.article
      ref={sortable.setNodeRef}
      style={style}
      className="catalog-row panel-card"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <div className="catalog-row-meta">
        <button className="drag-handle" type="button" {...sortable.attributes} {...sortable.listeners} aria-label="Переместить товар">
          <span />
          <span />
          <span />
        </button>
        <span className="catalog-order">{String(index + 1).padStart(2, '0')}</span>
        <span className={`visibility-pill ${good.enabled ? 'visible' : ''}`}>{good.enabled ? 'Виден' : 'Скрыт'}</span>
      </div>
      <div className="catalog-main-fields">
        <label>
          Название
          <input value={good.name} onChange={(event) => patch({ name: event.target.value })} />
        </label>
        <label>
          Описание
          <input value={good.description ?? ''} onChange={(event) => patch({ description: event.target.value })} />
        </label>
      </div>
      <div className="catalog-price-fields">
        <label>
          Режим
          <select value={good.pricingMode} onChange={(event) => patch({ pricingMode: event.target.value as PricingMode })}>
            <option value="area">₽/м²</option>
            <option value="fixed">Фикс.</option>
          </select>
        </label>
        <label>
          Цена
          <input
            type="number"
            min="0"
            value={good.pricingMode === 'area' ? good.pricePerSqm ?? 0 : good.fixedPrice ?? 0}
            onChange={(event) => {
              const value = Math.max(0, Number(event.target.value))
              patch(good.pricingMode === 'area' ? { pricePerSqm: value } : { fixedPrice: value })
            }}
          />
        </label>
      </div>
      <div className="admin-field-group">
        <span className="field-group-label">Иконка</span>
        <div className="icon-picker" aria-label="Иконка">
          {iconOptions.map((icon) => (
            <button
              key={icon}
              type="button"
              className={good.icon === icon ? 'selected' : ''}
              onClick={() => patch({ icon })}
              title={iconLabels[icon]}
            >
              <GoodGlyph name={icon} />
            </button>
          ))}
        </div>
      </div>
      <div className="admin-field-group">
        <span className="field-group-label">Акцент</span>
        <div className="color-picker" aria-label="Цвет">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              className={good.color === color ? 'selected' : ''}
              style={{ background: color }}
              onClick={() => patch({ color })}
              aria-label={`Цвет ${color}`}
            />
          ))}
        </div>
      </div>
      <div className="catalog-switches">
        <label className="switch-control">
          <input type="checkbox" checked={good.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />
          <span className="switch-track" />
          <span>Включён</span>
        </label>
        <label className="switch-control">
          <input type="checkbox" checked={good.required} onChange={(event) => patch({ required: event.target.checked, selectedByDefault: event.target.checked ? true : good.selectedByDefault })} />
          <span className="switch-track" />
          <span>Обязательный</span>
        </label>
        <label className="switch-control">
          <input type="checkbox" checked={good.selectedByDefault} disabled={good.required} onChange={(event) => patch({ selectedByDefault: event.target.checked })} />
          <span className="switch-track" />
          <span>По умолчанию</span>
        </label>
      </div>
      <button className="archive-button" type="button" onClick={() => onArchive(good.id)}>Архив</button>
    </motion.article>
  )
}

export function CatalogManager({ initialGoods, settings }: { initialGoods: GoodView[]; settings: SettingsView }) {
  const [goods, setGoods] = useState(initialGoods)
  const [archivedIds, setArchivedIds] = useState<string[]>([])
  const [status, setStatus] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const enabledCount = useMemo(() => goods.filter((good) => good.enabled).length, [goods])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setGoods((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      return arrayMove(items, oldIndex, newIndex).map((item, index) => ({ ...item, order: index + 1 }))
    })
  }

  function updateGood(updatedGood: GoodView) {
    setGoods((items) => items.map((item) => (item.id === updatedGood.id ? updatedGood : item)))
  }

  function archiveGood(id: string) {
    setGoods((items) => items.filter((item) => item.id !== id))
    if (!id.startsWith('new-')) setArchivedIds((items) => [...items, id])
  }

  function addGood() {
    setGoods((items) => [...items, makeNewGood(items.length + 1)])
  }

  function save() {
    setStatus('')
    startTransition(async () => {
      const response = await fetch('/api/admin/catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goods, archivedIds }),
      })

      if (!response.ok) {
        setStatus('Не удалось сохранить каталог. Проверьте поля.')
        return
      }

      setArchivedIds([])
      setStatus('Каталог сохранён')
      window.setTimeout(() => setStatus(''), 2200)
      window.location.reload()
    })
  }

  return (
    <div className="admin-stack">
      <header className="admin-header-row">
        <div>
          <p className="eyebrow">Admin Catalog</p>
          <h2>Товары расчёта</h2>
          <p className="muted">{enabledCount} видно клиентам · карточка использует порядок каталога · бренд: {settings.brandName}</p>
        </div>
        <div className="admin-actions">
          <button className="button button-light" type="button" onClick={addGood}>+ Добавить товар</button>
          <button className="button button-dark" type="button" onClick={save} disabled={isPending}>{isPending ? 'Сохраняем' : 'Сохранить'}</button>
        </div>
      </header>

      {status ? <p className="save-status">{status}</p> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={goods.map((good) => good.id)} strategy={verticalListSortingStrategy}>
          <div className="catalog-list">
            <AnimatePresence initial={false}>
              {goods.map((good, index) => (
                <SortableGoodRow key={good.id} good={good} index={index} onChange={updateGood} onArchive={archiveGood} />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
