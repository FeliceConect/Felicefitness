'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { GripVertical, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { WidgetPreview } from './widget-preview'
import { DEFAULT_WIDGETS } from '@/types/widgets'
import type { WidgetConfig, WidgetDefinition } from '@/types/widgets'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface WidgetGalleryProps {
  activeWidgets: WidgetConfig[]
  onReorder: (widgets: WidgetConfig[]) => void
  onToggle: (widgetId: string, enabled: boolean) => void
  onAdd: (widgetType: string) => void
  onRemove: (widgetId: string) => void
}

interface SortableWidgetItemProps {
  widget: WidgetConfig
  definition: WidgetDefinition | undefined
  onToggle: (enabled: boolean) => void
  onRemove: () => void
}

function SortableWidgetItem({ widget, definition, onToggle }: SortableWidgetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/30',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
        <span className="text-sm">{definition?.icon || '📦'}</span>
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium">{definition?.name || widget.type}</p>
        <p className="text-xs text-muted-foreground">{widget.size}</p>
      </div>

      <Switch
        checked={widget.enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-purple-600"
      />
    </div>
  )
}

export function WidgetGallery({
  activeWidgets,
  onReorder,
  onToggle,
  onAdd,
  onRemove,
}: WidgetGalleryProps) {
  const [showAvailable, setShowAvailable] = useState(true)
  const [showPreview, setShowPreview] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = activeWidgets.findIndex((w) => w.id === active.id)
      const newIndex = activeWidgets.findIndex((w) => w.id === over.id)

      const newWidgets = arrayMove(activeWidgets, oldIndex, newIndex).map((w, i) => ({
        ...w,
        order: i,
      }))

      onReorder(newWidgets)
    }
  }

  const getDefinition = (type: string) => DEFAULT_WIDGETS.find((d) => d.type === type)

  const activeTypes = activeWidgets.map((w) => w.type)
  const availableWidgets = DEFAULT_WIDGETS.filter((d) => !activeTypes.includes(d.type))

  return (
    <div className="space-y-6">
      {/* Active Widgets */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            Widgets Ativos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Arraste para reordenar
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeWidgets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum widget ativo. Adicione widgets abaixo.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeWidgets.map((w) => w.id)}
                strategy={verticalListSortingStrategy}
              >
                {activeWidgets.map((widget) => (
                  <SortableWidgetItem
                    key={widget.id}
                    widget={widget}
                    definition={getDefinition(widget.type)}
                    onToggle={(enabled) => onToggle(widget.id, enabled)}
                    onRemove={() => onRemove(widget.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Available Widgets */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowAvailable(!showAvailable)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              Widgets Disponiveis
            </CardTitle>
            {showAvailable ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showAvailable && (
          <CardContent className="space-y-2">
            {availableWidgets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todos os widgets estao ativos!
              </p>
            ) : (
              availableWidgets.map((widget) => (
                <div
                  key={widget.type}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/10"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <span className="text-sm">{widget.icon}</span>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium">{widget.name}</p>
                    <p className="text-xs text-muted-foreground">{widget.description}</p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-purple-500/30 hover:bg-purple-500/10"
                    onClick={() => onAdd(widget.type)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Preview */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="text-base">Preview</CardTitle>
            {showPreview ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {activeWidgets
                .filter((w) => w.enabled)
                .slice(0, 4)
                .map((widget) => (
                  <WidgetPreview
                    key={widget.id}
                    type={widget.type}
                    size={widget.size === 'large' ? 'medium' : widget.size}
                    className={cn(
                      widget.size === 'large' && 'col-span-2'
                    )}
                  />
                ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
