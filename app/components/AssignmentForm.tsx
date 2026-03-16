"use client";

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
}

export default function AssignmentForm({
  editingAssignment,
  onSubmit,
  onDelete,
  splitQuantity,
  setSplitQuantity,
  inputModes,
  setInputModes
}: AssignmentFormProps) {
  return (
    <GlassCard className="p-4 border-secondary/50 shadow-[0_0_15px_rgba(242,166,90,0.1)]">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-orbitron text-secondary uppercase tracking-wider">{editingAssignment ? 'Modify Params' : 'New Assignment'}</h4>
          </div>
          
          <div className="flex gap-3">
            <input required name="name" type="text" defaultValue={editingAssignment?.name || ""} placeholder="Designation" className="flex-1 bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary" />
            
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
                  className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary text-center" 
                />
                <div className="absolute -top-6 -left-1/2 transform -translate-x-1/2 bg-primary border text-nowrap border-prHighlight px-2 py-1 rounded text-[9px] text-alt-color opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Auto-Split Qty
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {Array.from({ length: splitQuantity }).map((_, i) => (
              <div key={i} className="flex p-3 bg-primary/30 rounded border border-prHighlight/30 relative">
                {/* Individual Mode Toggle */}
                <div className="flex gap-3 items-end w-full mt-4">
                  {splitQuantity > 1 && (
                    <span className="text-[18px] text-alt-color font-orbitron w-6 mt-6 shrink-0">#{i + 1}</span>
                  )}
                  
                  {/* Individual Mode Toggle beside inputs */}
                  <div className="flex flex-col gap-1 shrink-0 bg-primary/20 border border-prHighlight/50 rounded p-1 mb-[2px]">
                    <button 
                      type="button"
                      onClick={() => setInputModes(prev => { const n = [...prev]; n[i] = "percentage"; return n; })}
                      className={`px-3 py-1.5 rounded text-[9px] uppercase tracking-widest transition-all ${(!inputModes[i] || inputModes[i] === "percentage") ? 'bg-secondary text-primary font-bold shadow-[0_0_10px_rgba(242,166,90,0.3)]' : 'text-alt-color hover:text-secondary'}`}
                    >
                      % Match
                    </button>
                    <button 
                      type="button"
                      onClick={() => setInputModes(prev => { const n = [...prev]; n[i] = "points"; return n; })}
                      className={`px-3 py-1.5 rounded text-[9px] uppercase tracking-widest transition-all ${inputModes[i] === "points" ? 'bg-secondary text-primary font-bold shadow-[0_0_10px_rgba(242,166,90,0.3)]' : 'text-alt-color hover:text-secondary'}`}
                    >
                      Points
                    </button>
                  </div>

                  {(!inputModes[i] || inputModes[i] === "percentage") ? (
                    <div className="flex-1">
                      <label className="text-[9px] text-alt-color uppercase tracking-wider mb-1 block">Mark %</label>
                      <NumberInput name={splitQuantity > 1 ? `mark_${i}` : "mark"} step="0.01" defaultValue={editingAssignment?.mark ?? ""} placeholder="Grade" className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                    </div>
                  ) : (
                    <div className="flex-1 flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="text-[9px] text-alt-color uppercase tracking-wider mb-1 block">Earned</label>
                         <NumberInput name={splitQuantity > 1 ? `points_earned_${i}` : "points_earned"} step="0.01" placeholder="Pts" className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                      </div>
                      <span className="text-alt-color font-bold mt-4 shrink-0">/</span>
                      <div className="flex-1">
                        <label className="text-[9px] text-alt-color uppercase tracking-wider mb-1 block">Total</label>
                         <NumberInput name={splitQuantity > 1 ? `points_total_${i}` : "points_total"} step="0.01" placeholder="Max" className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="w-full mt-1 border-t border-prHighlight/50 pt-1">
              <label className="flex justify-between text-[9px] text-alt-color uppercase tracking-wider mb-1">
                <span>{splitQuantity > 1 ? 'Total Group Weight %' : 'Weight %'}</span>
                {splitQuantity > 1 && <span className="text-secondary/50 ml-1">(Averaging items over full weight)</span>}
              </label>
              <NumberInput required name="weight" step="0.01" defaultValue={editingAssignment?.weight ?? ""} placeholder="Total Wgt" className="w-full bg-primary/50 border border-prHighlight focus:border-secondary transition-colors rounded p-2 text-sm text-secondary" />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
              <NeonButton type="submit" className="flex-1 py-2 text-xs">Execute {editingAssignment ? 'Update' : 'Add'}</NeonButton>
              {editingAssignment && (
                  <button type="button" onClick={() => onDelete(editingAssignment)} className="px-3 bg-red-900/20 border border-red-500/50 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
              )}
          </div>
      </form>
    </GlassCard>
  );
}
