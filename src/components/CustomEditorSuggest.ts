import { AbstractInputSuggest, FuzzySuggestModal } from "obsidian";

export class CustomInputSuggest extends AbstractInputSuggest<string> {

    protected getSuggestions(query: string): string[] | Promise<string[]> {
		return [query];
    }
    renderSuggestion(value: string, el: HTMLElement): void {
		el.appendText("some value");
    }
}

export class CustomFuzzySuggest extends FuzzySuggestModal<string> {
    getItems(): string[] {
		return ["1", "2", "3"];
    }
    getItemText(item: string): string {
		return "something " + item;
    }
    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
		console.log("chosen: ");
    }
	
}
