/** Accessible native dialogs keep focus inside a form and return it to the opening button. */
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
/** Native modal behavior supports Escape and keyboard use without a custom focus trap. */
export default function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "modal wide" : "modal"}
      onCancel={close}
      aria-labelledby="dialog-title"
    >
      <div className="modal-heading">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
