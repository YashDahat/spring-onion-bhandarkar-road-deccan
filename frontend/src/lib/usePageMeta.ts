import { useEffect } from 'react';

/** Sets the document title + meta description for a page (no extra provider needed). */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} · Spring Onion, Deccan Pune`;
    if (description) {
      let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'description';
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
  }, [title, description]);
}
