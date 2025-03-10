import { useVaults } from "../hooks/useVaults";
import { ConfiguredVault } from "../../types";

/**
 * Component that displays a list of vaults and allows creating/selecting vaults
 */
export function VaultSelector() {
  const {
    vaults,
    loading,
    error,
    activeVault,
    setActiveVault,
    openVault,
    removeVault,
    refreshVaults,
  } = useVaults();

  const handleOpenVault = async () => {
    await openVault();
  };

  const handleRemoveVault = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to remove this vault? This will not delete any files.",
      )
    ) {
      await removeVault(id);
    }
  };

  const handleSelectActiveVault = (vault: ConfiguredVault) => {
    setActiveVault(vault);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary/50 border-t-primary rounded-full mx-auto"></div>
          <p className="text-gray-600">Loading vaults...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4 max-w-lg mx-auto px-6">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">
            Error loading vaults: {error.message}
          </p>
          <button
            className="px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 transition-colors"
            onClick={refreshVaults}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No vaults found - show placeholder screen
  if (vaults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-800">
        <div className="max-w-md w-full mx-auto text-center space-y-6 px-6">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold mb-2">
            Welcome to Your Secure Vault
          </h1>
          <p className="text-gray-600 mb-8">
            Get started by creating your first vault or opening an existing one.
          </p>
          <button
            onClick={handleOpenVault}
            className="w-full py-3 px-4 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 transition-colors font-medium"
          >
            Open or Create Vault
          </button>
        </div>
      </div>
    );
  }

  // Vaults exist - show vault selection UI
  return (
    <div className="vault-selector max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Your Vaults</h2>
        <button
          onClick={handleOpenVault}
          className="px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary/90 transition-colors"
        >
          Open New Vault
        </button>
      </div>

      <ul className="space-y-3">
        {vaults.map((vault) => (
          <li
            key={vault.id}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              activeVault?.id === vault.id
                ? "border-primary/50 bg-primary/5"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => handleSelectActiveVault(vault)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{vault.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{vault.path}</p>
              </div>
              <button
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveVault(vault.id);
                }}
                aria-label="Remove vault"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
