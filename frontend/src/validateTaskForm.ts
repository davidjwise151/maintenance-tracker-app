import { parseDateInput } from "./utils/dateUtils";

export interface TaskFormFields {
  title: string;
  status: string;
  dueDate?: string;
}

export function validateTaskForm({ title, status, dueDate }: TaskFormFields): string | null {
  if (!title) {
    return "Title is required";
  }
  if (!status) {
    return "Status is required";
  }
  const validStatuses = ["Pending", "In-Progress", "Done"];
  if (!validStatuses.includes(status)) {
    return "Invalid status";
  }
  if (dueDate) {
    // Try ISO first, then fallback to MM/DD/YYYY
    let selectedDate: Date | null = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      selectedDate = new Date(dueDate + 'T00:00:00');
    } else {
      selectedDate = parseDateInput(dueDate);
    }
    if (!selectedDate || isNaN(selectedDate.getTime())) return null;
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return "Due date cannot be in the past.";
    }
    // Prevent due date more than 5 years in the future
    const fiveYearsFromNow = new Date(today);
    fiveYearsFromNow.setFullYear(today.getFullYear() + 5);
    if (selectedDate > fiveYearsFromNow) {
      return "Due date cannot be more than 5 years from today.";
    }
  }
  if (status === "Done" && dueDate) {
    return "No due date should be set for a task marked as Done.";
  }
  return null;
}
