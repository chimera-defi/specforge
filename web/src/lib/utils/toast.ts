/**
 * Toast notification utility
 * Standardized toast messages and durations
 */

import { APP_CONFIG } from "@/lib/constants";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  message: string;
  type: ToastType;
  duration?: number;
}

export const TOAST_MESSAGES = {
  // Success messages
  FILE_SAVED: "File saved successfully",
  FILE_CREATED: "File created successfully",
  FILE_DELETED: "File deleted successfully",
  FILE_RESTORED: "File restored successfully",
  PATCH_ACCEPTED: "Patch accepted successfully",
  PATCH_REJECTED: "Patch rejected successfully",
  COMMENT_ADDED: "Comment added successfully",
  DOCUMENT_SAVED: "Document saved successfully",
  SETTINGS_SAVED: "Settings saved successfully",
  
  // Error messages
  SAVE_FAILED: "Failed to save file",
  LOAD_FAILED: "Failed to load file",
  DELETE_FAILED: "Failed to delete file",
  NETWORK_ERROR: "Network error. Please check your connection",
  PERMISSION_DENIED: "You don't have permission to perform this action",
  
  // Info messages
  SYNCING: "Syncing changes...",
  LOADING: "Loading...",
  SAVING: "Saving...",
  
  // Warning messages
  UNSAVED_CHANGES: "You have unsaved changes",
} as const;

export function createToast(
  message: string,
  type: ToastType = "info",
  duration: number = APP_CONFIG.TOAST_DURATION
): ToastMessage {
  return { message, type, duration };
}

export function successToast(message: string): ToastMessage {
  return createToast(message, "success");
}

export function errorToast(message: string): ToastMessage {
  return createToast(message, "error");
}

export function infoToast(message: string): ToastMessage {
  return createToast(message, "info");
}

export function warningToast(message: string): ToastMessage {
  return createToast(message, "warning");
}