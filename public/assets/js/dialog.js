// Opens dialogs from [data-open-dialog] buttons and closes them on a click outside the box.
document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-open-dialog]");
  if (opener) {
    document.getElementById(opener.dataset.openDialog)?.showModal();
    return;
  }

  const dialog = event.target;
  if (dialog instanceof HTMLDialogElement && dialog.open) {
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right
      && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close("cancel");
  }
});
