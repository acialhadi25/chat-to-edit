import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { PageLoader } from './components/ui/loading-fallback';
import { SkipLink } from './components/a11y/SkipLink';

// Eager load critical routes
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load non-critical routes
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ToolSelector = lazy(() => import('./pages/ToolSelector'));
const ExcelDashboard = lazy(() => import('./pages/ExcelDashboard'));
const MergeExcelDashboard = lazy(() => import('./pages/MergeExcelDashboard'));
const SplitExcelDashboard = lazy(() => import('./pages/SplitExcelDashboard'));
const DataEntryDashboard = lazy(() => import('./pages/DataEntryDashboard'));
const FileHistory = lazy(() => import('./pages/FileHistory'));
const Settings = lazy(() => import('./pages/Settings'));
const Products = lazy(() => import('./pages/Products'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Subscription = lazy(() => import('./pages/Subscription'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentPending = lazy(() => import('./pages/PaymentPending'));
const PaymentError = lazy(() => import('./pages/PaymentError'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SkipLink />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/products" element={<Products />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              {/* Payment Result Pages */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/pending" element={<PaymentPending />} />
              <Route path="/payment/error" element={<PaymentError />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ToolSelector />} />
                <Route path="excel" element={<ExcelDashboard />} />
                <Route path="merge" element={<MergeExcelDashboard />} />
                <Route path="split" element={<SplitExcelDashboard />} />
                <Route path="data-entry" element={<DataEntryDashboard />} />
                <Route path="history" element={<FileHistory />} />
                <Route path="settings" element={<Settings />} />
                <Route path="subscription" element={<Subscription />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
