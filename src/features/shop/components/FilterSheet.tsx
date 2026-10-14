import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react";
import type { FilterSheetProps } from "@/features/shop/models";

/** Mobile bottom sheet that hosts the filter panel. */
export function FilterSheet({ open, onClose, onClear, resultCount, children }: FilterSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-ink/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl bg-paper lg:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="display text-2xl">Filters</h2>
              <button className="grid size-11 place-items-center hover:bg-ink/5" onClick={onClose} aria-label="Close filters">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            <div className="flex gap-3 border-t border-line p-4">
              <button className="btn-ghost flex-1" onClick={onClear}>
                Clear
              </button>
              <button className="btn-dark flex-[2]" onClick={onClose}>
                Show {resultCount} products
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
