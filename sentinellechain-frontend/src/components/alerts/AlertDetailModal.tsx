"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertStatus, AlertSeverity } from '@/types/alert';
import { ExternalLink, CheckCircle, XCircle, ShieldAlert, Info } from 'lucide-react';
// import { useAuth } from '@/contexts/AuthContext'; // For API calls later

interface AlertDetailModalProps {
  alert: Alert;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (alertId: string, newStatus: AlertStatus) => void; // For frontend state update
}

const severityColors: Record<AlertSeverity, string> = {
  CRITICAL: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-600", // Darker yellow for better readability on white bg
  LOW: "text-blue-500",
};

const statusColors: Record<AlertStatus, string> = {
  NEW: "border-blue-500 text-blue-500",
  ACKNOWLEDGED: "border-yellow-500 text-yellow-500",
  RESOLVED: "border-green-500 text-green-500",
  DISMISSED: "border-gray-500 text-gray-500",
};

const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ alert, isOpen, onClose, onUpdateStatus }) => {
  // const { token } = useAuth(); // For future API calls

  const handleStatusChange = async (newStatus: AlertStatus) => {
    // **API Preparation Placeholder**
    // try {
    //   const response = await fetch(`/api/alerts/${alert.id}/status`, {
    //     method: 'PUT',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`,
    //     },
    //     body: JSON.stringify({ status: newStatus }),
    //   });
    //   if (!response.ok) {
    //     const errorData = await response.json();
    //     throw new Error(errorData.error || `Failed to update status to ${newStatus}`);
    //   }
    //   onUpdateStatus(alert.id, newStatus); // Update state in parent on successful API call
    //   console.log(`Alert ${alert.id} status updated to ${newStatus} (simulated backend call)`);
    // } catch (error) {
    //   console.error("Error updating alert status:", error);
    //   // Handle error display to user if needed
    // }

    // For now, just update frontend state
    console.log(`Simulating status update for alert ${alert.id} to ${newStatus}. API call is commented out.`);
    onUpdateStatus(alert.id, newStatus);
    // Optionally close modal after action or allow multiple actions
    // onClose(); 
  };
  
  // Basic AI Insight generation (placeholder)
  const getAiInsight = (alert: Alert): string => {
    if (alert.log.content.toLowerCase().includes("failed login")) return "Pattern matched: Multiple failed login attempts detected.";
    if (alert.log.content.toLowerCase().includes("sql injection")) return "Pattern matched: Potential SQL injection attempt detected.";
    if (alert.log.eventType.toLowerCase().includes("firewall")) return `Pattern matched: Firewall event - ${alert.log.content.substring(0,50)}...`;
    return `Anomaly detected in log source '${alert.log.source}' with content matching standard alert patterns for severity ${alert.severity}.`;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldAlert className={`h-6 w-6 mr-2 ${severityColors[alert.severity]}`} />
            Alert Details: <span className="font-normal ml-1">{alert.log.eventType || `Log from ${alert.log.source}`}</span>
          </DialogTitle>
          <DialogDescription>
            Review the details of the security alert and associated log event.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Alert Information Section */}
          <div className="mb-4 p-4 border rounded-lg bg-card/50">
            <h3 className="text-lg font-semibold mb-3">Alert Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><strong>Alert ID:</strong> {alert.id}</div>
              <div><strong>Status:</strong> <Badge variant="outline" className={`${statusColors[alert.status]}`}>{alert.status}</Badge></div>
              <div><strong>Severity:</strong> <Badge className={`${severityColors[alert.severity].replace('text-', 'bg-').replace('-600', '-500')} hover:${severityColors[alert.severity].replace('text-', 'bg-').replace('-500', '-600')}`}>{alert.severity}</Badge></div>
              <div><strong>AI Confidence:</strong> {alert.aiConfidence ? `${(alert.aiConfidence * 100).toFixed(0)}%` : 'N/A'}</div>
              <div><strong>Alert Created:</strong> {new Date(alert.createdAt).toLocaleString()}</div>
              <div><strong>Log Timestamp:</strong> {new Date(alert.log.timestamp).toLocaleString()}</div>
            </div>
            {alert.blockchainHash && (
              <div className="mt-3">
                <strong>Blockchain Proof:</strong>
                <a
                  href={`https://mumbai.polygonscan.com/tx/${alert.blockchainHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-primary hover:underline flex items-center"
                >
                  <span>{`${alert.blockchainHash.substring(0, 10)}...${alert.blockchainHash.substring(alert.blockchainHash.length - 8)}`}</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            )}
          </div>

          {/* AI Insights Section */}
          <div className="mb-4 p-4 border rounded-lg bg-card/50">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-500" />
                AI Insights
            </h3>
            <p className="text-sm text-muted-foreground">{getAiInsight(alert)}</p>
          </div>
          
          {/* Full Log Content Section */}
          <div className="mb-4 p-4 border rounded-lg bg-card/50">
            <h3 className="text-lg font-semibold mb-2">Full Log Content</h3>
            <pre className="p-3 bg-muted text-muted-foreground rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(alert.log, null, 2)}
            </pre>
          </div>

        </div>

        <DialogFooter className="sm:justify-start border-t pt-4">
            <div className="flex flex-wrap gap-2">
                 {alert.status !== 'ACKNOWLEDGED' && alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED' && (
                    <Button onClick={() => handleStatusChange("ACKNOWLEDGED")} variant="outline">
                        <CheckCircle className="mr-2 h-4 w-4" /> Acknowledge
                    </Button>
                 )}
                 {alert.status !== 'RESOLVED' && (
                    <Button onClick={() => handleStatusChange("RESOLVED")} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                    </Button>
                 )}
                 {alert.status !== 'DISMISSED' && (
                    <Button onClick={() => handleStatusChange("DISMISSED")} variant="outline" className="text-gray-600 border-gray-600 hover:bg-gray-50 hover:text-gray-700">
                        <XCircle className="mr-2 h-4 w-4" /> Dismiss
                    </Button>
                 )}
            </div>
          <Button onClick={onClose} variant="outline" className="ml-auto">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDetailModal;
