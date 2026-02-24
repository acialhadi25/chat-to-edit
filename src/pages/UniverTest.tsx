import { useRef } from 'react';
import UniverSheet from '@/components/univer/UniverSheet';
import type { UniverSheetHandle } from '@/components/univer/UniverSheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UniverTest = () => {
  const navigate = useNavigate();
  const univerRef = useRef<UniverSheetHandle>(null);

  const handleGetData = () => {
    const data = univerRef.current?.getWorkbookData();
    console.log('Workbook data:', data);
  };

  const handleSetSampleData = () => {
    const sampleData = {
      sheets: {
        sheet1: {
          name: 'Sheet1',
          cellData: {
            0: {
              0: { v: 'Name' },
              1: { v: 'Age' },
              2: { v: 'City' },
            },
            1: {
              0: { v: 'John' },
              1: { v: 25 },
              2: { v: 'New York' },
            },
            2: {
              0: { v: 'Jane' },
              1: { v: 30 },
              2: { v: 'London' },
            },
          },
        },
      },
    };
    
    univerRef.current?.setWorkbookData(sampleData);
    console.log('Sample data set');
  };

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
        <h1 className="text-2xl font-bold">Univer Sheet Test</h1>
        <div className="flex-grow" />
        <Button variant="outline" size="sm" onClick={handleGetData}>
          Get Data
        </Button>
        <Button variant="default" size="sm" onClick={handleSetSampleData}>
          Load Sample Data
        </Button>
      </div>

      {/* Univer Sheet */}
      <div className="flex-1 p-4">
        <UniverSheet ref={univerRef} height="100%" />
      </div>
    </div>
  );
};

export default UniverTest;
