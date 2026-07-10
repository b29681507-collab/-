import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { trainingMemoryCorpus } from "./trainingMemoryCorpus";
import type { MemoryUnit } from "../domain/memory";

interface MemoryStoreValue {
  memoryUnits: MemoryUnit[];
  addMemoryUnit: (unit: MemoryUnit) => void;
  updateMemoryUnit: (id: string, update: (unit: MemoryUnit) => MemoryUnit) => void;
  removeMemoryUnit: (id: string) => void;
  resetMemoryUnits: () => void;
}

const STORAGE_KEY = "ai-memory-system.units.submission-v1";
const MemoryStoreContext = createContext<MemoryStoreValue | null>(null);

export function MemoryStoreProvider({ children }: { children: ReactNode }) {
  const [memoryUnits, setMemoryUnits] = useState<MemoryUnit[]>(readInitialUnits);

  const value = useMemo<MemoryStoreValue>(
    () => ({
      memoryUnits,
      addMemoryUnit: (unit) => {
        setMemoryUnits((currentUnits) => persistUnits([unit, ...currentUnits]));
      },
      updateMemoryUnit: (id, update) => {
        setMemoryUnits((currentUnits) =>
          persistUnits(currentUnits.map((unit) => (unit.id === id ? update(unit) : unit))),
        );
      },
      removeMemoryUnit: (id) => {
        setMemoryUnits((currentUnits) => persistUnits(currentUnits.filter((unit) => unit.id !== id)));
      },
      resetMemoryUnits: () => {
        setMemoryUnits(persistUnits(allSeedMemoryUnits));
      },
    }),
    [memoryUnits],
  );

  return <MemoryStoreContext.Provider value={value}>{children}</MemoryStoreContext.Provider>;
}

export function useMemoryUnits() {
  const value = useContext(MemoryStoreContext);
  if (!value) {
    throw new Error("useMemoryUnits must be used inside MemoryStoreProvider");
  }
  return value;
}

function readInitialUnits() {
  if (typeof window === "undefined") return allSeedMemoryUnits;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return allSeedMemoryUnits;
    const parsed = JSON.parse(stored) as MemoryUnit[];
    return Array.isArray(parsed) && parsed.length > 0 ? mergeWithSeedUnits(parsed.map(normalizeStoredUnit)) : allSeedMemoryUnits;
  } catch {
    return allSeedMemoryUnits;
  }
}

function persistUnits(units: MemoryUnit[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  }
  return units;
}

function normalizeStoredUnit(unit: MemoryUnit): MemoryUnit {
  return {
    ...unit,
    status: unit.status ?? "received",
    rawRecordStatus: unit.rawRecordStatus ?? "saved",
    receiptStatus: unit.receiptStatus ?? (unit.userState?.status === "confirmed" ? "confirmed" : "received"),
    treasuryLayer: unit.treasuryLayer ?? (unit.userState?.status === "confirmed" ? "core" : "soft"),
    routeStatus: unit.routeStatus ?? (unit.userState?.status === "confirmed" ? "confirmed" : "suggested"),
  };
}

const allSeedMemoryUnits = trainingMemoryCorpus;

function mergeWithSeedUnits(units: MemoryUnit[]) {
  const ids = new Set(units.map((unit) => unit.id));
  return [...units, ...allSeedMemoryUnits.filter((unit) => !ids.has(unit.id))];
}
