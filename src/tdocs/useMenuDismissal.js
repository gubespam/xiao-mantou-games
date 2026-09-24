import { useEffect } from "react";

function useMenuDismissal(onDismiss) {
  useEffect(() => {
    function handleDocumentClick(event) {
      const target = event.target;
      const element = target instanceof Element ? target : null;
      const menu = element?.closest(".tdocs-files-menu");
      const menuTrigger = element?.closest(
        ".tdocs-files-item-action-button, .tdocs-trash-item-menu-button, .tdocs-files-add-button",
      );
      const clickedMenuAction =
        element?.closest("button") && element.closest(".tdocs-files-menu");

      if (menu) {
        // Clicking a menu action should perform that action; only outside clicks
        // should dismiss the menu. This prevents reset/restore/delete actions from
        // being canceled by the global dismissal behavior.
        if (clickedMenuAction) {
          console.log("Don't dismiss menu")
          return;
        }

        console.log("Dismiss menu")
        onDismiss();
        return;
      }

      if (!menuTrigger) {
        console.log("Dismiss menu")
        onDismiss();
      }
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [onDismiss]);
}

export default useMenuDismissal;
