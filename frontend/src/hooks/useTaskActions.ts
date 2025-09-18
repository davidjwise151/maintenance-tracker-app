import { useContext } from "react";
import { apiFetch } from "../utils/apiFetch";
import { ToastManagerContext } from "../ToastManager";

export function useTaskActions({ onTaskChanged }: { onTaskChanged?: () => void } = {}) {
  const toastManager = useContext(ToastManagerContext);

  // Accept a task
  const acceptTask = async (taskId: string, assignee: any) => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to accept");
      toastManager?.showToast("Task accepted!", "success");
      onTaskChanged?.();
    } catch (err) {
      toastManager?.showToast("Error accepting: " + String(err), "error");
    }
  };

  // Assign a user to a task
  const assignTask = async (taskId: string, assigneeId: string, onAssigned?: () => void) => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId })
      });
      if (!res.ok) throw new Error("Failed to assign");
      toastManager?.showToast("Task assigned!", "success");
      onAssigned?.();
      onTaskChanged?.();
    } catch (err) {
      toastManager?.showToast("Error assigning: " + String(err), "error");
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.status === 403) {
        toastManager?.showToast("You do not have permission to delete this task.", "error");
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete task");
      toastManager?.showToast("Task deleted successfully!", "success");
      onTaskChanged?.();
    } catch (err) {
      toastManager?.showToast("Error deleting task: " + String(err), "error");
    }
  };

  return { acceptTask, assignTask, deleteTask };
}
