"use client";

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Download } from "lucide-react"; // Added Download icon
import { Alert, AlertSeverity, AlertStatus } from '@/types/alert';
import AlertDetailModal from './AlertDetailModal';
import { useAuth } from '@/contexts/AuthContext'; // For token
import { Input } from "@/components/ui/input"; // For date inputs
import { Label } from "@/components/ui/label"; // For date input labels
// For toast notifications (optional, but good for UX)
// import { useToast } from "@/components/ui/use-toast"; 

interface AlertsTableProps {
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>; 
}

const severityColors: Record<AlertSeverity, string> = {
  CRITICAL: "bg-red-500 hover:bg-red-600",
  HIGH: "bg-orange-500 hover:bg-orange-600",
  MEDIUM: "bg-yellow-500 hover:bg-yellow-600 text-black", // Yellow often needs black text
  LOW: "bg-blue-500 hover:bg-blue-600",
};

const statusColors: Record<AlertStatus, string> = {
  NEW: "border-blue-500 text-blue-500",
  ACKNOWLEDGED: "border-yellow-500 text-yellow-500",
  RESOLVED: "border-green-500 text-green-500",
  DISMISSED: "border-gray-500 text-gray-500",
};


const AlertsTable: React.FC<AlertsTableProps> = ({ alerts, setAlerts }) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth(); // Get token for API calls
  // const { toast } = useToast(); // Optional: for notifications

  // Filtering states
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>(''); // YYYY-MM-DD
  const [endDateFilter, setEndDateFilter] = useState<string>('');   // YYYY-MM-DD
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleViewDetails = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlert(null);
  };

  const updateAlertStatusInList = (alertId: string, newStatus: AlertStatus) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      )
    );
  };

  const handleExportJSON = async () => {
    if (!token) {
      // toast({ title: "Authentication Error", description: "No token found. Please login again.", variant: "destructive" });
      alert("Authentication Error: No token found. Please login again.");
      return;
    }
    setIsExporting(true);
    // toast({ title: "Exporting Alerts", description: "Preparing your JSON file..." });
    console.log("Preparing to export alerts as JSON...");

    const queryParams = new URLSearchParams();
    if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
    if (severityFilter !== 'ALL') queryParams.append('severity', severityFilter);
    if (startDateFilter) queryParams.append('startDate', startDateFilter);
    if (endDateFilter) queryParams.append('endDate', endDateFilter);

    try {
      const response = await fetch(`/api/reports/alerts/json?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export alerts');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract filename from Content-Disposition header if available, otherwise use a default
      const disposition = response.headers.get('Content-Disposition');
      let filename = `sentinellechain_alerts_export_${new Date().toISOString().split('T')[0]}.json`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      // toast({ title: "Export Successful", description: "Alerts JSON file downloaded." });
      console.log("Alerts JSON file downloaded successfully.");
    } catch (error: any) {
      console.error("Error exporting alerts:", error);
      // toast({ title: "Export Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
      alert(`Export Failed: ${error.message || "An unknown error occurred."}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  const filteredAlerts = useMemo(() => {
    // Client-side filtering for display. Export uses backend filtering.
    return alerts.filter(alert => {
      const severityMatch = severityFilter === 'ALL' || alert.severity === severityFilter;
      const statusMatch = statusFilter === 'ALL' || alert.status === statusFilter;
      // Basic client-side date filtering (can be improved or removed if relying solely on backend for export)
      const startDateMatch = !startDateFilter || new Date(alert.createdAt) >= new Date(startDateFilter);
      const endDateMatch = !endDateFilter || new Date(alert.createdAt) <= new Date(new Date(endDateFilter).setHours(23, 59, 59, 999)); // Include whole end day
      return severityMatch && statusMatch && startDateMatch && endDateMatch;
    });
  }, [alerts, severityFilter, statusFilter, startDateFilter, endDateFilter]);


  return (
    <>
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4 p-4 bg-card rounded-lg shadow items-end">
        <div>
          <Label htmlFor="severityFilter" className="block text-sm font-medium text-muted-foreground mb-1">Severity</Label>
          <select
            id="severityFilter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'ALL')}
            className="h-10 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-input text-foreground"
          >
            <option value="ALL">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div>
          <Label htmlFor="statusFilter" className="block text-sm font-medium text-muted-foreground mb-1">Status</Label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'ALL')}
            className="h-10 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-input text-foreground"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
        {/* Date Filters */}
        <div>
          <Label htmlFor="startDateFilter" className="block text-sm font-medium text-muted-foreground mb-1">Start Date</Label>
          <Input
            id="startDateFilter"
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="h-10 block w-full"
          />
        </div>
        <div>
          <Label htmlFor="endDateFilter" className="block text-sm font-medium text-muted-foreground mb-1">End Date</Label>
          <Input
            id="endDateFilter"
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="h-10 block w-full"
          />
        </div>

        {/* Export Button */}
        <div className="self-end"> {/* Aligns button with the bottom of other filter inputs */}
          <Button
            onClick={handleExportJSON}
            variant="outline"
            size="sm" 
            className="h-10 w-full md:w-auto" // Full width on small screens, auto on medium+
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export JSON"}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Log Source</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAlerts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No alerts match the current filters.
              </TableCell>
            </TableRow>
          )}
          {filteredAlerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                <Badge className={`${severityColors[alert.severity]}`}>{alert.severity}</Badge>
              </TableCell>
              <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
              <TableCell>{alert.log.source}</TableCell>
              <TableCell className="max-w-xs truncate" title={alert.log.eventType || alert.log.content}>
                {alert.log.eventType || alert.log.content.substring(0, 70) + (alert.log.content.length > 70 ? '...' : '')}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${statusColors[alert.status]}`}>{alert.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleViewDetails(alert)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {/* Future actions can be added here */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdateStatus={updateAlertStatusInList} // Pass the update function
        />
      )}
    </>
  );
};

export default AlertsTable;
