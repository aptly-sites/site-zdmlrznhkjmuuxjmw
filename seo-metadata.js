/* Preserve static metadata when legacy exported components hydrate the page. */
(() => {
  const config = window.spradleyPageMetadata;
  if (!config) return;
  let pending = false;
  function sync() {
    pending = false;
    for (const item of config) {
      const matches = [...document.head.querySelectorAll(item.selector)];
      let element = matches.shift();
      matches.forEach(node => node.remove());
      if (!element) { element = document.createElement(item.tag); document.head.append(element); }
      for (const [name, value] of Object.entries(item.attrs || {})) {
        if (element.getAttribute(name) !== value) element.setAttribute(name, value);
      }
      if (item.text !== undefined && element.textContent !== item.text) element.textContent = item.text;
    }
  }
  new MutationObserver(() => {
    if (!pending) { pending = true; queueMicrotask(sync); }
  }).observe(document.head, { childList: true, subtree: true, attributes: true, characterData: true });
  sync();
})();
