/** Copy text with a fallback for browsers that don't expose the Clipboard API. */
export async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the selection based copy path.
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.setAttribute('aria-hidden', 'true');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  document.body.appendChild(input);

  try {
    input.select();
    input.setSelectionRange(0, input.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    input.remove();
  }
}
