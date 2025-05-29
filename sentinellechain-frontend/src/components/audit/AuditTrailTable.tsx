"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AuditTrailEntry } from '@/types/audit';
import { ChevronDown, ChevronRight } from 'lucide-react'; // For expanding details

interface AuditTrailTableProps {
  auditEntries: AuditTrailEntry[];
  isLoading: boolean; // To show a loading state within the table if needed
}

const AuditTrailTable: React.FC<AuditTrailTableProps> = ({ auditEntries, isLoading }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleRowExpansion = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  if (isLoading && auditEntries.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>Loading entries...</p>
      </div>
    );
  }
  
  if (!isLoading && auditEntries.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No audit trail entries found for this company.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead> {/* For expand icon */}
          <TableHead>Timestamp</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Details Summary</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auditEntries.map((entry) => (
          <React.Fragment key={entry.id}>
            <TableRow>
              <TableCell>
                {entry.details && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(entry.id)}
                    aria-expanded={expandedRowId === entry.id}
                  >
                    {expandedRowId === entry.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
              </TableCell>
              <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
              <TableCell>{entry.action}</TableCell>
              <TableCell>{entry.user?.email || entry.userId || 'System'}</TableCell>
              <TableCell className="truncate max-w-xs" title={entry.details ? JSON.stringify(entry.details) : 'N/A'}>
                {entry.details ? JSON.stringify(entry.details).substring(0, 70) + (JSON.stringify(entry.details).length > 70 ? '...' : '') : 'N/A'}
              </TableCell>
            </TableRow>
            {expandedRowId === entry.id && entry.details && (
              <TableRow>
                <TableCell colSpan={5} className="p-0"> {/* Remove padding for the inner cell */}
                  <div className="p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">Full Details:</h4>
                    <pre className="text-xs whitespace-pre-wrap break-all bg-background p-3 rounded-md border">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

export default AuditTrailTable;
