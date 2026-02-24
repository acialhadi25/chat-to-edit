import UniverSheetSimple from '@/components/univer/UniverSheetSimple';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UniverTest = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Univer Sheet Test (Simple)</h1>
      </div>

      {/* Univer Sheet */}
      <div className="flex-1 p-4">
        <UniverSheetSimple />
      </div>
    </div>
  );
};

export default UniverTest;
