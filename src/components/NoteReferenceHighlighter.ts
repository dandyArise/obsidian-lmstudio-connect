import { EditorView } from "codemirror";
import {
	ViewUpdate,
	Decoration,
	type DecorationSet,
	ViewPlugin,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

const highlightMark = Decoration.mark({ class: "cm-note-ref-highlight" });

export const highlightPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		referenceBracketRegEx = /\[\[(\s*[^\]]*)/g; //matches anything after [[ until ]

		getMatches(view: EditorView) {
			const builder = new RangeSetBuilder<Decoration>();
			this.referenceBracketRegEx.lastIndex = 0;
			for (let cursor = view.state.doc.iterRange(0), pos = 0, m; !cursor.next().done; pos += cursor.value.length) {
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
			this.decorations = this.getMatches(view);
		}

		update(update: ViewUpdate) {
			//small textbox so recreating from scratch is fine.
			this.decorations = this.getMatches(update.view);
		}
	},
	{
		decorations: (instance) => instance.decorations,
	},
);
