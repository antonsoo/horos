import type { Notebook } from "./record";

interface Entry {
  notebook: Notebook;
  label: string;
}

/** A prose edit is one action until focus leaves the editor or another action starts. */
export class NotebookHistory {
  private past: Entry[] = [];
  private future: Entry[] = [];
  private editing = false;

  get undoLabel(): string | undefined {
    return this.past.at(-1)?.label;
  }
  get redoLabel(): string | undefined {
    return this.future.at(-1)?.label;
  }
  endEdit(): void {
    this.editing = false;
  }
  remember(notebook: Notebook, label: string, prose = false): void {
    if (!prose || !this.editing) {
      this.past.push({ notebook: structuredClone(notebook), label });
      if (this.past.length > 100) this.past.shift();
    }
    this.editing = prose;
    this.future = [];
  }
  undo(current: Notebook): Notebook | undefined {
    this.endEdit();
    const previous = this.past.pop();
    if (!previous) return;
    this.future.push({ notebook: structuredClone(current), label: previous.label });
    return previous.notebook;
  }
  redo(current: Notebook): Notebook | undefined {
    this.endEdit();
    const next = this.future.pop();
    if (!next) return;
    this.past.push({ notebook: structuredClone(current), label: next.label });
    return next.notebook;
  }
}
