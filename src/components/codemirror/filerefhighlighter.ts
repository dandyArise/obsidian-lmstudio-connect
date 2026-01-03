import { EditorView } from "codemirror";
import {
	ViewUpdate,
	Decoration,
	type DecorationSet,
	ViewPlugin,
} from "@codemirror/view";
import { RangeSetBuilder, Range } from "@codemirror/state";


const highlightMark = Decoration.mark({ class: "cm-unresolved-file-ref-highlight" });

export const fileRefHighlighter = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		referenceBracketRegEx = /\[\[([^\]]+)/g; //matches anything after [[ until ] (must have at least one char)

		getMatches(view: EditorView, from: number, to?: number) {
			const builder = new RangeSetBuilder<Decoration>();
			this.referenceBracketRegEx.lastIndex = 0;
			for (let cursor = view.state.doc.iterRange(from, to), pos = from, m; !cursor.next().done; pos += cursor.value.length) {
				if (!cursor.lineBreak) {
					while (m = this.referenceBracketRegEx.exec(cursor.value)) {
						const start = pos + m.index + 2; //skip the [[
						builder.add(start, start + m[1].length, highlightMark);
					}
				}
			}
			return builder.finish();
		}

		constructor(view: EditorView) {
			this.decorations = this.getMatches(view, 0);
		}
		
		update(update: ViewUpdate) {
			if (update.viewportMoved) {
				this.decorations = this.getMatches(update.view, 0);
				return;
			}

			if (update.docChanged) {
				this.decorations = this.decorations.map(update.changes);
			
				//recreate decorations on changed lines only
				let changeFrom = 1e9, changeTo = -1;
				update.changes.iterChanges((_f, _t, from, to) => {
					changeFrom = Math.min(from, changeFrom);
					changeTo = Math.max(to, changeTo);
				});
				let start = update.view.state.doc.lineAt(changeFrom).from;
				let end = update.view.state.doc.lineAt(changeTo).to;
				
				const recreated = this.getMatches(update.view, start, end);
				let ranges: Range<Decoration>[] = [];
				for (let cursor = recreated.iter(); cursor.value; cursor.next()) {
					ranges.push(cursor.value.range(cursor.from, cursor.to));
				}
				this.decorations = this.decorations.update(
					{ filterFrom: start, filterTo: end, filter: (from, to) => from < start || to > end, add: ranges}
				);
			}
		}
					
	},
	{
		decorations: (instance) => instance.decorations,
	},
);
