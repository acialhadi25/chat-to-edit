import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet, Calendar, Hash, Layers } from "lucide-react";
import { format } from "date-fns";

interface FileRecord {
  id: string;
  file_name: string;
  tool_type: string;
  sheets_count: number;
  rows_count: number;
  formulas_applied: number;
  created_at: string;
}

const toolConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  excel: { icon: FileSpreadsheet, label: "Excel", color: "bg-emerald-500/10 text-emerald-600" },
};

const FileHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      let query = supabase
        .from("file_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("tool_type", filter);
      }

      const { data, error } = await query;
      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to load file history",
          description: error.message || "Please try again later",
        });
      } else if (data) {
        setFiles(data);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [user, filter, toast]);

  const filters = [
    { value: "all", label: "All" },
    { value: "excel", label: "Excel" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">File History</h1>
        <p className="text-muted-foreground">View all files you've edited</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Badge
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Badge>
        ))}
      </div>

      {/* File List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileSpreadsheet className="mb-3 h-12 w-12 text-muted-foreground" />
            <h3 className="font-medium text-foreground">No files yet</h3>
            <p className="text-sm text-muted-foreground">Files you edit will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => {
            const config = toolConfig[file.tool_type] || toolConfig.excel;
            const Icon = config.icon;
            return (
              <Card key={file.id} className="transition-colors hover:bg-accent/30">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-foreground">{file.file_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(file.created_at), "MMM d, yyyy HH:mm")}
                      </span>
                      {file.tool_type === "excel" && (
                        <>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {file.sheets_count} sheets
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {file.rows_count} rows
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className={config.color}>
                    {config.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileHistory;
