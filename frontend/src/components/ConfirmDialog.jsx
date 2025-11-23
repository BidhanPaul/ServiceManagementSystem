export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl text-center">
        <p className="text-lg font-semibold mb-6">{message}</p>

        <div className="flex justify-center gap-4">
          <button className="bg-gray-300 px-4 py-2 rounded-lg" onClick={onCancel}>
            Cancel
          </button>

          <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
