import { EditorView, Decoration, WidgetType, type DecorationSet } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"
import { setIcon, type TFile } from "obsidian"

export const addFileReference = StateEffect.define<{ from: number, to: number, file: TFile }>({
	map: ({ from, to, file }, change) => ({ from: change.mapPos(from), to: change.mapPos(to), file })
})

export const fileReferenceField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none
	},

	update(fileRefs, tr) {
		fileRefs = fileRefs.map(tr.changes)
		for (let e of tr.effects) if (e.is(addFileReference)) {
			fileRefs = fileRefs.update({
				add: [fileReferenceWidget(e.value.file.basename).range(e.value.from, e.value.to)]
			})
		}
		return fileRefs;
	},

	provide: (field) => [ 
		EditorView.decorations.from(field),
		EditorView.atomicRanges.of(view => view.state.field(field))
	]
	
})

const fileReferenceWidget = (fileName: string) => Decoration.replace({ widget: new FileReferenceWidget(fileName) });

class FileReferenceWidget extends WidgetType {
	name: string;
	constructor(name: string) {
		super();
		this.name = name;
	}
	eq(other: FileReferenceWidget) {
		return this.name == other.name
	}
	toDOM() {
		let elt = document.createElement("span")
		let textWrap = document.createElement("span");
		textWrap.appendText(this.name);
		elt.addClass("cm-file-ref-widget");
		setIcon(elt, "sticky-note");	
		elt.appendChild(textWrap);
		return elt
	}
}


