/**
 * Lazy-loaded dashboard components
 * These components are deferred to reduce initial bundle size
 */

import { lazy, Suspense, ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load non-critical components
export const ChartPreview = lazy(() => import("./ChartPreview"));
export const ChartCustomizer = lazy(() => import("./ChartCustomizer"));
export const TemplateGallery = lazy(() => import("./TemplateGallery"));
export const AuditReport = lazy(() => import("./AuditReport"));
export const InsightSummary = lazy(() => import("./InsightSummary"));
export const DataSummaryPreview = lazy(() => import("./DataSummaryPreview"));
export const ConditionalFormatPreview = lazy(() => import("./ConditionalFormatPreview"));

// Loading fallback components
export const ChartLoader = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-64 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

export const TemplateLoader = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

export const ReportLoader = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

// Higher-order component to wrap lazy components with Suspense
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  Loader: ComponentType = () => <Skeleton className="h-64 w-full" />
) {
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={<Loader />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-wrapped components with appropriate loaders
export const LazyChartPreview = withLazyLoading(ChartPreview, ChartLoader);
export const LazyChartCustomizer = withLazyLoading(ChartCustomizer, ChartLoader);
export const LazyTemplateGallery = withLazyLoading(TemplateGallery, TemplateLoader);
export const LazyAuditReport = withLazyLoading(AuditReport, ReportLoader);
export const LazyInsightSummary = withLazyLoading(InsightSummary, ReportLoader);
export const LazyDataSummaryPreview = withLazyLoading(DataSummaryPreview, ReportLoader);
export const LazyConditionalFormatPreview = withLazyLoading(ConditionalFormatPreview, ChartLoader);
