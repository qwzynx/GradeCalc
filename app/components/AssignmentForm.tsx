"use client";

import { useState, useEffect } from "react";
import GlassCard from "./GlassCard";
import NeonButton from "./NeonButton";
import NumberInput from "./NumberInput";
import { Assignment } from "../types";

export interface AssignmentFormProps {
  editingAssignment: Assignment | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: (assignment: Assignment) => void;
  splitQuantity: number;
  setSplitQuantity: (qty: number) => void;
  inputModes: ("percentage" | "points")[];
  setInputModes: (action: ("percentage" | "points")[] | ((prev: ("percentage" | "points")[]) => ("percentage" | "points")[])) => void;
  currentTotalWeight: number;
}

export default function AssignmentForm({
  editingAssignment,
  onSubmit,
  onDelete,
  splitQuantity,
  setSplitQuantity,
  inputModes,
  setInputModes,
  currentTotalWeight
}: AssignmentFormProps) {
  const [weightInputValue, setWeightInputValue] = useState<number>(editingAssignment?.weight ?? 0);
  const [isBonus, setIsBonus] = useState<boolean>(editingAssignment?.is_bonus ?? false);

  useEffect(() => {
    setWeightInputValue(editingAssignment?.weight ?? 0);
    setIsBonus(editingAssignment?.is_bonus ?? false);
  }, [editingAssignment]);

  const selectBonus = (bonus: boolean) => {
    setIsBonus(bonus);
    // Auto-split makes no sense for a single bonus allowance.
    if (bonus) setSplitQuantity(1);
  };

  // Weight from OTHER assignments (excluding the one being edited)
  const otherWeight = editingAssignment?.weight
    ? currentTotalWeight - (editingAssignment.weight ?? 0)
    : currentTotalWeight;
  const projectedTotal = otherWeight + weightInputValue;
  // A bonus is meant to exceed 100%, so the warning only applies to real weight.
  const isOverLimit = !isBonus && projectedTotal > 100;
  const overAmount = parseFloat((projectedTotal - 100).toFixed(2));

  return (
    <GlassCard className="p-4 sm:p-5 border-black/10 shadow-sm bg-white">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-orbitron text-primary font-bold uppercase tracking-wider">
              {editingAssignment ? 'Modify Params' : isBonus ? 'New Bonus' : 'New Assignment'}
            </h4>
          </div>

          {/* Type selector: a bonus sits outside the course's 100% */}
          <input type="hidden" name="is_bonus" value={isBonus ? "1" : ""} />
          <div className="flex gap-1 bg-black/5 border border-black/10 rounded p-1">
            <button
              type="button"
              onClick={() => selectBonus(false)}
              className={`flex-1 px-3 py-2 min-h-[44px] rounded text-[10px] sm:text-xs uppercase tracking-widest transition-all ${!isBonus ? 'bg-primary text-[#FFFFFF] font-bold shadow-sm' : 'text-muted hover:text-secondary'}`}
            >
              Assignment
            </button>
            <button
              type="button"
              onClick={() => selectBonus(true)}
              className={`flex-1 px-3 py-2 min-h-[44px] rounded text-[10px] sm:text-xs uppercase tracking-widest transition-all ${isBonus ? 'bg-violet-600 text-[#FFFFFF] font-bold shadow-sm' : 'text-muted hover:text-secondary'}`}
            >
              Bonus
            </button>
          </div>

          <div className="flex gap-3">
            <input required name="name" type="text" defaultValue={editingAssignment?.name || ""} placeholder={isBonus ? "Bonus name" : "Designation"} className="flex-1 min-w-0 bg-white border border-black/20 shadow-sm rounded p-2 min-h-[44px] text-sm text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" />

            {/* Auto-split Quantity Input (Only show when adding new) */}
            {!editingAssignment && !isBonus && (
              <div className="w-16 shrink-0 relative group">
                <NumberInput
                  name="quantity"
                  min="1"
                  max="10"
                  inputMode="numeric"
                  aria-label="Auto-split quantity"
                  value={splitQuantity}
                  onChange={(e) => setSplitQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  placeholder="Qty"
                  className="w-full bg-white border border-black/20 shadow-sm rounded p-2 min-h-[44px] text-sm text-secondary text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                <div className="absolute -top-6 -left-1/2 transform -translate-x-1/2 bg-white border text-nowrap border-black/20 shadow-md px-2 py-1 rounded text-[9px] text-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Auto-Split Qty
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {Array.from({ length: splitQuantity }).map((_, i) => (
              <div key={i} className="p-3 bg-background border border-black/10 rounded relative">
                {/* Stacks on phones — side by side there isn't room for the
                    mode toggle and two point fields without crushing both. */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end w-full">
                  {splitQuantity > 1 && (
                    <span className="text-sm sm:text-[18px] text-muted font-orbitron sm:w-6 sm:mb-2 shrink-0">#{i + 1}</span>
                  )}

                  {/* Mode toggle: a row above the inputs on phones, a column beside them on desktop */}
                  <div className="flex flex-row sm:flex-col gap-1 shrink-0 bg-black/5 border border-black/10 rounded p-1">
                    <button
                      type="button"
                      onClick={() => setInputModes(prev => { const n = [...prev]; n[i] = "percentage"; return n; })}
                      className={`flex-1 sm:flex-none px-3 py-2 min-h-[40px] rounded text-[10px] sm:text-xs uppercase tracking-widest transition-all sm:min-w-[80px] ${(!inputModes[i] || inputModes[i] === "percentage") ? 'bg-primary text-[#FFFFFF] font-bold shadow-sm' : 'text-muted hover:text-secondary'}`}
                    >
                      % Match
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputModes(prev => { const n = [...prev]; n[i] = "points"; return n; })}
                      className={`flex-1 sm:flex-none px-3 py-2 min-h-[40px] rounded text-[10px] sm:text-xs uppercase tracking-widest transition-all sm:min-w-[80px] ${inputModes[i] === "points" ? 'bg-primary text-[#FFFFFF] font-bold shadow-sm' : 'text-muted hover:text-secondary'}`}
                    >
                      Points
                    </button>
                  </div>

                  {(!inputModes[i] || inputModes[i] === "percentage") ? (
                    <div className="flex-1 min-w-0">
                      <label className="text-[9px] text-muted uppercase tracking-wider mb-1 block">{isBonus ? 'Earned % of Bonus' : 'Mark %'}</label>
                      <NumberInput
                        // Remount on type change so a new bonus picks up the
                        // "earned in full" default instead of keeping "".
                        key={`mark-${i}-${isBonus}`}
                        name={splitQuantity > 1 ? `mark_${i}` : "mark"}
                        step="0.01"
                        inputMode="decimal"
                        defaultValue={editingAssignment ? (editingAssignment.mark ?? "") : (isBonus ? 100 : "")}
                        placeholder={isBonus ? "100" : "Grade"}
                        className="w-full bg-white shadow-sm border border-black/20 rounded p-2 min-h-[44px] text-sm text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0 flex gap-2 items-end">
                      <div className="flex-1 min-w-0">
                        <label className="text-[9px] text-muted uppercase tracking-wider mb-1 block">Earned</label>
                         <NumberInput name={splitQuantity > 1 ? `points_earned_${i}` : "points_earned"} step="0.01" inputMode="decimal" placeholder="Pts" className="w-full bg-white shadow-sm border border-black/20 rounded p-2 min-h-[44px] text-sm text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      </div>
                      <span className="text-muted font-bold shrink-0 pb-3">/</span>
                      <div className="flex-1 min-w-0">
                        <label className="text-[9px] text-muted uppercase tracking-wider mb-1 block">Total</label>
                         <NumberInput name={splitQuantity > 1 ? `points_total_${i}` : "points_total"} step="0.01" inputMode="decimal" placeholder="Max" className="w-full bg-white shadow-sm border border-black/20 rounded p-2 min-h-[44px] text-sm text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="w-full mt-1 border-t border-black/10 pt-1">
              <label className="flex justify-between text-[9px] text-muted uppercase tracking-wider mb-1">
                <span>{isBonus ? 'Bonus Value %' : splitQuantity > 1 ? 'Total Group Weight %' : 'Weight %'}</span>
                {isBonus
                  ? <span className="text-violet-600 ml-1">(Added on top of 100%)</span>
                  : splitQuantity > 1 && <span className="text-muted ml-1">(Averaging items over full weight)</span>}
              </label>
              <NumberInput
                required
                name="weight"
                step="0.01"
                inputMode="decimal"
                defaultValue={editingAssignment?.weight ?? ""}
                placeholder={isBonus ? "e.g. 5" : "Total Wgt"}
                className={`w-full bg-white shadow-sm border rounded p-2 min-h-[44px] text-sm text-secondary transition-colors focus:outline-none focus:ring-1 ${
                  isOverLimit ? 'border-amber-500/70 focus:border-amber-500 focus:ring-amber-500' : 'border-black/20 focus:border-primary focus:ring-primary'
                }`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightInputValue(parseFloat(e.target.value) || 0)}
              />
            </div>

            {isBonus && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-violet-500/10 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600 shrink-0 mt-0.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span className="text-[11px] text-violet-900 dark:text-violet-200 leading-relaxed">
                  A bonus is excluded from the course&apos;s 100% weight. Its earned share —{" "}
                  <span className="font-bold">value × earned %</span> — is added straight on top of your final average.
                  Leave the earned % at 100 if you get the whole bonus, or clear it while it&apos;s still pending.
                </span>
              </div>
            )}

            {/* Bonus Weight Warning */}
            {isOverLimit && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 dark:bg-amber-900/20 border border-amber-200 animate-in fade-in duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/><path d="M12 17h.01"/>
                </svg>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-orbitron text-amber-700 font-bold uppercase tracking-widest">Bonus Weight Detected</span>
                  <span className="text-[11px] text-amber-900 leading-relaxed">
                    Total weight will be <span className="font-bold text-amber-800">{projectedTotal.toFixed(1)}%</span> — exceeding 100% by <span className="font-bold text-amber-800">{overAmount}%</span>. The extra weight will be counted as <span className="font-bold text-amber-800">bonus marks</span>.
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-2">
              <NeonButton type="submit" className="flex-1 py-2 text-xs">Execute {editingAssignment ? 'Update' : 'Add'}</NeonButton>
              {editingAssignment && (
                  <button type="button" onClick={() => onDelete(editingAssignment)} className="px-4 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white border border-red-500 text-red-500 rounded hover:bg-primary/10 hover:text-red-600 transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
              )}
          </div>
      </form>
    </GlassCard>
  );
}
