"use client";
import {createContext,useContext} from "react";
import type {TreeholeDialogKind} from "./desktop-dialog";
export interface VisualDialogOwner {open:(kind:TreeholeDialogKind,id:string)=>void;close:(id:string)=>void}
export const DesktopVisualContext=createContext<VisualDialogOwner|null>(null);
export const useDesktopVisual=()=>useContext(DesktopVisualContext);
export const dialogVisualState:Record<TreeholeDialogKind,string>={recover:"05",leave:"06","save-failed":"07","generate-failed":"08","letter-save-failed":"09","export-failed":"10","cross-day":"14"};
