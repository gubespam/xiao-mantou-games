import { useEffect } from 'react';

function useMenuDismissal(onDismiss) {
  useEffect(() => {
    function handleDocumentClick(event) {
      const target = event.target;
      const element = target instanceof Element ? target : null;
      const menu = element?.closest('.tdocs-files-menu');
      const menuTrigger = element?.closest(
        '.tdocs-files-item-action-button, .tdocs-trash-item-menu-button, .tdocs-files-add-button',
      );

      if (menu) {
        if (element.closest('button') && !element.closest('.tdocs-files-delete-option')) {
          onDismiss();
        }
        return;
      }

      if (!menuTrigger) {
        onDismiss();
      }
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [onDismiss]);
}

export default useMenuDismissal;