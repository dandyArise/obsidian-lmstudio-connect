import type { Attachment } from 'svelte/attachments';

export function bodyMount(): Attachment {
	return (element) => {
		document.body.appendChild(element);

		return () => {
			element.remove();
		};
	}
};
