import type { Attachment } from 'svelte/attachments';

export function bodyMount(): Attachment {
	return (element) => {
		activeDocument.body.appendChild(element);

		return () => {
			element.remove();
		};
	}
}
