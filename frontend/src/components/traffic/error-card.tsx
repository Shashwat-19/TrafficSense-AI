import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({ message, onRetry, className }: ErrorCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
