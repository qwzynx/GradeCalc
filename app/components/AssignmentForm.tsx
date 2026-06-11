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

  useEffect(() => {
    setWeightInputValue(editingAssignment?.weight ?? 0);
  }, [editingAssignment]);

  // Weight from OTHER assignments (excluding the one being edited)
  const otherWeight = editingAssignment?.weight
    ? currentTotalWeight - (editingAssignment.weight ?? 0)
    : currentTotalWeight;
  const projectedTotal = otherWeight + weightInputValue;
  const isOverLimit = projectedTotal > 100;
  const overAmount = parseFloat((projectedTotal - 100).toFixed(2));

  return (
    <GlassCard className="p-4 border-black/10 shadow-sm bg-white">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-orbitron text-primary font-bold uppercase tracking-wider">{editingAssignment ? 'Modify Params' : 'New Assignment'}</h4>
          </div>
          
          <div className="flex gap-3">
            <input required name="name" type="text" defaultValue={editingAssignment?.name || ""} placeholder="Designation" className="flex-1 bg-white border border-black/20 shadow-sm rounded p-2 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
            
            {/* Auto-split Quantity Input (Only show when adding new) */}
            {!editingAssignment && (
              <div className="w-16 relative group">
                <NumberInput 
                  name="quantity" 
                  min="1" 
                  max="10" 
                  value={splitQuantity}
                  onChange={(e) => setSplitQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} 
                  placeholder="Qty" 
                  className="w-full bg-white border border-black/20 shadow-sm rounded p-2 text-sm text-secondary text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                />
                <div className="absolute -top-6 -left-1/2 transform -translate-x-1/2 bg-white border text-nowrap border-black/20 shadow-md px-2 py-1 rounded text-[9px] text-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Auto-Split Qty
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {Array.from({ length: splitQuantity }).map((_, i) => (
              <div key={i} className="flex p-3 bg-background border border-black/10 rounded relative">
                {/* Individual Mode Toggle */}
                <div className="flex gap-3 items-end w-full mt-4">
                  {splitQuantity > 1 && (
                    <span className="text-[18px] text-muted font-orbitron w-6 mt-6 shrink-0">#{i + 1}</span>
                  )}
                  
                  {/* Individual Mode Toggle beside inputs */}
                  <div className="flex flex-col gap-1 shrink-0 bg-black/5 border border-black/10 rounded p-1 mb-[2px]">
                    <button 
                      type="button"
                      onClick={() => setInputModes(prev => { const n = [...prev]; n[i] = "percentage"; return n; })}
                      className={`px-3 py-2 rounded text-[10px] sm:text-xs uppercase tracking-widest transition-all min-w-[80px] ${(!inputModes[i] || inputModes[i] === "percentage") ? 'bg-primary text-[#FFFFFF] font-bold shadow-sm' : 'text-muted hover:text-secondary'}`}
                    >
                      % Match
                    </button>
                    <button 
                      type="button"
                      onClick={() => setInputModes(prev => { const n = [...prev]; n[i] = "points"; return n; })}
                      className={`px-3 py-2 rounded text-[10px] sm:text-xs uppercase tracking-widest transition-all min-w-[80px] ${inputModes[i] === "points" ? 'bg-primary text-[#FFFFFF] font-bold shadow-sm' : 'text-muted hover:text-secondary'}`}
                    >
                      Points
                    </button>
                  </div>

                  {(!inputModes[i] || inputModes[i] === "percentage") ? (
                    <div className="flex-1">
                      <label className="text-[9px] text-muted uppercase tracking-wider mb-1 block">Mark %</label>
                      <NumberInput name={splitQuantity > 1 ? `mark_${i}` : "mark"} step="0.01" defaultValue={editingAssignment?.mark ?? ""} placeholder="Grade" className="w-full bg-white shadow-sm border border-black/20 rounded p-2 text-sm text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                  ) : (
                    <div className="flex-1 flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="text-[9px] text-muted uppercase tracking-wider mb-1 block">Earned</label>
                         <NumberInput name={splitQuantity > 1 ? `points_earned_${i}` : "points_earned"} step="0.01" placeholder="Pts" className="w-full bg-white shadow-sm border border-black/20 rounded p-2 text-sm text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      </div>
                      <span className="text-muted font-bold mt-4 shrink-0">/</span>
                      <div className="flex-1">
                        <label className="text-[9px] text-muted uppercase tracking-wider mb-1 block">Total</label>
                         <NumberInput name={splitQuantity > 1 ? `points_total_${i}` : "points_total"} step="0.01" placeholder="Max" className="w-full bg-white shadow-sm border border-black/20 rounded p-2 text-sm text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="w-full mt-1 border-t border-black/10 pt-1">
              <label className="flex justify-between text-[9px] text-muted uppercase tracking-wider mb-1">
                <span>{splitQuantity > 1 ? 'Total Group Weight %' : 'Weight %'}</span>
                {splitQuantity > 1 && <span className="text-muted ml-1">(Averaging items over full weight)</span>}
              </label>
              <NumberInput
                required
                name="weight"
                step="0.01"
                defaultValue={editingAssignment?.weight ?? ""}
                placeholder="Total Wgt"
                className={`w-full bg-white shadow-sm border rounded p-2 text-sm text-secondary transition-colors focus:outline-none focus:ring-1 ${
                  isOverLimit ? 'border-amber-500/70 focus:border-amber-500 focus:ring-amber-500' : 'border-black/20 focus:border-primary focus:ring-primary'
                }`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightInputValue(parseFloat(e.target.value) || 0)}
              />
            </div>

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
