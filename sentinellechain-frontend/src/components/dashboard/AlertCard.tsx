import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from 'lucide-react'; // For link icon

interface AlertCardProps {
  title: string;
  severity: "HIGH" | "CRITICAL" | "MEDIUM" | "LOW";
  description: string;
  timestamp: string;
  blockchainHash?: string | null; // Added blockchainHash prop
}

const AlertCard: React.FC<AlertCardProps> = ({ title, severity, description, timestamp, blockchainHash }) => {
  const severityVariant = {
    CRITICAL: "destructive",
    HIGH: "destructive",
    MEDIUM: "secondary",
    LOW: "outline",
  } as const;

  const explorerBaseUrl = "https://mumbai.polygonscan.com/tx/";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <Badge variant={severityVariant[severity]}>{severity}</Badge>
        </CardTitle>
        <CardDescription>{timestamp}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-2">{description}</p>
        {blockchainHash && (
          <div className="mt-2 pt-2 border-t">
            <h4 className="text-sm font-semibold mb-1">Blockchain Proof:</h4>
            <a
              href={`${explorerBaseUrl}${blockchainHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center"
            >
              <span>{`${blockchainHash.substring(0, 10)}...${blockchainHash.substring(blockchainHash.length - 8)}`}</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertCard;
