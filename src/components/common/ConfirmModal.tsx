import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean; // Nếu true nút confirm sẽ màu đỏ (dùng cho Xóa/Block)
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal = ({
                          isOpen, title, message, confirmLabel = "Xác nhận", cancelLabel = "Hủy", isDanger = false, onConfirm, onCancel
                      }: ConfirmModalProps) => {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">

                {/* Icon cảnh báo (tùy chọn) */}
                <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${isDanger ? 'bg-red-100 sm:mx-0 sm:h-10 sm:w-10' : 'bg-blue-100'}`}>
                    {isDanger ? (
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    ) : (
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                    )}
                </div>

                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white text-center mt-2 mb-2">{title}</h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{message}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`inline-flex w-full justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;