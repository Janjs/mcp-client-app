import { useState, useEffect } from 'react'
import ReactJson from 'react-json-view'

type ToolCallConfirmationProps = {
  callId: string
  toolName: string
  args: Record<string, unknown>
  onConfirm: (callId: string, modifiedArgs: Record<string, unknown>) => void
  onReject: (callId: string, reason?: string) => void
}

const ToolCallConfirmation = ({
  callId,
  toolName,
  args,
  onConfirm,
  onReject
}: ToolCallConfirmationProps): JSX.Element => {
  const [modifiedArgs, setModifiedArgs] = useState<Record<string, unknown>>(args)
  const [reason, setReason] = useState<string>('')
  const [showRejectReason, setShowRejectReason] = useState<boolean>(false)
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true)

  useEffect(() => {
    setModifiedArgs(args)
  }, [args])

  const handleJsonEdit = (edit: { updated_src: Record<string, unknown> }): void => {
    setModifiedArgs(edit.updated_src)
    setIsJsonValid(true)
  }

  const handleConfirm = (): void => {
    onConfirm(callId, modifiedArgs)
  }

  const handleReject = (): void => {
    onReject(callId, reason)
  }

  const handleToggleRejectReason = (): void => {
    setShowRejectReason(!showRejectReason)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Tool Call Confirmation</h2>
        <div className="mb-4">
          <p className="mb-2">
            The AI assistant wants to call the following tool:
          </p>
          <div className="bg-blue-50 p-4 rounded mb-4">
            <span className="font-bold">Tool:</span> {toolName}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Arguments:</h3>
          <p className="text-sm text-gray-500 mb-2">
            You can edit the arguments below before confirming:
          </p>
          <div className="border rounded p-4 bg-gray-50">
            <ReactJson
              src={modifiedArgs}
              onEdit={handleJsonEdit}
              onAdd={handleJsonEdit}
              onDelete={handleJsonEdit}
              displayDataTypes={false}
              displayObjectSize={false}
              name={null}
              collapsed={false}
              theme="rjv-default"
              style={{ background: 'transparent' }}
            />
          </div>
          {!isJsonValid && (
            <p className="text-red-500 text-sm mt-2">Invalid JSON format</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <div className="flex-1">
            {showRejectReason ? (
              <div className="flex flex-col mb-4">
                <input
                  type="text"
                  placeholder="Reason for rejection (optional)"
                  className="border rounded p-2 mb-2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex-1"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={handleToggleRejectReason}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleToggleRejectReason}
                className="w-full sm:w-auto bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200"
              >
                Reject
              </button>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isJsonValid}
            className={`w-full sm:w-auto px-6 py-2 rounded ${
              isJsonValid
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-blue-300 text-white cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default ToolCallConfirmation 