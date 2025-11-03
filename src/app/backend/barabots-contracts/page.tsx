"use client";
import { useAccount } from "wagmi";
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, AlertCircle, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Contract {
  contract_address: string;
  category: string | null;
  notes: string | null;
  transaction_count: number;
  last_seen: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  address?: string;
}

const ALL_CATEGORIES = ['BUILD', 'WORK', 'DEFI', 'LEARN', 'CULTURE', 'unknown'];

const BarabotsContractsPage = () => {
  const { address, isConnected } = useAccount();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [updatingContract, setUpdatingContract] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [editedNotesValue, setEditedNotesValue] = useState<string>('');

  useEffect(() => {
    if (isConnected && address) {
      checkAuthAndLoadContracts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const checkAuthAndLoadContracts = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/session');
      const authData = await authResponse.json();
      setAuthStatus(authData);

      if (!authData.isAuthenticated) {
        setIsLoading(false);
        return;
      }

      // Load contracts
      await loadContracts();
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await fetch('/api/barabots-contracts');
      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContractCategory = async (contractAddress: string, category: string) => {
    setUpdatingContract(contractAddress);
    try {
      const response = await fetch('/api/barabots-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress, category, adminAddress: address })
      });

      if (response.ok) {
        // Refresh the contracts list
        await loadContracts();
      } else {
        alert('Failed to update contract category');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Error updating contract category');
    } finally {
      setUpdatingContract(null);
    }
  };

  const startEditingNotes = (contractAddress: string, currentNotes: string | null) => {
    setEditingNotes(contractAddress);
    setEditedNotesValue(currentNotes || '');
  };

  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setEditedNotesValue('');
  };

  const updateContractNotes = async (contractAddress: string) => {
    try {
      const response = await fetch('/api/barabots-contracts/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contractAddress, 
          notes: editedNotesValue,
          adminAddress: address 
        })
      });

      if (response.ok) {
        // Update the local state
        setContracts(contracts.map(c => 
          c.contract_address === contractAddress 
            ? { ...c, notes: editedNotesValue }
            : c
        ));
        setEditingNotes(null);
        setEditedNotesValue('');
      } else {
        alert('Failed to update contract notes');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Error updating contract notes');
    }
  };

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Barabots Contract Management</h1>
              <p className="text-gray-600">Please connect your wallet to access the admin panel.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading contract data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!authStatus?.isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-gray-600">You don&apos;t have permission to access this admin panel.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Barabots Contract Categorization</h1>
              <p className="text-gray-600">
                Assign categories to contracts found in user transactions. This determines which transactions
                can be paired with NFTs of matching categories.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/backend/barabots-whitelist">Manage Whitelist</a>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contract Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No contracts found yet. Contracts will appear here as users interact with them on the pairing page.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Unassigned contracts first */}
                {contracts.filter(c => c.category === null).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-red-600">
                      🔴 Unassigned ({contracts.filter(c => c.category === null).length})
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      These contracts have not been categorized yet. Assign a category to make them available for pairing.
                    </p>
                    {contracts
                      .filter(c => c.category === null)
                      .map((contract) => (
                        <div key={contract.contract_address} className="flex items-start justify-between p-4 border-2 border-red-200 rounded-lg bg-red-50 mb-2">
                          <div className="flex-1">
                            <div className="font-mono text-sm text-gray-800 mb-1">
                              {contract.contract_address}
                            </div>
                            {editingNotes === contract.contract_address ? (
                              <div className="flex items-center gap-2 mb-1">
                                <Input
                                  value={editedNotesValue}
                                  onChange={(e) => setEditedNotesValue(e.target.value)}
                                  className="text-sm h-8"
                                  placeholder="Enter contract name or notes"
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateContractNotes(contract.contract_address)}
                                  className="p-1 hover:bg-green-100 rounded"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </button>
                                <button
                                  onClick={cancelEditingNotes}
                                  className="p-1 hover:bg-red-100 rounded"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-medium text-gray-700">
                                  {contract.notes || 'No name'}
                                </div>
                                <button
                                  onClick={() => startEditingNotes(contract.contract_address, contract.notes)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Edit name"
                                >
                                  <Pencil className="h-3 w-3 text-gray-600" />
                                </button>
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Added: {new Date(contract.last_seen).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Select
                              value=""
                              onValueChange={(value) => updateContractCategory(contract.contract_address, value)}
                              disabled={updatingContract === contract.contract_address}
                            >
                              <SelectTrigger className="w-40 bg-white">
                                <SelectValue placeholder="Assign category" />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {updatingContract === contract.contract_address && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Unknown category - explicitly marked as unknown */}
                {contracts.filter(c => c.category === 'unknown').length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-orange-600">
                      ⚠️ Unknown ({contracts.filter(c => c.category === 'unknown').length})
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      These contracts have been reviewed and marked as unknown. They won&apos;t be available for pairing.
                    </p>
                    {contracts
                      .filter(c => c.category === 'unknown')
                      .map((contract) => (
                        <div key={contract.contract_address} className="flex items-start justify-between p-4 border-2 border-orange-200 rounded-lg bg-orange-50 mb-2">
                          <div className="flex-1">
                            <div className="font-mono text-sm text-gray-800 mb-1">
                              {contract.contract_address}
                            </div>
                            {editingNotes === contract.contract_address ? (
                              <div className="flex items-center gap-2 mb-1">
                                <Input
                                  value={editedNotesValue}
                                  onChange={(e) => setEditedNotesValue(e.target.value)}
                                  className="text-sm h-8"
                                  placeholder="Enter contract name or notes"
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateContractNotes(contract.contract_address)}
                                  className="p-1 hover:bg-green-100 rounded"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </button>
                                <button
                                  onClick={cancelEditingNotes}
                                  className="p-1 hover:bg-red-100 rounded"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-medium text-gray-700">
                                  {contract.notes || 'No name'}
                                </div>
                                <button
                                  onClick={() => startEditingNotes(contract.contract_address, contract.notes)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Edit name"
                                >
                                  <Pencil className="h-3 w-3 text-gray-600" />
                                </button>
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Added: {new Date(contract.last_seen).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium">UNKNOWN</span>
                            </div>
                            <Select
                              value="unknown"
                              onValueChange={(value) => updateContractCategory(contract.contract_address, value)}
                              disabled={updatingContract === contract.contract_address}
                            >
                              <SelectTrigger className="w-32 bg-white">
                                <SelectValue placeholder="Change" />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {updatingContract === contract.contract_address && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Categorized contracts */}
                {contracts.filter(c => c.category && c.category !== 'unknown').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-600">
                      ✓ Categorized ({contracts.filter(c => c.category && c.category !== 'unknown').length})
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      These contracts are properly categorized and available for pairing with matching NFTs.
                    </p>
                    {contracts
                      .filter(c => c.category && c.category !== 'unknown')
                      .map((contract) => (
                        <div key={contract.contract_address} className="flex items-start justify-between p-4 border rounded-lg mb-2">
                          <div className="flex-1">
                            <div className="font-mono text-sm text-gray-600 mb-1">
                              {contract.contract_address}
                            </div>
                            {editingNotes === contract.contract_address ? (
                              <div className="flex items-center gap-2 mb-1">
                                <Input
                                  value={editedNotesValue}
                                  onChange={(e) => setEditedNotesValue(e.target.value)}
                                  className="text-sm h-8"
                                  placeholder="Enter contract name or notes"
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateContractNotes(contract.contract_address)}
                                  className="p-1 hover:bg-green-100 rounded"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </button>
                                <button
                                  onClick={cancelEditingNotes}
                                  className="p-1 hover:bg-red-100 rounded"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm text-gray-700">
                                  {contract.notes || 'No name'}
                                </div>
                                <button
                                  onClick={() => startEditingNotes(contract.contract_address, contract.notes)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Edit name"
                                >
                                  <Pencil className="h-3 w-3 text-gray-600" />
                                </button>
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Added: {new Date(contract.last_seen).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">{contract.category}</span>
                            </div>
                            <Select
                              value={contract.category || ""}
                              onValueChange={(value) => updateContractCategory(contract.contract_address, value)}
                              disabled={updatingContract === contract.contract_address}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Change" />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {updatingContract === contract.contract_address && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Category Guide:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>BUILD</strong> - Contracts for creating/building on-chain infrastructure</li>
            <li><strong>WORK</strong> - Contracts for work, jobs, or professional services</li>
            <li><strong>DEFI</strong> - Decentralized finance protocols and services</li>
            <li><strong>LEARN</strong> - Educational platforms and learning contracts</li>
            <li><strong>CULTURE</strong> - Art, gaming, entertainment, and cultural contracts</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default BarabotsContractsPage;