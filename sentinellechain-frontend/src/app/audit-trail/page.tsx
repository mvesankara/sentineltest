"use client";

import React, { useEffect, useState, useCallback } from 'react';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import AuditTrailTable from '@/components/audit/AuditTrailTable';
import { Button } from '@/components/ui/button';
import { AuditTrailEntry } from '@/types/audit'; // To be created

const AuditTrailPage: React.FC = () => {
  const [auditEntries, setAuditEntries] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 15; // Or make this configurable

  const fetchAuditTrail = useCallback(async (page: number) => {
    if (!token) {
      setLoading(false);
      setError("Authentication token not found.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/audit?page=${page}&limit=${recordsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch audit trail');
      }
      const data = await response.json();
      setAuditEntries(data.data || []);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalRecords(data.pagination.totalRecords || 0);
      setCurrentPage(data.pagination.page || 1);
    } catch (err: any) {
      console.error("Error fetching audit trail:", err);
      setError(err.message);
      setAuditEntries([]); // Clear entries on error
    } finally {
      setLoading(false);
    }
  }, [token, recordsPerPage]);

  useEffect(() => {
    fetchAuditTrail(currentPage);
  }, [fetchAuditTrail, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading && auditEntries.length === 0) { // Show initial loader
    return <div className="p-6">Loading audit trail...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">Error fetching audit trail: {error}</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Audit Trail</h1>
        {/* Optional: Refresh button or date filters */}
      </div>
      <AuditTrailTable auditEntries={auditEntries} isLoading={loading} />
      {totalRecords > 0 && (
        <div className="flex items-center justify-between mt-4 p-4 bg-card rounded-lg shadow">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} (Total: {totalRecords} records)
          </span>
          <div className="space-x-2">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1 || loading}
              variant="outline"
            >
              Previous
            </Button>
            <Button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || loading}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(AuditTrailPage);
