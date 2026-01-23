const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED']);

export const extractTextFromHTML = (htmlString: string) => {
		if (!htmlString) return '';

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');
		const pieces: string[] = [];

		const walk = (node: Node) => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				if (SKIP_TAGS.has(node.nodeName)) return;

				Array.from(node.childNodes).forEach(child => walk(child));
			} else if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent?.trim();
				if (text) {
					pieces.push(text);
				}
			}
		};

		walk(doc.body);
		return pieces.join(' ').replace(/\s+/g, ' ').trim();
}
