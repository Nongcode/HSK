"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useId, useState } from "react";
import { moveChunk } from "@/lib/writing/move";

interface Props {
  chunks: string[];
  /** Chunk indexes in the order they start in the tray (already shuffled). */
  initialOrder: number[];
  disabled: boolean;
  /** Original chunk indexes placed on the answer line, in order. */
  onChange: (placed: number[]) => void;
  onSubmit: () => void;
}

const chipClass =
  "min-h-11 rounded-lg border border-line bg-surface px-4 py-2 font-hanzi text-xl transition-colors enabled:hover:border-accent disabled:opacity-60";

function AnswerChip({
  id,
  text,
  disabled,
  onClick,
}: {
  id: number;
  text: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80" : undefined}
    >
      <button
        type="button"
        lang="zh-Hans"
        disabled={disabled}
        onClick={onClick}
        className={`${chipClass} border-accent`}
        {...attributes}
        {...listeners}
        aria-roledescription="cụm từ có thể kéo"
      >
        {text}
      </button>
    </li>
  );
}

export function SentenceBoard({ chunks, initialOrder, disabled, onChange, onSubmit }: Props) {
  const [placed, setPlaced] = useState<number[]>([]);
  const tray = initialOrder.filter((i) => !placed.includes(i));
  const complete = placed.length === chunks.length;

  const update = (next: number[]) => {
    setPlaced(next);
    onChange(next);
  };
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: [], end: ["Space"] },
    }),
  );
  const label = (id: string | number) => chunks[Number(id)];
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Đã nhấc cụm "${label(active.id)}". Dùng phím mũi tên để di chuyển, Space để thả.`,
    onDragOver: ({ active, over }) =>
      over ? `Cụm "${label(active.id)}" đang ở vị trí ${placed.indexOf(Number(over.id)) + 1}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Đã thả cụm "${label(active.id)}" ở vị trí ${placed.indexOf(Number(over.id)) + 1}.`
        : `Đã thả cụm "${label(active.id)}".`,
    onDragCancel: ({ active }) => `Đã hủy di chuyển cụm "${label(active.id)}".`,
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update(moveChunk(placed, placed.indexOf(Number(active.id)), placed.indexOf(Number(over.id))));
  };

  const place = (i: number) => !disabled && update([...placed, i]);
  const unplace = (i: number) => !disabled && update(placed.filter((p) => p !== i));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[1-9]$/.test(e.key)) {
        const i = tray[Number(e.key) - 1];
        if (i !== undefined) update([...placed, i]);
      } else if (e.key === "Backspace") {
        if (placed.length > 0) update(placed.slice(0, -1));
      } else if (e.key === "Enter" && complete) {
        e.preventDefault(); // keeps a focused button from also firing its click
        onSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="space-y-6">
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={placed} strategy={horizontalListSortingStrategy}>
          <ol
            role="list"
            aria-label="Câu của bạn"
            className="flex min-h-20 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface/60 p-3"
          >
            {placed.length === 0 && (
              <li className="px-1 text-sm text-muted" aria-hidden>
                Chạm các cụm bên dưới để ghép thành câu
              </li>
            )}
            {placed.map((i) => (
              <AnswerChip key={i} id={i} text={chunks[i]} disabled={disabled} onClick={() => unplace(i)} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <div role="group" aria-label="Các cụm từ" className="flex flex-wrap gap-2">
        {tray.map((i, k) => (
          <button
            key={i}
            type="button"
            lang="zh-Hans"
            disabled={disabled}
            onClick={() => place(i)}
            className={`${chipClass} relative`}
          >
            <kbd aria-hidden className="mr-2 font-sans text-xs text-muted">
              {k + 1}
            </kbd>
            {chunks[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
