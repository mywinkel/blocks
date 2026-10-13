window.addEventListener('message', (event) => {
  if (event.source !== parent || !event.ports[0]) return;
  const port = event.ports[0];
  let block, input;
  port.onmessage = (event) => {
    if (event.data.type === 'update' && input) {
      // Undo/redo replaces the entire host snapshot. Future edits must use it,
      // including metadata outside props; receiving it must not emit a change.
      block = event.data.block;
      input.value = block.props.heading ?? 'Package notes';
      return;
    }
    if (event.data.type !== 'configure') return;
    block = event.data.block;
    const label = document.createElement('label');
    input = document.createElement('input');
    label.textContent = 'Heading';
    input.value = block.props.heading ?? 'Package notes';
    input.addEventListener('input', () => {
      block.props.heading = input.value;
      port.postMessage({ type: 'change', block });
    });
    label.append(input);
    document.getElementById('settings').replaceChildren(label);
  };
  port.start();
});
