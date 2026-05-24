function escapeCssAttributeValue(value) {
  const text = String(value ?? '');
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(text);
  }

  return text.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function getFocusableSelector(element) {
  if (!element || typeof element !== 'object') {
    return null;
  }

  if (typeof element.hasAttribute !== 'function' || typeof element.getAttribute !== 'function') {
    return null;
  }

  if (element.hasAttribute('data-editor-search')) {
    return `[data-editor-search="${escapeCssAttributeValue(element.getAttribute('data-editor-search'))}"]`;
  }

  if (element.hasAttribute('data-editor-field')) {
    return `[data-editor-field="${escapeCssAttributeValue(element.getAttribute('data-editor-field'))}"]`;
  }

  if (element.hasAttribute('data-editor-narrator-slot')) {
    return `[data-editor-narrator-slot="${escapeCssAttributeValue(element.getAttribute('data-editor-narrator-slot'))}"]`;
  }

  if (element.hasAttribute('data-editor-chapter-index') && element.hasAttribute('data-editor-chapter-field')) {
    return `[data-editor-chapter-index="${escapeCssAttributeValue(element.getAttribute('data-editor-chapter-index'))}"]` +
      `[data-editor-chapter-field="${escapeCssAttributeValue(element.getAttribute('data-editor-chapter-field'))}"]`;
  }

  if (element.hasAttribute('data-editor-cover-input')) {
    return '[data-editor-cover-input]';
  }

  if (element.hasAttribute('data-chapter-audio-input')) {
    return '[data-chapter-audio-input]';
  }

  const name = element.getAttribute('name');
  if (name) {
    return `[name="${escapeCssAttributeValue(name)}"]`;
  }

  const id = element.getAttribute('id');
  if (id) {
    return `#${escapeCssAttributeValue(id)}`;
  }

  return null;
}
