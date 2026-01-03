import { StateField } from "@codemirror/state"

export interface FileRefMatch { fileRefName: string, from: number, to: number, namePos: number }

//a watcher extension to flag if the cursor is within a file ref tag [[]]
export let cursorWithinFileRef = StateField.define<FileRefMatch | undefined>({
	create() {
		return undefined;
	},

	update(_value, tr) {
		let match: FileRefMatch | undefined;
		const cursor = tr.state.selection.main.head;
		const line = tr.state.doc.lineAt(cursor);
		const bracketRegEx = /\[\[(\s*[^\]]*)/g; //matches anything after [[ until ]
		const matches = [...line.text.matchAll(bracketRegEx)];
		const [hit] = matches.filter((m) => {
			const groupSize = m[1].length;
			const groupStart = line.from + m.index! + 2; //don't count [[
			const groupEnd = 1 + groupStart + Math.max(0, groupSize - 1);
			return cursor >= groupStart && cursor <= groupEnd;
		});

		if (hit) {
			const from = line.from + hit.index!;
			match = { 
				fileRefName: hit[1], 
				from,
				to: from + hit[0].length,
				namePos: from + 2 
			};
		}

		return match;
	}
})
